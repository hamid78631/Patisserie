import mongoose from 'mongoose';
import { i18nString, slugify } from './common.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: i18nString(), required: true },
    slug: { type: String, unique: true, index: true },
    description: { type: i18nString(false), default: () => ({}) },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.pre('validate', function setSlug() {
  if (!this.slug && this.name?.fr) this.slug = slugify(this.name.fr);
});

export const Category = mongoose.model('Category', categorySchema);
