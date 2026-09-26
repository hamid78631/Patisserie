import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { GiftCard, Order, User } from '../models/index.js';
import { asyncHandler, notFound } from '../lib/errors.js';
import { limiter } from '../lib/rateLimit.js';
import { buildDraft, cancelOrder, cartSchema, createOrder, orderSchema } from '../services/orderService.js';

const router = Router();

const orderLimiter = limiter(20);

/** Devis du panier : montants et erreurs éventuelles, sans rien enregistrer. */
router.post(
  '/cart/quote',
  asyncHandler(async (req, res) => {
    const input = cartSchema.parse(req.body);
    const { draft, errors } = await buildDraft(input);
    res.json({ ...draft, errors });
  }),
);

router.post(
  '/orders',
  orderLimiter,
  asyncHandler(async (req, res) => {
    const input = orderSchema.parse(req.body);
    const { order, trackingToken, clientSecret, paymentsMode } = await createOrder(input, { user: req.user });
    res.status(201).json({
      order: order.toPublic(),
      trackingToken,
      clientSecret, // à passer à Stripe Elements côté client
      paymentsMode,
    });
  }),
);

/** Suivi d'une commande : jeton reçu à la commande, ou compte propriétaire. */
async function findTrackedOrder(req) {
  const order = await Order.findOne({ number: req.params.number }).select('+trackingToken');
  if (!order) throw notFound('Commande introuvable');
  const token = String(req.query.t || req.body?.token || '');
  if (token && sameToken(token, order.trackingToken)) return order;
  const ownsIt = req.user && order.user && String(order.user) === req.user.id;
  if (ownsIt) return order;
  // Rôle admin relu en base (une administratrice retirée perd l'accès immédiatement)
  if (req.user?.role === 'admin' && (await User.exists({ _id: req.user.id, role: 'admin' }))) return order;
  throw notFound('Commande introuvable');
}

/** Comparaison en temps constant (évite de deviner le jeton caractère par caractère). */
function sameToken(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

router.get(
  '/orders/track/:number',
  asyncHandler(async (req, res) => {
    const order = await findTrackedOrder(req);
    res.json(order.toPublic());
  }),
);

router.post(
  '/orders/track/:number/cancel',
  asyncHandler(async (req, res) => {
    const order = await findTrackedOrder(req);
    const reason = z.string().trim().max(500).optional().parse(req.body?.reason) || 'Annulée par le client';
    await cancelOrder(order, { by: 'customer', reason, isCustomer: true });
    res.json(order.toPublic());
  }),
);

/** Vérifier le solde d'une carte-cadeau. */
router.post(
  '/giftcards/check',
  limiter(30),
  asyncHandler(async (req, res) => {
    const code = z.string().trim().toUpperCase().min(4).max(40).parse(req.body?.code);
    const card = await GiftCard.findOne({ code });
    if (!card || !card.isUsable()) return res.json({ valid: false });
    res.json({ valid: true, balance: card.balance, expiresAt: card.expiresAt });
  }),
);

export default router;
