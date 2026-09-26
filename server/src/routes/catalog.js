import { Router } from 'express';
import { Category, Product, Settings } from '../models/index.js';
import { asyncHandler, notFound } from '../lib/errors.js';
import { paymentsMode } from '../lib/payments.js';

const router = Router();

/** Réglages visibles par le public (jamais l'adresse de cueillette ni les coordonnées de notification). */
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
      // Adresse Interac : nécessaire à la page de confirmation (instructions de virement)
      interacEmail: s.interacEnabled ? s.interacEmail : '',
      // Ville de cueillette seulement : l'adresse précise (un domicile) n'est envoyée qu'avec la confirmation
      pickupCity: s.pickupCity,
      permitNumber: s.permitNumber,
      publicEmail: s.publicEmail,
      publicPhone: s.publicPhone,
      instagramUrl: s.instagramUrl,
      facebookUrl: s.facebookUrl,
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
    // Un produit sans aucune variante active n'est pas achetable : on ne l'affiche pas
    res.json(products.map(publicProduct).filter(Boolean));
  }),
);

router.get(
  '/products/:slug',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug, ...Product.availableFilter() })
      .populate('category', 'name slug')
      .lean();
    const publicView = product && publicProduct(product);
    if (!publicView) throw notFound('Produit introuvable');
    res.json(publicView);
  }),
);

/** Vue publique d'un produit : variantes actives seulement, prix « à partir de ». Null si rien à vendre. */
function publicProduct(p) {
  const variants = p.variants.filter((v) => v.active);
  if (variants.length === 0) return null;
  return { ...p, variants, fromPrice: Math.min(...variants.map((v) => v.price)) };
}

export default router;
