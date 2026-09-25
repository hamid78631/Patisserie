import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../../config.js';
import { Order, Settings, User } from '../../models/index.js';
import { asyncHandler, badRequest, conflict } from '../../lib/errors.js';

const router = Router();

// ---------------------------------------------------------------------------
// Réglages de la boutique
// ---------------------------------------------------------------------------

const settingsInput = z
  .object({
    ordersOpen: z.boolean(),
    closedMessage: z.object({ fr: z.string().max(500), en: z.string().max(500) }),
    minimumOrder: z.number().int().min(0),
    deliveryFee: z.number().int().min(0),
    deliveryEnabled: z.boolean(),
    pickupEnabled: z.boolean(),
    deliveryPostalPrefixes: z.array(z.string().trim().toUpperCase().regex(/^[A-Z]\d?[A-Z]?$/)).min(1),
    pickupAddress: z.string().max(300),
    taxesEnabled: z.boolean(),
    gstRate: z.number().min(0).max(1),
    qstRate: z.number().min(0).max(1),
    gstNumber: z.string().max(40),
    qstNumber: z.string().max(40),
    stripeEnabled: z.boolean(),
    interacEnabled: z.boolean(),
    interacEmail: z.string().email().or(z.literal('')),
    notificationEmail: z.string().email().or(z.literal('')),
    notificationPhone: z.string().max(30),
  })
  .partial();

router.get('/settings', asyncHandler(async (_req, res) => res.json(await Settings.get())));

router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const body = settingsInput.parse(req.body);
    const current = await Settings.get();
    current.set(body);
    const s = current;
    if (!s.deliveryEnabled && !s.pickupEnabled) throw badRequest('no_fulfillment', 'Activez la livraison ou la cueillette');
    if (!s.stripeEnabled && !s.interacEnabled) throw badRequest('no_payment', 'Activez au moins un mode de paiement');
    if (s.interacEnabled && !s.interacEmail) throw badRequest('interac_email_required', 'Adresse Interac requise');
    await s.save();
    res.json(s);
  }),
);

// ---------------------------------------------------------------------------
// Statistiques
// ---------------------------------------------------------------------------

router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const days = z.coerce.number().int().min(1).max(366).default(30).parse(req.query.days);
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const paidStatuses = ['confirmed', 'in_preparation', 'ready', 'completed'];

    const paidFilter = { createdAt: { $gte: since }, status: { $in: paidStatuses } };

    const [paidOrders, topProducts, pending] = await Promise.all([
      Order.find(paidFilter).select('pricing.total createdAt').lean(),
      Order.aggregate([
        { $match: paidFilter },
        { $unwind: '$items' },
        { $group: { _id: '$items.productName.fr', quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),
      Order.countDocuments({ status: 'received' }),
    ]);

    // Regroupement par jour (heure du Québec) en JavaScript : volumes faibles, code portable
    const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' });
    const dailyTotals = new Map();
    for (const o of paidOrders) {
      const key = dayKey.format(o.createdAt);
      const d = dailyTotals.get(key) || { date: key, revenue: 0, orders: 0 };
      d.revenue += o.pricing.total;
      d.orders += 1;
      dailyTotals.set(key, d);
    }
    const revenue = paidOrders.reduce((n, o) => n + o.pricing.total, 0);

    res.json({
      days,
      revenue,
      orders: paidOrders.length,
      averageOrder: paidOrders.length ? Math.round(revenue / paidOrders.length) : 0,
      awaitingConfirmation: pending,
      topProducts: topProducts.map((p) => ({ name: p._id, quantity: p.quantity, revenue: p.revenue })),
      byDay: [...dailyTotals.values()].sort((a, b) => a.date.localeCompare(b.date)),
    });
  }),
);

// ---------------------------------------------------------------------------
// Upload d'images (Cloudinary, signé : le navigateur envoie directement le fichier)
// ---------------------------------------------------------------------------

router.post('/uploads/signature', (_req, res) => {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(503).json({ error: 'uploads_disabled', message: 'Cloudinary non configuré' });
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'patisserie/products';
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
  res.json({ cloudName, apiKey, timestamp, folder, signature, uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload` });
});

// ---------------------------------------------------------------------------
// Administratrices (2 comptes prévus)
// ---------------------------------------------------------------------------

router.get('/users', asyncHandler(async (_req, res) => res.json((await User.find({ role: 'admin' })).map((u) => u.toPublic()))));

router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const body = z
      .object({ email: z.string().trim().toLowerCase().email(), name: z.string().trim().min(2), password: z.string().min(10) })
      .parse(req.body);
    const existing = await User.findOne({ email: body.email });
    if (existing?.role === 'admin') throw conflict('already_admin', 'Déjà administratrice');
    const user = existing || new User({ email: body.email, name: body.name });
    user.role = 'admin';
    await user.setPassword(body.password);
    await user.save();
    res.status(201).json(user.toPublic());
  }),
);

router.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) throw badRequest('self_demote', 'Vous ne pouvez pas retirer votre propre accès');
    await User.findByIdAndUpdate(req.params.id, { role: 'customer' });
    res.status(204).end();
  }),
);

export default router;
