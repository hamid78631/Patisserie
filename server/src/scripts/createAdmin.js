/**
 * Crée (ou promeut) un compte administrateur.
 * Usage : npm run create-admin -- courriel@exemple.com "Nom" "motDePasseSolide"
 */
import mongoose from 'mongoose';
import { config } from '../config.js';
import { User } from '../models/index.js';

const [email, name, password] = process.argv.slice(2);

if (!email || !password || password.length < 10) {
  console.error('Usage : npm run create-admin -- courriel "Nom" motDePasse (10 caractères minimum)');
  process.exit(1);
}

await mongoose.connect(config.mongoUri);
const user = (await User.findOne({ email: email.toLowerCase() })) || new User({ email, name: name || '' });
user.role = 'admin';
if (name) user.name = name;
await user.setPassword(password);
await user.save();
console.log(`Administratrice prête : ${user.email}`);
await mongoose.disconnect();
