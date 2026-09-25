import mongoose from 'mongoose';

/** Texte bilingue : le français est obligatoire (Loi 96), l'anglais optionnel. */
export const i18nString = (required = true) =>
  new mongoose.Schema(
    {
      fr: { type: String, required, trim: true },
      en: { type: String, trim: true, default: '' },
    },
    { _id: false },
  );

export const ALLERGENS = [
  'gluten',
  'milk',
  'eggs',
  'peanuts',
  'tree_nuts',
  'soy',
  'sesame',
  'mustard',
  'sulphites',
  'fish',
  'crustaceans',
];

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
