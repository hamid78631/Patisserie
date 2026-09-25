/**
 * Calcul des montants d'une commande. Fonction pure (pas de base de données)
 * pour pouvoir la tester facilement. Tous les montants sont en cents CAD.
 */

export const STRIPE_MIN_CHARGE = 50; // Stripe refuse les paiements < 0,50 $ CA

/**
 * @param {object} p
 * @param {Array<{unitPrice:number, quantity:number, isGiftCard?:boolean, taxable?:boolean}>} p.items
 * @param {'delivery'|'pickup'|'none'} p.fulfillmentType
 * @param {object} p.settings  { deliveryFee, taxesEnabled, gstRate, qstRate }
 * @param {object|null} p.promo { type: 'percent'|'fixed', value }
 * @param {number} p.giftCardBalance solde disponible de la carte-cadeau utilisée (0 si aucune)
 */
export function computePricing({ items, fulfillmentType, settings, promo = null, giftCardBalance = 0 }) {
  const lines = items.map((it) => ({ ...it, lineTotal: it.unitPrice * it.quantity }));
  const subtotal = sum(lines.map((l) => l.lineTotal));

  // Les remises ne s'appliquent pas à l'achat de cartes-cadeaux
  const discountableBase = sum(lines.filter((l) => !l.isGiftCard).map((l) => l.lineTotal));
  let discount = 0;
  if (promo) {
    discount = promo.type === 'percent' ? Math.round((discountableBase * promo.value) / 100) : promo.value;
    discount = Math.min(discount, discountableBase);
  }

  const deliveryFee = fulfillmentType === 'delivery' ? settings.deliveryFee : 0;

  // Base taxable : articles taxables, moins leur part proportionnelle de la remise.
  // Les frais de livraison suivent le statut des articles (taxables si au moins un article l'est).
  let gst = 0;
  let qst = 0;
  if (settings.taxesEnabled) {
    const taxableItems = sum(lines.filter((l) => l.taxable && !l.isGiftCard).map((l) => l.lineTotal));
    const discountShare = discountableBase > 0 ? Math.round((discount * taxableItems) / discountableBase) : 0;
    const deliveryTaxable = taxableItems > 0 ? deliveryFee : 0;
    const taxableBase = Math.max(0, taxableItems - discountShare) + deliveryTaxable;
    gst = Math.round(taxableBase * settings.gstRate);
    qst = Math.round(taxableBase * settings.qstRate);
  }

  const total = subtotal - discount + deliveryFee + gst + qst;

  // La carte-cadeau paie ce qu'elle peut. On évite de laisser un reste entre 1 et 49 cents,
  // impossible à payer par Stripe : dans ce cas on réduit un peu l'utilisation de la carte.
  // On ne paie pas une carte-cadeau avec une autre carte-cadeau.
  const giftCardEligible = total - sum(lines.filter((l) => l.isGiftCard).map((l) => l.lineTotal));
  let giftCardApplied = Math.max(0, Math.min(giftCardBalance, giftCardEligible));
  let amountDue = total - giftCardApplied;
  if (amountDue > 0 && amountDue < STRIPE_MIN_CHARGE && giftCardApplied > 0) {
    const shift = Math.min(giftCardApplied, STRIPE_MIN_CHARGE - amountDue);
    giftCardApplied -= shift;
    amountDue += shift;
  }

  return {
    lines,
    pricing: { subtotal, discount, deliveryFee, gst, qst, total, giftCardApplied, amountDue },
  };
}

/** Sous-total utilisé pour le minimum de commande (hors cartes-cadeaux). */
export function minimumOrderBase(items) {
  return sum(items.filter((i) => !i.isGiftCard).map((i) => i.unitPrice * i.quantity));
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}
