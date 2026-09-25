import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    locale: { type: String, enum: ['fr', 'en'], default: 'fr' },
    defaultAddress: {
      line1: String,
      line2: String,
      city: String,
      postalCode: String,
    },
  },
  { timestamps: true },
);

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.checkPassword = function checkPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toPublic = function toPublic() {
  const { _id, email, name, phone, role, locale, defaultAddress } = this;
  return { id: _id, email, name, phone, role, locale, defaultAddress };
};

export const User = mongoose.model('User', userSchema);
