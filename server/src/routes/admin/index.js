import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.js';
import orders from './orders.js';
import catalog from './catalog.js';
import promotions from './promotions.js';
import shop from './shop.js';

const router = Router();

router.use(requireAdmin);
router.use('/orders', orders);
router.use('/', catalog);
router.use('/', promotions);
router.use('/', shop);

export default router;
