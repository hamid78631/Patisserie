import { describe, expect, it } from 'vitest';
import { computePricing, minimumOrderBase, STRIPE_MIN_CHARGE } from '../src/lib/pricing.js';

const settings = { deliveryFee: 1000, taxesEnabled: false, gstRate: 0.05, qstRate: 0.09975 };
const cake = { unitPrice: 4200, quantity: 1, taxable: false };
const croissant = { unitPrice: 1800, quantity: 2, taxable: true };
const giftCard = { unitPrice: 5000, quantity: 1, isGiftCard: true };

describe('computePricing', () => {
  it('additionne les articles et ajoute la livraison', () => {
    const { pricing } = computePricing({ items: [cake, croissant], fulfillmentType: 'delivery', settings });
    expect(pricing).toMatchObject({ subtotal: 7800, deliveryFee: 1000, total: 8800, amountDue: 8800, gst: 0, qst: 0 });
  });

  it('pas de frais en cueillette', () => {
    const { pricing } = computePricing({ items: [cake], fulfillmentType: 'pickup', settings });
    expect(pricing.deliveryFee).toBe(0);
    expect(pricing.total).toBe(4200);
  });

  it('applique un pourcentage de remise', () => {
    const { pricing } = computePricing({ items: [cake], fulfillmentType: 'pickup', settings, promo: { type: 'percent', value: 10 } });
    expect(pricing.discount).toBe(420);
    expect(pricing.total).toBe(3780);
  });

  it('une remise fixe ne dépasse jamais le sous-total', () => {
    const { pricing } = computePricing({ items: [cake], fulfillmentType: 'pickup', settings, promo: { type: 'fixed', value: 99999 } });
    expect(pricing.discount).toBe(4200);
    expect(pricing.total).toBe(0);
  });

  it('les remises ne touchent pas les cartes-cadeaux', () => {
    const { pricing } = computePricing({ items: [giftCard], fulfillmentType: 'none', settings, promo: { type: 'percent', value: 50 } });
    expect(pricing.discount).toBe(0);
    expect(pricing.total).toBe(5000);
  });

  it('taxes seulement sur les articles taxables, livraison comprise', () => {
    const { pricing } = computePricing({
      items: [cake, croissant],
      fulfillmentType: 'delivery',
      settings: { ...settings, taxesEnabled: true },
    });
    // base taxable = 3600 (croissants) + 1000 (livraison)
    expect(pricing.gst).toBe(230);
    expect(pricing.qst).toBe(459);
    expect(pricing.total).toBe(7800 + 1000 + 230 + 459);
  });

  it('livraison non taxée si aucun article taxable', () => {
    const { pricing } = computePricing({ items: [cake], fulfillmentType: 'delivery', settings: { ...settings, taxesEnabled: true } });
    expect(pricing.gst + pricing.qst).toBe(0);
  });

  it('la remise réduit la base taxable au prorata', () => {
    const { pricing } = computePricing({
      items: [croissant],
      fulfillmentType: 'pickup',
      settings: { ...settings, taxesEnabled: true },
      promo: { type: 'fixed', value: 600 },
    });
    expect(pricing.gst).toBe(Math.round(3000 * 0.05));
  });

  it('carte-cadeau : paie tout si le solde suffit', () => {
    const { pricing } = computePricing({ items: [cake], fulfillmentType: 'pickup', settings, giftCardBalance: 10000 });
    expect(pricing.giftCardApplied).toBe(4200);
    expect(pricing.amountDue).toBe(0);
  });

  it('carte-cadeau : paiement partiel', () => {
    const { pricing } = computePricing({ items: [cake], fulfillmentType: 'pickup', settings, giftCardBalance: 2500 });
    expect(pricing.giftCardApplied).toBe(2500);
    expect(pricing.amountDue).toBe(1700);
  });

  it('carte-cadeau : ne laisse jamais un reste impayable par Stripe', () => {
    const { pricing } = computePricing({ items: [cake], fulfillmentType: 'pickup', settings, giftCardBalance: 4180 });
    expect(pricing.amountDue).toBe(STRIPE_MIN_CHARGE);
    expect(pricing.giftCardApplied).toBe(4200 - STRIPE_MIN_CHARGE);
  });

  it('on ne paie pas une carte-cadeau avec une carte-cadeau', () => {
    const { pricing } = computePricing({ items: [giftCard], fulfillmentType: 'none', settings, giftCardBalance: 5000 });
    expect(pricing.giftCardApplied).toBe(0);
    expect(pricing.amountDue).toBe(5000);
  });
});

describe('minimumOrderBase', () => {
  it('exclut les cartes-cadeaux', () => {
    expect(minimumOrderBase([cake, giftCard])).toBe(4200);
  });
});
