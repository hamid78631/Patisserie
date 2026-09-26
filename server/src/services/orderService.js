import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { GiftCard, Order, Product, PromoCode, Settings, generateGiftCardCode, nextSequence } from '../models/index.js';
import { badRequest, conflict } from '../lib/errors.js';
import { computePricing, minimumOrderBase } from '../lib/pricing.js';
import * as payments from '../lib/payments.js';
import { notifyGiftCard, notifyOrder } from '../lib/notifications.js';

// ---------------------------------------------------------------------------
// Validation des entrées
// ---------------------------------------------------------------------------

const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), 'Identifiant invalide');

const addressSchema = z.object({
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(2).max(100),
  postalCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]\d[A-Z] ?\d[A-Z]\d$/, 'Code postal invalide')
    .transform((v) => v.replace(/^(.{3})\s?(.{3})$/, '$1 $2')),
});

export const cartSchema = z.object({
  locale: z.enum(['fr', 'en']).default('fr'),
  items: z
    .array(
      z.object({
        productId: objectId,
        variantId: objectId,
        quantity: z.number().int().min(1).max(50),
        message: z.string().trim().max(200).optional(),
      }),
    )
    .min(1)
    .max(30),
  fulfillment: z
    .object({
      type: z.enum(['delivery', 'pickup']),
      address: addressSchema.optional(),
    })
    .optional(),
  promoCode: z.string().trim().toUpperCase().max(40).optional().or(z.literal('')),
  giftCardCode: z.string().trim().toUpperCase().max(40).optional().or(z.literal('')),
});

export const orderSchema = cartSchema.extend({
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    phone: z
      .string()
      .trim()
      .refine((v) => v.replace(/\D/g, '').length >= 10, 'Téléphone invalide'),
  }),
  customerNotes: z.string().trim().max(1000).optional(),
  paymentMethod: z.enum(['stripe', 'interac']),
});

// ---------------------------------------------------------------------------
// Construction du brouillon (utilisée pour le devis du panier ET la commande)
// ---------------------------------------------------------------------------

/**
 * Résout les produits, applique les règles de la boutique et calcule les montants.
 * Ne modifie rien en base. Retourne { draft, errors } : errors est une liste de codes.
 */
