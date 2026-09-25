import { Router } from 'express';
import { Category, Product, Settings } from '../models/index.js';
import { asyncHandler, notFound } from '../lib/errors.js';
import { paymentsMode } from '../lib/payments.js';

const router = Router();

/** Réglages visibles par le public (jamais les numéros de notification). */
router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const s = await Settings.get();
    res.json({
      ordersOpen: s.ordersOpen,
      closedMessage: s.closedMessage,
      minimumOrder: s.minimumOrder,
      deliveryFee: s.deliveryFee,
      deliveryEnabled: s.deliveryEnabled,
      pickupEnabled: s.pickupEnabled,
      deliveryPostalPrefixes: s.deliveryPostalPrefixes,
      taxesEnabled: s.taxesEnabled,
      stripeEnabled: s.stripeEnabled,
      interacEnabled: s.interacEnabled,
      paymentsMode,
    });
  }),
);

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await Category.find({ active: true }).sort({ sortOrder: 1, 'name.fr': 1 }).lean();
    res.json(categories);
  }),
);

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const filter = Product.availableFilter();
    if (req.query.category) {
      const cat = await Category.findOne({ slug: String(req.query.category), active: true });
      if (!cat) return res.json([]);
      filter.category = cat._id;
    }
    if (req.query.featured === 'true') filter.featured = true;
    if (req.query.seasonal === 'true') filter['seasonal.enabled'] = true;

    const products = await Product.find(filter)
      .populate('category', 'name slug')
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    res.json(products.map(publicProduct));
  }),
);

router.get(
  '/products/:slug',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug, ...Product.availableFilter() })
      .populate('category', 'name slug')
      .lean();
    if (!product) throw notFound('Produit introuvable');
    res.json(publicProduct(product));
  }),
);

function publicProduct(p) {
  return {
    ...p,
    variants: p.variants.filter((v) => v.active),
    fromPrice: Math.min(...p.variants.filter((v) => v.active).map((v) => v.price)),
  };
}

export default router;
