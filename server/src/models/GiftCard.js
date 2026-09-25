import mongoose from 'mongoose';
import crypto from 'node:crypto';

const giftCardSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    initialBalance: { type: Number, required: true, min: 0 }, // cents
    balance: { type: Number, required: true, min: 0 }, // cents
    expiresAt: Date,
    active: { type: Boolean, default: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    recipientEmail: String,
    note: String,
  },
  { timestamps: true },
);

giftCardSchema.methods.isUsable = function isUsable(now = new Date()) {
  return this.active && this.balance > 0 && (!this.expiresAt || now <= this.expiresAt);
};

/** Code lisible sans caractères ambigus : ex. GC-7KQ4-M2XP */
export function generateGiftCardCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(8);
  const chars = [...bytes].map((b) => alphabet[b % alphabet.length]).join('');
  return `GC-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export const GiftCard = mongoose.model('GiftCard', giftCardSchema);
