import { Router } from 'express';
import { z } from 'zod';
import { GiftCard, PromoCode, generateGiftCardCode } from '../../models/index.js';
import { asyncHandler, notFound } from '../../lib/errors.js';

const router = Router();

// ---------------------------------------------------------------------------
// Codes promo
// ---------------------------------------------------------------------------

const promoInput = z
  .object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,40}$/, 'Lettres, chiffres, - ou _'),
    type: z.enum(['percent', 'fixed']),
    value: z.number().positive(),
    minSubtotal: z.number().int().min(0).default(0),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    maxUses: z.number().int().positive().nullable().default(null),
    active: z.boolean().default(true),
  })
  .refine((p) => p.type !== 'percent' || p.value <= 100, { message: 'Un pourcentage ne peut dépasser 100', path: ['value'] });

router.get('/promos', asyncHandler(async (_req, res) => res.json(await PromoCode.find().sort({ createdAt: -1 }))));

router.post('/promos', asyncHandler(async (req, res) => res.status(201).json(await PromoCode.create(promoInput.parse(req.body)))));

router.put(
  '/promos/:id',
  asyncHandler(async (req, res) => {
    const promo = await PromoCode.findByIdAndUpdate(req.params.id, promoInput.parse(req.body), { new: true, runValidators: true });
    if (!promo) throw notFound();
    res.json(promo);
  }),
);

router.delete(
  '/promos/:id',
  asyncHandler(async (req, res) => {
    await PromoCode.findByIdAndDelete(req.params.id);
    res.status(204).end();
  }),
);

// ---------------------------------------------------------------------------
// Cartes-cadeaux
// ---------------------------------------------------------------------------

router.get(
  '/giftcards',
  asyncHandler(async (req, res) => {
    const filter = req.query.search ? { code: new RegExp(String(req.query.search).replace(/[^A-Z0-9-]/gi, ''), 'i') } : {};
    res.json(await GiftCard.find(filter).sort({ createdAt: -1 }).limit(200).populate('purchaseOrder', 'number'));
  }),
);

/** Émettre une carte-cadeau manuellement (ex. geste commercial, concours). */
router.post(
  '/giftcards',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        amount: z.number().int().positive(),
        expiresAt: z.coerce.date().nullable().optional(),
        recipientEmail: z.string().email().optional(),
        note: z.string().max(500).optional(),
      })
      .parse(req.body);
    const card = await GiftCard.create({
      code: generateGiftCardCode(),
      initialBalance: body.amount,
      balance: body.amount,
      expiresAt: body.expiresAt,
      recipientEmail: body.recipientEmail,
      note: body.note,
    });
    res.status(201).json(card);
  }),
);

router.patch(
  '/giftcards/:id',
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        active: z.boolean().optional(),
        balance: z.number().int().min(0).optional(),
        expiresAt: z.coerce.date().nullable().optional(),
        note: z.string().max(500).optional(),
      })
      .parse(req.body);
    const card = await GiftCard.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!card) throw notFound();
    res.json(card);
  }),
);

export default router;
