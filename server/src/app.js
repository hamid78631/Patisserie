import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { config } from './config.js';
import { errorHandler } from './lib/errors.js';
import { loadUser } from './middleware/auth.js';
import webhooks from './routes/webhooks.js';
import catalog from './routes/catalog.js';
import orders from './routes/orders.js';
import account from './routes/account.js';
import admin from './routes/admin/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1); // Render est derrière un proxy (nécessaire pour la limitation de débit)
  app.use(helmet());
  app.use(
    cors({
      origin: config.clientOrigins,
      credentials: true, // cookies de session
    }),
  );

  // Le webhook Stripe a besoin du corps brut : il passe avant express.json()
  app.use('/api/webhooks', webhooks);

  app.use(express.json({ limit: '200kb' }));
  app.use(cookieParser());
  app.use(loadUser);

  app.get('/api/health', (_req, res) =>
    res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'up' : 'down' }),
  );

  app.use('/api', catalog);
  app.use('/api', orders);
  app.use('/api', account);
  app.use('/api/admin', admin);

  app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found', message: 'Route inconnue' }));
  app.use(errorHandler);

  return app;
}
