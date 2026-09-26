import Stripe from 'stripe';
import { config } from '../config.js';
import { badRequest } from './errors.js';

/**
 * Enveloppe Stripe. Sans STRIPE_SECRET_KEY, fonctionne en mode simulé :
 * les pré-autorisations réussissent immédiatement, ce qui permet de
 * développer tout le parcours sans compte Stripe.
 */
const stripe = config.stripe.secretKey ? new Stripe(config.stripe.secretKey) : null;

export const paymentsMode = stripe ? 'stripe' : 'mock';

/** Crée une pré-autorisation (capture manuelle) : la carte est bloquée, pas débitée. */
export async function createAuthorization({ amount, orderNumber, orderId, email }) {
  if (!stripe) {
    return { id: `mock_pi_${orderId}`, clientSecret: null, mock: true };
  }
  const intent = await stripe.paymentIntents.create(
    {
      amount,
      currency: 'cad',
      capture_method: 'manual',
      automatic_payment_methods: { enabled: true },
      receipt_email: email,
      description: `Commande ${orderNumber}`,
      metadata: { orderId: String(orderId), orderNumber },
    },
    { idempotencyKey: `order-${orderId}` },
  );
  return { id: intent.id, clientSecret: intent.client_secret, mock: false };
}

/**
 * Transforme une erreur Stripe en erreur 400 lisible par le tableau de bord
 * (au lieu d'une « erreur interne »). Les autres erreurs sont relancées telles quelles.
 */
async function appelStripe(code, fn) {
  try {
    return await fn();
  } catch (err) {
    if (err?.type?.startsWith?.('Stripe')) throw badRequest(code, `Stripe : ${err.message}`);
    throw err;
  }
}

/**
 * Débite une pré-autorisation (éventuellement un montant inférieur).
 * Échoue avec « capture_failed » si l'autorisation a expiré (7 jours) ou a été annulée.
 */
export async function capture(intentId, amount) {
  if (!stripe || intentId.startsWith('mock_')) return { status: 'succeeded' };
  return appelStripe('capture_failed', () =>
    stripe.paymentIntents.capture(intentId, amount ? { amount_to_capture: amount } : {}),
  );
}

/** Libère une pré-autorisation non capturée : aucun frais, aucun débit. */
export async function voidAuthorization(intentId) {
  if (!stripe || intentId.startsWith('mock_')) return { status: 'canceled' };
  return appelStripe('void_failed', () => stripe.paymentIntents.cancel(intentId));
}

/** Rembourse un paiement capturé, en tout (amount omis) ou en partie. */
export async function refund(intentId, amount) {
  if (!stripe || intentId.startsWith('mock_')) return { status: 'succeeded', amount };
  return appelStripe('refund_failed', () =>
    stripe.refunds.create({ payment_intent: intentId, ...(amount ? { amount } : {}) }),
  );
}

export async function retrieveIntent(intentId) {
  if (!stripe || intentId.startsWith('mock_')) return { id: intentId, status: 'requires_capture' };
  return stripe.paymentIntents.retrieve(intentId);
}

export function constructWebhookEvent(rawBody, signature) {
  if (!stripe) throw new Error('Stripe non configuré');
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
}
