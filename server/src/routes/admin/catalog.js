import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Category, Product } from '../../models/index.js';
import { ALLERGENS, slugify } from '../../models/common.js';
import { asyncHandler, badRequest, notFound } from '../../lib/errors.js';

const router = Router();

const i18n = z.object({ fr: z.string().trim().min(1).max(5000), en: z.string().trim().max(5000).optional().default('') });
const i18nOptional = z.object({ fr: z.string().trim().max(5000).default(''), en: z.string().trim().max(5000).default('') });
const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), 'Identifiant invalide');

// ---------------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------------

const categoryInput = z.object({
  name: i18n,
  slug: z.string().trim().max(100).optional(),
  description: i18nOptional.optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const cats = await Category.find().sort({ sortOrder: 1, 'name.fr': 1 }).lean();
    const counts = await Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]);
    const byId = new Map(counts.map((c) => [String(c._id), c.n]));
    res.json(cats.map((c) => ({ ...c, productCount: byId.get(String(c._id)) || 0 })));
  }),
);

router.post(
  '/categories',
  asyncHandler(async (req, res) => {
    const body = categoryInput.parse(req.body);
    if (body.slug) body.slug = slugify(body.slug);
    res.status(201).json(await Category.create(body));
  }),
);

router.put(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    const body = categoryInput.parse(req.body);
    body.slug = slugify(body.slug || body.name.fr);
    const cat = await Category.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    if (!cat) throw notFound();
    res.json(cat);
  }),
);

router.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    if (await Product.exists({ category: req.params.id })) {
      throw badRequest('category_not_empty', 'Déplacez ou supprimez d’abord les produits de cette catégorie');
    }
    await Category.findByIdAndDelete(req.params.id);
    res.status(204).end();
  }),
);

// ---------------------------------------------------------------------------
// Produits
// ---------------------------------------------------------------------------

const productInput = z.object({
  name: i18n,
  slug: z.string().trim().max(120).optional(),
  description: i18nOptional.optional(),
  category: objectId,
  images: z.array(z.object({ url: z.string().url(), alt: z.string().max(200).optional() })).max(10).default([]),
  ingredients: i18nOptional.optional(),
  allergens: z.array(z.enum(ALLERGENS)).default([]),
  variants: z
    .array(
      z.object({
        _id: objectId.optional(), // conserver l'identifiant permet aux paniers existants de rester valides
        label: i18n,
        price: z.number().int().min(0),
        active: z.boolean().default(true),
      }),
    )
    .min(1, 'Au moins une variante'),
  isGiftCard: z.boolean().default(false),
  allowsMessage: z.boolean().default(false),
  taxable: z.boolean().default(false),
  leadTimeHours: z.number().int().min(0).max(24 * 30).default(48),
  seasonal: z
    .object({
      enabled: z.boolean().default(false),
      startDate: z.coerce.date().nullable().optional(),
      endDate: z.coerce.date().nullable().optional(),
    })
    .default({ enabled: false }),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.category) filter.category = String(req.query.category);
    if (req.query.search) filter['name.fr'] = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const products = await Product.find(filter).populate('category', 'name slug').sort({ sortOrder: 1, createdAt: -1 }).lean();
    res.json(products);
  }),
);

router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const p = await Product.findById(req.params.id).lean();
    if (!p) throw notFound();
    res.json(p);
  }),
);

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const body = productInput.parse(req.body);
    if (body.slug) body.slug = slugify(body.slug);
    await assertCategory(body.category);
    res.status(201).json(await Product.create(body));
  }),
);

router.put(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const body = productInput.parse(req.body);
    body.slug = slugify(body.slug || body.name.fr);
    await assertCategory(body.category);
    const product = await Product.findById(req.params.id);
    if (!product) throw notFound();
    product.set(body);
    await product.save();
    res.json(product);
  }),
);

/** Activer / désactiver rapidement (ex. rupture d'un ingrédient). */
router.patch(
  '/products/:id/active',
  asyncHandler(async (req, res) => {
    const { active } = z.object({ active: z.boolean() }).parse(req.body);
    const p = await Product.findByIdAndUpdate(req.params.id, { active }, { new: true });
    if (!p) throw notFound();
    res.json(p);
  }),
);

router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    // Les commandes gardent une copie du nom et du prix : la suppression ne les casse pas
    await Product.findByIdAndDelete(req.params.id);
    res.status(204).end();
  }),
);

async function assertCategory(id) {
  if (!(await Category.exists({ _id: id }))) throw badRequest('invalid_category', 'Catégorie inexistante');
}

export default router;
