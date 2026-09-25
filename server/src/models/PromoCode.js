import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 }, // % (ex. 10) ou cents
    minSubtotal: { type: Number, default: 0 }, // cents
    startsAt: Date,
    endsAt: Date,
    maxUses: { type: Number, default: null }, // null = illimité
    uses: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

/** Retourne un motif de refus ou null si le code est utilisable. */
promoCodeSchema.methods.rejectionReason = function rejectionReason(subtotal, now = new Date()) {
  if (!this.active) return 'promo_inactive';
  if (this.startsAt && now < this.startsAt) return 'promo_not_started';
  if (this.endsAt && now > this.endsAt) return 'promo_expired';
  if (this.maxUses != null && this.uses >= this.maxUses) return 'promo_exhausted';
  if (subtotal < this.minSubtotal) return 'promo_min_subtotal';
  return null;
};

export const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
