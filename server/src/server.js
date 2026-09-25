import mongoose from 'mongoose';
import { config } from './config.js';
import { createApp } from './app.js';
import { paymentsMode } from './lib/payments.js';
import { expireAbandonedOrders } from './services/orderService.js';

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connecté');

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`API sur http://localhost:${config.port} — paiements : ${paymentsMode}`);
  });

  // Nettoyage des paiements Stripe abandonnés toutes les 15 minutes
  setInterval(() => expireAbandonedOrders().catch((err) => console.error(err)), 15 * 60 * 1000);
}

main().catch((err) => {
  console.error('Démarrage impossible :', err);
  process.exit(1);
});
