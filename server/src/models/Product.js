import mongoose from 'mongoose';
import { ALLERGENS, i18nString, slugify } from './common.js';

const variantSchema = new mongoose.Schema({
  label: { type: i18nString(), required: true }, // ex. « 8 parts », « Boîte de 6 »
  price: { type: Number, required: true, min: 0 }, // en cents CAD
  active: { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: i18nString(), required: true },
    slug: { type: String, unique: true, index: true },
    description: { type: i18nString(false), default: () => ({}) },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    images: [{ url: String, alt: String }],
    ingredients: { type: i18nString(false), default: () => ({}) },
    allergens: [{ type: String, enum: ALLERGENS }],
    variants: {
      type: [variantSchema],
      validate: [(v) => v.length > 0, 'Au moins une variante est requise'],
    },
    // Carte-cadeau : le prix de la variante devient le solde de la carte
    isGiftCard: { type: Boolean, default: false },
    // Personnalisation (ex. texte sur le gâteau)
    allowsMessage: { type: Boolean, default: false },
    // Taxable ? Beaucoup de produits de boulangerie sont détaxés (à valider avec un comptable)
    taxable: { type: Boolean, default: false },
    leadTimeHours: { type: Number, default: 48 },
    seasonal: {
      enabled: { type: Boolean, default: false },
      startDate: Date,
      endDate: Date,
    },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.pre('validate', function setSlug() {
  if (!this.slug && this.name?.fr) this.slug = slugify(this.name.fr);
});

/** Un produit est achetable s'il est actif et, s'il est saisonnier, dans sa période. */
productSchema.methods.isAvailable = function isAvailable(now = new Date()) {
  if (!this.active) return false;
  if (!this.seasonal?.enabled) return true;
  const { startDate, endDate } = this.seasonal;
  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;
  return true;
};

/** Filtre MongoDB équivalent à isAvailable(). */
productSchema.statics.availableFilter = function availableFilter(now = new Date()) {
  return {
    active: true,
    $or: [
      { 'seasonal.enabled': { $ne: true } },
      {
        'seasonal.enabled': true,
        $and: [
          { $or: [{ 'seasonal.startDate': null }, { 'seasonal.startDate': { $lte: now } }] },
          { $or: [{ 'seasonal.endDate': null }, { 'seasonal.endDate': { $gte: now } }] },
        ],
      },
    ],
  };
};

export const Product = mongoose.model('Product', productSchema);
