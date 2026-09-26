import { Router } from 'express';
import { z } from 'zod';
import { Order, User } from '../models/index.js';
import { asyncHandler, badRequest, conflict, unauthorized } from '../lib/errors.js';
import { limiter } from '../lib/rateLimit.js';
import { clearSession, requireUser, setSession } from '../middleware/auth.js';

const router = Router();
const authLimiter = limiter(20);

const credentials = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, 'Au moins 8 caractères').max(200),
});

router.post(
  '/auth/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = credentials
      .extend({
        name: z.string().trim().min(2).max(100),
        phone: z.string().trim().max(30).optional().default(''),
        locale: z.enum(['fr', 'en']).default('fr'),
      })
      .parse(req.body);
    if (await User.exists({ email: body.email })) throw conflict('email_taken', 'Un compte existe déjà avec ce courriel');

    const user = new User({ email: body.email, name: body.name, phone: body.phone, locale: body.locale });
    await user.setPassword(body.password);
    await user.save();
    // On ne rattache PAS les anciennes commandes invité par courriel : sans vérification
    // du courriel, n'importe qui pourrait lire les commandes d'une autre personne.
    setSession(res, user);
    res.status(201).json(user.toPublic());
  }),
);

router.post(
  '/auth/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = credentials.parse(req.body);
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await user.checkPassword(password))) throw unauthorized('Courriel ou mot de passe incorrect');
    setSession(res, user);
    res.json(user.toPublic());
  }),
);

router.post('/auth/logout', (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

router.get(
  '/auth/me',
  asyncHandler(async (req, res) => {
    if (!req.user) return res.json(null);
    const user = await User.findById(req.user.id);
    res.json(user ? user.toPublic() : null);
  }),
);

router.patch(
  '/account',
  requireUser,
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        name: z.string().trim().min(2).max(100).optional(),
        phone: z.string().trim().max(30).optional(),
        locale: z.enum(['fr', 'en']).optional(),
        defaultAddress: z
          .object({ line1: z.string().max(200), line2: z.string().max(200).optional(), city: z.string().max(100), postalCode: z.string().max(10) })
          .optional(),
      })
      .parse(req.body);
    const user = await User.findByIdAndUpdate(req.user.id, body, { returnDocument: 'after' });
    res.json(user.toPublic());
  }),
);

router.post(
  '/account/password',
  requireUser,
  asyncHandler(async (req, res) => {
    const { current, next } = z.object({ current: z.string(), next: z.string().min(8).max(200) }).parse(req.body);
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!(await user.checkPassword(current))) throw badRequest('wrong_password', 'Mot de passe actuel incorrect');
    await user.setPassword(next);
    await user.save();
    res.status(204).end();
  }),
);

router.get(
  '/account/orders',
  requireUser,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(100);
    res.json(orders.map((o) => o.toPublic()));
  }),
);

export default router;
