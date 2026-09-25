import express, { Router } from 'express';
import { Order } from '../models/index.js';
import { constructWebhookEvent } from '../lib/payments.js';
import { markAuthorized } from '../services/orderService.js';

const router = Router();

/**
 * Webhook Stripe. Monté AVANT express.json() car la signature
 * se vérifie sur le corps brut de la requête.
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = constructWebhookEvent(req.body, req.headers['stripe-signature']);
  } catch (err) {
    console.warn('Webhook Stripe refusé :', err.message);
    return res.status(400).send('Signature invalide');
  }

  try {
    const intent = event.data.object;
    const order = intent?.metadata?.orderId ? await Order.findById(intent.metadata.orderId) : null;

    switch (event.type) {
      // La carte est pré-autorisée : la commande devient visible pour l'équipe
      case 'payment_intent.amount_capturable_updated':
        if (order) await markAuthorized(order);
        break;
      case 'payment_intent.payment_failed':
        if (order && order.status === 'pending_payment') {
          order.payment.status = 'failed';
          await order.save();
        }
        break;
      // Pré-autorisation expirée (7 jours) ou annulée depuis Stripe
      case 'payment_intent.canceled':
        if (order && order.payment.status === 'authorized') {
          order.payment.status = 'voided';
          order.statusHistory.push({ status: order.status, by: 'stripe', note: 'Pré-autorisation expirée ou annulée' });
          await order.save();
        }
        break;
      default:
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Erreur webhook', event.type, err);
    res.status(500).send('Erreur'); // Stripe réessaiera
  }
});

export default router;
