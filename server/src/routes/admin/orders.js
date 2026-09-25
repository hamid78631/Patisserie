import { Router } from 'express';
import { z } from 'zod';
import { Order } from '../../models/index.js';
import { asyncHandler, notFound } from '../../lib/errors.js';
import {
  advanceStatus,
  cancelOrder,
  confirmOrder,
  markInteracReceived,
  refundOrder,
} from '../../services/orderService.js';

const router = Router();

const AUTH_WARNING_DAYS = 5; // les pré-autorisations Stripe expirent après 7 jours

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = z
      .object({
        status: z.string().optional(),
        payment: z.string().optional(),
        search: z.string().trim().max(100).optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(25),
      })
      .parse(req.query);

    const filter = {};
    if (q.status === 'active') filter.status = { $in: ['received', 'confirmed', 'in_preparation', 'ready'] };
    else if (q.status) filter.status = q.status;
    else filter.status = { $ne: 'pending_payment' }; // paiements non finalisés masqués par défaut
    if (q.payment) filter['payment.status'] = q.payment;
    if (q.from || q.to) filter.createdAt = { ...(q.from && { $gte: q.from }), ...(q.to && { $lte: q.to }) };
    if (q.search) {
      const rx = new RegExp(q.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ number: rx }, { 'customer.name': rx }, { 'customer.email': rx }, { 'customer.phone': rx }];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .select('number customer status payment pricing.total fulfillment.type scheduledFor createdAt items.quantity'),
      Order.countDocuments(filter),
    ]);

    const warnBefore = Date.now() - AUTH_WARNING_DAYS * 24 * 3600 * 1000;
    res.json({
      total,
      page: q.page,
      pages: Math.ceil(total / q.limit),
      orders: orders.map((o) => ({
        ...o.toObject(),
        itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
        authorizationExpiringSoon: o.payment.status === 'authorized' && o.payment.authorizedAt < warnBefore,
      })),
    });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'email name phone createdAt');
    if (!order) throw notFound('Commande introuvable');
    // Historique du client : ses autres commandes (même courriel)
    const customerHistory = await Order.find({ 'customer.email': order.customer.email, _id: { $ne: order._id } })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('number status pricing.total createdAt');
    res.json({ order, customerHistory });
  }),
);

async function load(req) {
  const order = await Order.findById(req.params.id);
  if (!order) throw notFound('Commande introuvable');
  return order;
}

router.post(
  '/:id/confirm',
  asyncHandler(async (req, res) => {
    const body = z.object({ scheduledFor: z.coerce.date().optional(), note: z.string().max(500).optional() }).parse(req.body);
    const order = await confirmOrder(await load(req), { by: req.user.email, ...body });
    res.json(order);
  }),
);

router.post(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const body = z
      .object({ status: z.enum(['in_preparation', 'ready', 'completed']), note: z.string().max(500).optional() })
      .parse(req.body);
    const order = await advanceStatus(await load(req), body.status, { by: req.user.email, note: body.note });
    res.json(order);
  }),
);

router.patch(
  '/:id/schedule',
  asyncHandler(async (req, res) => {
    const { scheduledFor } = z.object({ scheduledFor: z.coerce.date().nullable() }).parse(req.body);
    const order = await load(req);
    order.scheduledFor = scheduledFor;
    await order.save();
    res.json(order);
  }),
);

router.post(
  '/:id/interac-received',
  asyncHandler(async (req, res) => {
    const order = await markInteracReceived(await load(req), { by: req.user.email });
    res.json(order);
  }),
);

router.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const body = z.object({ reason: z.string().trim().min(2).max(500), refund: z.boolean().default(true) }).parse(req.body);
    const order = await cancelOrder(await load(req), { by: req.user.email, ...body });
    res.json(order);
  }),
);

router.post(
  '/:id/refund',
  asyncHandler(async (req, res) => {
    const body = z.object({ amount: z.number().int().positive().optional(), note: z.string().max(500).optional() }).parse(req.body);
    const order = await refundOrder(await load(req), { by: req.user.email, ...body });
    res.json(order);
  }),
);

router.post(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    const { text } = z.object({ text: z.string().trim().min(1).max(2000) }).parse(req.body);
    const order = await load(req);
    order.internalNotes.push({ text, by: req.user.email });
    await order.save();
    res.json(order);
  }),
);

export default router;
