import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

/** Limiteur de requêtes par adresse IP (désactivé pendant les tests). */
export const limiter = (limit, windowMinutes = 15) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => config.env === 'test',
    message: { error: 'too_many_requests', message: 'Trop de tentatives, réessayez plus tard' },
  });
