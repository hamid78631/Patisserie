import mongoose from 'mongoose';
import { i18nString } from './common.js';

/** Document unique contenant les réglages de la boutique, modifiables par l'admin. */
const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'shop' },
    ordersOpen: { type: Boolean, default: true },
    closedMessage: {
      type: i18nString(false),
      default: () => ({
        fr: 'Les commandes sont temporairement fermées. Revenez bientôt !',
        en: 'Orders are temporarily closed. Come back soon!',
      }),
    },
    minimumOrder: { type: Number, default: 3000 }, // cents
    deliveryFee: { type: Number, default: 1000 }, // cents
    deliveryEnabled: { type: Boolean, default: true },
    pickupEnabled: { type: Boolean, default: true },
    // Préfixes de codes postaux livrés (ville de Québec : G1, G2, G3)
    deliveryPostalPrefixes: { type: [String], default: ['G1', 'G2', 'G3'] },
    // Adresse précise de cueillette (domicile) : privée, envoyée seulement avec la confirmation
    pickupAddress: { type: String, default: '' },
    // Ville de cueillette, affichée publiquement
    pickupCity: { type: String, default: 'Québec' },
    taxesEnabled: { type: Boolean, default: false },
    gstRate: { type: Number, default: 0.05 },
    qstRate: { type: Number, default: 0.09975 },
    gstNumber: { type: String, default: '' },
    qstNumber: { type: String, default: '' },
    stripeEnabled: { type: Boolean, default: true },
    interacEnabled: { type: Boolean, default: true },
    interacEmail: { type: String, default: '' },
    notificationEmail: { type: String, default: '' },
    notificationPhone: { type: String, default: '' },
    // Coordonnées publiques (pied de page, page Contact) et permis MAPAQ
    permitNumber: { type: String, default: '' },
    publicEmail: { type: String, default: '' },
    publicPhone: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    facebookUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

settingsSchema.statics.get = async function getSettings() {
  return this.findOneAndUpdate({ _id: 'shop' }, {}, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true });
};

export const Settings = mongoose.model('Settings', settingsSchema);
