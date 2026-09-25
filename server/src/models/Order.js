import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'pending_payment', // Stripe : en attente de la pré-autorisation
  'received', // payée (pré-autorisée) ou Interac en attente — à traiter par l'admin
  'confirmed', // date convenue avec le client, paiement capturé
  'in_preparation',
  'ready',
  'completed',
  'cancelled',
];

export const PAYMENT_STATUSES = [
  'pending', // Stripe : formulaire pas encore validé
  'authorized', // Stripe : fonds bloqués, non débités
  'awaiting_transfer', // Interac : virement attendu
  'paid',
  'partially_refunded',
  'refunded',
  'voided', // pré-autorisation annulée : aucun débit
  'failed',
];

/** Transitions de statut permises depuis le tableau de bord. */
export const ADMIN_TRANSITIONS = {
  received: ['confirmed', 'cancelled'],
  confirmed: ['in_preparation', 'ready', 'completed', 'cancelled'],
  in_preparation: ['ready', 'completed', 'cancelled'],
  ready: ['completed', 'cancelled'],
  pending_payment: ['cancelled'],
  completed: [],
  cancelled: [],
};

const i18n = { fr: String, en: String };

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: i18n,
    variantId: mongoose.Schema.Types.ObjectId,
    variantLabel: i18n,
    unitPrice: Number, // cents, figé au moment de la commande
    quantity: Number,
    message: String, // texte personnalisé
    isGiftCard: Boolean,
    taxable: Boolean,
    lineTotal: Number,
  },
  { _id: true },
);

const orderSchema = new mongoose.Schema(
  {
    number: { type: String, unique: true, index: true },
    trackingToken: { type: String, index: true, select: false },
    locale: { type: String, enum: ['fr', 'en'], default: 'fr' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, index: true },
      phone: { type: String, required: true },
    },
    items: [orderItemSchema],
    fulfillment: {
      type: { type: String, enum: ['delivery', 'pickup', 'none'], required: true },
      address: { line1: String, line2: String, city: String, postalCode: String },
    },
    customerNotes: String,
    // Date et heure convenues avec le client (renseignées par l'admin)
    scheduledFor: Date,
    pricing: {
      subtotal: Number,
      discount: Number,
      deliveryFee: Number,
      gst: Number,
      qst: Number,
      total: Number,
      giftCardApplied: Number,
      amountDue: Number, // ce que paie Stripe ou Interac
    },
    promoCode: String,
    giftCardCode: String,
    giftCardsIssued: [String], // cartes-cadeaux achetées dans cette commande
    payment: {
      method: { type: String, enum: ['stripe', 'interac', 'giftcard'], required: true },
      status: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
      intentId: String,
      authorizedAt: Date,
      paidAt: Date,
      refundedAmount: { type: Number, default: 0 },
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending_payment', index: true },
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: String, // 'system', 'customer' ou courriel de l'admin
        note: String,
      },
    ],
    internalNotes: [{ text: String, at: { type: Date, default: Date.now }, by: String }],
    cancelReason: String,
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });

orderSchema.methods.setStatus = function setStatus(status, by = 'system', note) {
  this.status = status;
  this.statusHistory.push({ status, by, note, at: new Date() });
};

/** Vue publique (client) : pas de notes internes ni de jeton. */
orderSchema.methods.toPublic = function toPublic() {
  const o = this.toObject();
  delete o.internalNotes;
  delete o.trackingToken;
  delete o.__v;
  o.canCancel = ['pending_payment', 'received'].includes(o.status);
  return o;
};

export const Order = mongoose.model('Order', orderSchema);