export async function buildDraft(input) {
  const settings = await Settings.get();
  const errors = [];

  if (!settings.ordersOpen) errors.push('orders_closed');

  // --- Articles -----------------------------------------------------------
  const ids = [...new Set(input.items.map((i) => i.productId))];
  const products = await Product.find({ _id: { $in: ids } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = [];
  for (const it of input.items) {
    const product = byId.get(it.productId);
    if (!product || !product.isAvailable()) {
      errors.push('product_unavailable');
      continue;
    }
    const variant = product.variants.id(it.variantId);
    if (!variant || !variant.active) {
      errors.push('variant_unavailable');
      continue;
    }
    items.push({
      product: product._id,
      productName: { fr: product.name.fr, en: product.name.en || product.name.fr },
      variantId: variant._id,
      variantLabel: { fr: variant.label.fr, en: variant.label.en || variant.label.fr },
      unitPrice: variant.price,
      quantity: it.quantity,
      message: product.allowsMessage && it.message ? it.message : undefined,
      isGiftCard: product.isGiftCard,
      taxable: product.taxable,
      leadTimeHours: product.leadTimeHours,
    });
  }

  // --- Mode de réception ---------------------------------------------------
  const onlyGiftCards = items.length > 0 && items.every((i) => i.isGiftCard);
  let fulfillment = { type: 'none' };
  if (!onlyGiftCards) {
    const f = input.fulfillment;
    if (!f) {
      errors.push('fulfillment_required');
    } else if (f.type === 'pickup') {
      if (!settings.pickupEnabled) errors.push('pickup_disabled');
      fulfillment = { type: 'pickup' };
    } else {
      if (!settings.deliveryEnabled) errors.push('delivery_disabled');
      if (!f.address) {
        errors.push('address_required');
      } else {
        const prefix = f.address.postalCode.slice(0, 2);
        if (!settings.deliveryPostalPrefixes.includes(prefix)) errors.push('delivery_zone');
      }
      fulfillment = { type: 'delivery', address: f.address };
    }
  }

  // --- Minimum de commande -------------------------------------------------
  const minBase = minimumOrderBase(items);
  if (!onlyGiftCards && minBase < settings.minimumOrder) errors.push('below_minimum');

  // --- Code promo ----------------------------------------------------------
  let promo = null;
  if (input.promoCode) {
    const doc = await PromoCode.findOne({ code: input.promoCode });
    const reason = doc ? doc.rejectionReason(minBase) : 'promo_invalid';
    if (reason) errors.push(reason);
    else promo = doc;
  }

  // --- Carte-cadeau ----------------------------------------------------------
  let giftCard = null;
  if (input.giftCardCode) {
    const doc = await GiftCard.findOne({ code: input.giftCardCode });
    if (!doc || !doc.isUsable()) errors.push('giftcard_invalid');
    else giftCard = doc;
  }

  const { lines, pricing } = computePricing({
    items,
    fulfillmentType: fulfillment.type,
    settings,
    promo: promo && { type: promo.type, value: promo.value },
    giftCardBalance: giftCard?.balance || 0,
  });

  return {
    errors: [...new Set(errors)],
    settings,
    draft: {
      items: lines,
      fulfillment,
      pricing,
      promoCode: promo?.code,
      giftCardCode: giftCard?.code,
      minimumOrder: settings.minimumOrder,
      maxLeadTimeHours: Math.max(0, ...lines.map((l) => l.leadTimeHours || 0)),
    },
  };
}

// ---------------------------------------------------------------------------
// Création de commande
// ---------------------------------------------------------------------------

export async function createOrder(input, { user } = {}) {
  const { draft, errors, settings } = await buildDraft(input);
  if (errors.length) throw badRequest('order_invalid', 'La commande ne peut pas être passée', errors);

  const { pricing } = draft;
  let method = input.paymentMethod;
  if (pricing.amountDue === 0) method = 'giftcard';
  else if (method === 'stripe' && !settings.stripeEnabled) throw badRequest('payment_method_disabled');
  else if (method === 'interac' && !settings.interacEnabled) throw badRequest('payment_method_disabled');

  const year = new Date().getFullYear();
  const seq = await nextSequence(`order-${year}`);
  const trackingToken = crypto.randomBytes(24).toString('hex');

  const order = new Order({
    number: `P-${year}-${String(seq).padStart(4, '0')}`,
    trackingToken,
    locale: input.locale,
    user: user?.id,
    customer: input.customer,
    items: draft.items,
    fulfillment: draft.fulfillment,
    customerNotes: input.customerNotes,
    pricing,
    promoCode: draft.promoCode,
    giftCardCode: pricing.giftCardApplied > 0 ? draft.giftCardCode : undefined,
    payment: { method, status: 'pending' },
  });
  order.setStatus('pending_payment', 'customer');

  // Réservations atomiques : solde de la carte-cadeau et utilisation du code promo
  const rollbacks = [];
  try {
    if (order.giftCardCode) {
      const res = await GiftCard.updateOne(
        { code: order.giftCardCode, active: true, balance: { $gte: pricing.giftCardApplied } },
        { $inc: { balance: -pricing.giftCardApplied } },
      );
      if (res.modifiedCount !== 1) throw conflict('giftcard_changed', 'Le solde de la carte-cadeau a changé');
      rollbacks.push(() => GiftCard.updateOne({ code: order.giftCardCode }, { $inc: { balance: pricing.giftCardApplied } }));
    }
    if (order.promoCode) {
      // Filtre atomique : l'incrément n'a lieu que s'il reste des utilisations
      const promo = await PromoCode.findOne({ code: order.promoCode }).select('maxUses');
      const filter = { code: order.promoCode };
      if (promo?.maxUses != null) filter.uses = { $lt: promo.maxUses };
      const res = await PromoCode.updateOne(filter, { $inc: { uses: 1 } });
      if (res.modifiedCount !== 1) throw conflict('promo_exhausted', 'Ce code promo n’est plus disponible');
      rollbacks.push(() => PromoCode.updateOne({ code: order.promoCode }, { $inc: { uses: -1 } }));
    }

    let clientSecret = null;
    if (method === 'stripe') {
      const intent = await payments.createAuthorization({
        amount: pricing.amountDue,
        orderNumber: order.number,
        orderId: order._id,
        email: order.customer.email,
      });
      order.payment.intentId = intent.id;
      clientSecret = intent.clientSecret;
      await order.save();
      // Mode simulé : on considère la carte pré-autorisée immédiatement
      if (intent.mock) await markAuthorized(order, { trackingToken });
    } else if (method === 'interac') {
      order.payment.status = 'awaiting_transfer';
      order.setStatus('received', 'system');
      await order.save();
      notifyOrder('received', order, { trackingToken, interacEmail: settings.interacEmail });
    } else {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
      order.setStatus('received', 'system', 'Payée entièrement par carte-cadeau');
      await order.save();
      notifyOrder('received', order, { trackingToken });
    }

    return { order, trackingToken, clientSecret, paymentsMode: payments.paymentsMode };
  } catch (err) {
    await Promise.allSettled(rollbacks.map((fn) => fn()));
    if (!order.isNew) await Order.deleteOne({ _id: order._id }).catch(() => {});
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Cycle de vie du paiement et de la commande
// ---------------------------------------------------------------------------

/** Appelé par le webhook Stripe (ou immédiatement en mode simulé). Idempotent. */
export async function markAuthorized(order, { trackingToken } = {}) {
  if (order.status !== 'pending_payment') return order;
  order.payment.status = 'authorized';
  order.payment.authorizedAt = new Date();
  order.setStatus('received', 'system', 'Paiement pré-autorisé');
  await order.save();
  notifyOrder('received', order, { trackingToken });
  return order;
}

/** L'admin confirme la commande (date convenue) : capture de la pré-autorisation. */
export async function confirmOrder(order, { by, scheduledFor, note }) {
  if (order.status !== 'received') throw badRequest('invalid_transition', 'Seule une commande reçue peut être confirmée');
  if (order.payment.method === 'stripe') {
    if (order.payment.status !== 'authorized') throw badRequest('payment_not_authorized');
    await payments.capture(order.payment.intentId);
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
  }
  if (scheduledFor) order.scheduledFor = scheduledFor;
  order.setStatus('confirmed', by, note);
  await order.save();
  if (order.payment.status === 'paid') await issueGiftCards(order);
  notifyOrder('confirmed', order);
  return order;
}

/** Changement de statut simple (préparation, prête, terminée). */
export async function advanceStatus(order, status, { by, note }) {
  const allowed = { confirmed: ['in_preparation', 'ready', 'completed'], in_preparation: ['ready', 'completed'], ready: ['completed'] };
  if (!allowed[order.status]?.includes(status)) throw badRequest('invalid_transition', `Transition ${order.status} → ${status} impossible`);
  order.setStatus(status, by, note);
  await order.save();
  if (status === 'ready') notifyOrder('ready', order);
  return order;
}

export async function markInteracReceived(order, { by }) {
  if (order.payment.method !== 'interac' || order.payment.status !== 'awaiting_transfer') {
    throw badRequest('invalid_payment_state', 'Aucun virement Interac en attente pour cette commande');
  }
  order.payment.status = 'paid';
  order.payment.paidAt = new Date();
  order.statusHistory.push({ status: order.status, by, note: 'Virement Interac reçu' });
  await order.save();
  await issueGiftCards(order);
  return order;
}

/**
 * Annulation. Pré-autorisation Stripe : libérée (aucun débit).
 * Paiement déjà capturé : remboursé si refund = true.
 */
export async function cancelOrder(order, { by, reason, refund = true, isCustomer = false }) {
  if (order.status === 'cancelled') return order;
  if (isCustomer && !['pending_payment', 'received'].includes(order.status)) {
    throw badRequest('cannot_cancel', 'La commande est déjà confirmée ; contactez-nous pour l’annuler');
  }
  if (order.status === 'completed') throw badRequest('cannot_cancel', 'Commande déjà terminée');

  const p = order.payment;
  if (p.method === 'stripe' && p.intentId) {
    if (['pending', 'authorized'].includes(p.status)) {
      await payments.voidAuthorization(p.intentId);
      p.status = 'voided';
    } else if (['paid', 'partially_refunded'].includes(p.status) && refund) {
      const toRefund = order.pricing.amountDue - p.refundedAmount;
      if (toRefund > 0) await payments.refund(p.intentId, toRefund);
      p.refundedAmount += toRefund;
      p.status = 'refunded';
    }
  } else if (p.method === 'interac' && p.status === 'awaiting_transfer') {
    p.status = 'voided';
  }
  // Interac payé : le remboursement se fait manuellement, à noter par l'admin

  const wasPlaced = order.status !== 'pending_payment';
  // Annulation sans remboursement d'une commande payée : le client garde ce qu'il a acheté
  // (cartes-cadeaux émises) et la carte-cadeau utilisée pour payer n'est pas recréditée.
  const refunded = refund || !['paid', 'partially_refunded'].includes(p.status);
  await restoreReservations(order, { giftCard: refunded });
  if (refunded) await deactivateIssuedGiftCards(order, by);
  order.cancelReason = reason;
  order.setStatus('cancelled', by, reason);
  await order.save();
  // Pas de message pour un paiement abandonné : le client n'a jamais reçu de confirmation
  if (wasPlaced) notifyOrder('cancelled', order);
  return order;
}

/** Remboursement partiel ou total d'une commande payée par Stripe. */
export async function refundOrder(order, { amount, by, note }) {
  const p = order.payment;
  if (p.method !== 'stripe' || !['paid', 'partially_refunded'].includes(p.status)) {
    throw badRequest('not_refundable', 'Seuls les paiements Stripe débités peuvent être remboursés ici');
  }
  const remaining = order.pricing.amountDue - p.refundedAmount;
  const value = amount ?? remaining;
  if (value <= 0 || value > remaining) throw badRequest('invalid_amount', `Montant remboursable : 0 à ${remaining} cents`);
  await payments.refund(p.intentId, value);
  p.refundedAmount += value;
  p.status = p.refundedAmount >= order.pricing.amountDue ? 'refunded' : 'partially_refunded';
  order.statusHistory.push({ status: order.status, by, note: note || `Remboursement de ${(value / 100).toFixed(2)} $` });
  // Remboursement total : les cartes-cadeaux achetées dans la commande ne doivent plus servir
  if (p.status === 'refunded') await deactivateIssuedGiftCards(order, by);
  await order.save();
  return order;
}

/**
 * Désactive les cartes-cadeaux achetées dans une commande annulée ou remboursée,
 * pour qu'elles ne puissent plus être utilisées. Si une carte a déjà servi en partie,
 * une note le signale dans l'historique (à régler avec le client).
 */
async function deactivateIssuedGiftCards(order, by) {
  const codes = order.giftCardsIssued || [];
  if (codes.length === 0) return;
  const cards = await GiftCard.find({ code: { $in: codes }, active: true });
  if (cards.length === 0) return;
  await GiftCard.updateMany({ code: { $in: cards.map((c) => c.code) } }, { $set: { active: false } });
  const used = cards.filter((c) => c.balance < c.initialBalance);
  const note = used.length
    ? `Cartes-cadeaux désactivées (${codes.join(', ')}). Attention : déjà utilisées en partie : ${used.map((c) => c.code).join(', ')}`
    : `Cartes-cadeaux désactivées (${codes.join(', ')})`;
  order.statusHistory.push({ status: order.status, by, note });
}

async function restoreReservations(order, { giftCard = true } = {}) {
  if (giftCard && order.giftCardCode && order.pricing.giftCardApplied > 0) {
    await GiftCard.updateOne({ code: order.giftCardCode }, { $inc: { balance: order.pricing.giftCardApplied } });
  }
  if (order.promoCode) {
    await PromoCode.updateOne({ code: order.promoCode, uses: { $gt: 0 } }, { $inc: { uses: -1 } });
  }
}

/** Crée les cartes-cadeaux achetées dans une commande, une fois payée. Idempotent. */
export async function issueGiftCards(order) {
  const giftItems = order.items.filter((i) => i.isGiftCard);
  const expected = giftItems.reduce((n, i) => n + i.quantity, 0);
  if (expected === 0 || (order.giftCardsIssued?.length || 0) >= expected) return;

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 5);
  for (const item of giftItems) {
    for (let k = 0; k < item.quantity; k += 1) {
      const card = await GiftCard.create({
        code: generateGiftCardCode(),
        initialBalance: item.unitPrice,
        balance: item.unitPrice,
        expiresAt,
        purchaseOrder: order._id,
        recipientEmail: order.customer.email,
      });
      order.giftCardsIssued.push(card.code);
      await notifyGiftCard(card, order);
    }
  }
  await order.save();
}

/** Annule les commandes Stripe jamais payées (formulaire abandonné) après `maxAgeMinutes`. */
export async function expireAbandonedOrders(maxAgeMinutes = 60) {
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  const stale = await Order.find({ status: 'pending_payment', createdAt: { $lt: cutoff } });
  for (const order of stale) {
    await cancelOrder(order, { by: 'system', reason: 'Paiement non complété' }).catch((err) =>
      console.error('Expiration commande', order.number, err.message),
    );
  }
  return stale.length;
}
