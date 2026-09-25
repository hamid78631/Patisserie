import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Category, GiftCard, Order, Product, PromoCode, Settings, User } from '../src/models/index.js';
import { connectTestDb, disconnectTestDb, resetDb } from './helpers/db.js';

const app = createApp();
let cake;
let croissants;
let giftCardProduct;
let admin; // agent supertest connecté en tant qu'admin

const address = { line1: '123 rue Saint-Jean', city: 'Québec', postalCode: 'g1r 1p7' };
const customer = { name: 'Marie Tremblay', email: 'marie@example.com', phone: '418 555-1234' };

function orderBody(overrides = {}) {
  return {
    locale: 'fr',
    customer,
    items: [{ productId: String(cake._id), variantId: String(cake.variants[0]._id), quantity: 1, message: 'Bonne fête Léa' }],
    fulfillment: { type: 'delivery', address },
    paymentMethod: 'stripe',
    ...overrides,
  };
}

beforeAll(connectTestDb, 120_000);
afterAll(disconnectTestDb);

beforeEach(async () => {
  await resetDb();
  await Settings.create({ _id: 'shop', interacEmail: 'paie@example.com' });
  const [cakes, pastries, gifts] = await Category.create([
    { name: { fr: 'Gâteaux', en: 'Cakes' } },
    { name: { fr: 'Viennoiseries' } },
    { name: { fr: 'Cartes-cadeaux' } },
  ]);
  cake = await Product.create({
    name: { fr: 'Fraisier', en: 'Strawberry cake' },
    category: cakes._id,
    allergens: ['gluten', 'eggs'],
    variants: [
      { label: { fr: '6 parts' }, price: 4200 },
      { label: { fr: '10 parts' }, price: 6500, active: false },
    ],
    allowsMessage: true,
  });
  croissants = await Product.create({
    name: { fr: 'Croissants' },
    category: pastries._id,
    variants: [{ label: { fr: 'Boîte de 6' }, price: 1800 }],
  });
  await Product.create({ name: { fr: 'Produit caché' }, category: pastries._id, variants: [{ label: { fr: 'x' }, price: 100 }], active: false });
  await Product.create({
    name: { fr: 'Bûche passée' },
    category: cakes._id,
    variants: [{ label: { fr: 'x' }, price: 100 }],
    seasonal: { enabled: true, startDate: new Date('2000-01-01'), endDate: new Date('2000-02-01') },
  });
  giftCardProduct = await Product.create({
    name: { fr: 'Carte-cadeau' },
    category: gifts._id,
    isGiftCard: true,
    variants: [{ label: { fr: '50 $' }, price: 5000 }],
  });
  await PromoCode.create({ code: 'BIENVENUE10', type: 'percent', value: 10, maxUses: 1 });

  const adminUser = new User({ email: 'admin@example.com', name: 'Admin', role: 'admin' });
  await adminUser.setPassword('motdepasse-admin');
  await adminUser.save();
  admin = request.agent(app);
  await admin.post('/api/auth/login').send({ email: 'admin@example.com', password: 'motdepasse-admin' }).expect(200);
});

// ---------------------------------------------------------------------------

describe('Catalogue', () => {
  it('ne montre que les produits disponibles et les variantes actives', async () => {
    const res = await request(app).get('/api/products').expect(200);
    const names = res.body.map((p) => p.name.fr).sort();
    expect(names).toEqual(['Carte-cadeau', 'Croissants', 'Fraisier']);
    const fraisier = res.body.find((p) => p.name.fr === 'Fraisier');
    expect(fraisier.variants).toHaveLength(1);
    expect(fraisier.fromPrice).toBe(4200);
  });

  it('filtre par catégorie et trouve un produit par slug', async () => {
    const res = await request(app).get('/api/products?category=gateaux').expect(200);
    expect(res.body.map((p) => p.slug)).toEqual(['fraisier']);
    await request(app).get('/api/products/fraisier').expect(200);
    await request(app).get('/api/products/produit-cache').expect(404);
  });

  it('les réglages publics ne révèlent pas les coordonnées de notification', async () => {
    const res = await request(app).get('/api/settings').expect(200);
    expect(res.body.minimumOrder).toBe(3000);
    expect(res.body.notificationPhone).toBeUndefined();
    expect(res.body.paymentsMode).toBe('mock');
  });
});

describe('Devis du panier', () => {
  it('calcule les montants', async () => {
    const res = await request(app).post('/api/cart/quote').send(orderBody()).expect(200);
    expect(res.body.errors).toEqual([]);
    expect(res.body.pricing).toMatchObject({ subtotal: 4200, deliveryFee: 1000, total: 5200 });
    expect(res.body.fulfillment.address.postalCode).toBe('G1R 1P7');
  });

  it('signale le minimum, la zone de livraison et une variante inactive', async () => {
    const res = await request(app)
      .post('/api/cart/quote')
      .send(
        orderBody({
          items: [
            { productId: String(croissants._id), variantId: String(croissants.variants[0]._id), quantity: 1 },
            { productId: String(cake._id), variantId: String(cake.variants[1]._id), quantity: 1 },
          ],
          fulfillment: { type: 'delivery', address: { ...address, postalCode: 'H2X 1Y4' } },
        }),
      )
      .expect(200);
    expect(res.body.errors).toEqual(expect.arrayContaining(['variant_unavailable', 'delivery_zone', 'below_minimum']));
  });

  it('rejette une entrée invalide', async () => {
    await request(app).post('/api/cart/quote').send({ items: [] }).expect(400);
  });
});

describe('Commande Stripe (mode simulé)', () => {
  it('crée une commande reçue et pré-autorisée, suivie par jeton', async () => {
    const res = await request(app).post('/api/orders').send(orderBody({ promoCode: 'bienvenue10' })).expect(201);
    const { order, trackingToken } = res.body;
    expect(order.number).toMatch(/^P-\d{4}-0001$/);
    expect(order.status).toBe('received');
    expect(order.payment.status).toBe('authorized');
    expect(order.pricing.discount).toBe(420);
    expect(order.items[0].message).toBe('Bonne fête Léa');
    expect(order.internalNotes).toBeUndefined();
    expect((await PromoCode.findOne({ code: 'BIENVENUE10' })).uses).toBe(1);

    await request(app).get(`/api/orders/track/${order.number}`).expect(404);
    await request(app).get(`/api/orders/track/${order.number}?t=mauvais`).expect(404);
    const tracked = await request(app).get(`/api/orders/track/${order.number}?t=${trackingToken}`).expect(200);
    expect(tracked.body.canCancel).toBe(true);
  });

  it('le client peut annuler avant confirmation : fonds libérés et code promo rendu', async () => {
    const { body } = await request(app).post('/api/orders').send(orderBody({ promoCode: 'BIENVENUE10' })).expect(201);
    const res = await request(app)
      .post(`/api/orders/track/${body.order.number}/cancel`)
      .send({ token: body.trackingToken })
      .expect(200);
    expect(res.body.status).toBe('cancelled');
    expect(res.body.payment.status).toBe('voided');
    expect((await PromoCode.findOne({ code: 'BIENVENUE10' })).uses).toBe(0);
  });

  it('un code promo épuisé est refusé', async () => {
    await request(app).post('/api/orders').send(orderBody({ promoCode: 'BIENVENUE10' })).expect(201);
    const res = await request(app).post('/api/orders').send(orderBody({ promoCode: 'BIENVENUE10' })).expect(400);
    expect(res.body.details).toContain('promo_exhausted');
  });

  it('refuse les commandes quand la boutique est fermée', async () => {
    await Settings.updateOne({ _id: 'shop' }, { ordersOpen: false });
    const res = await request(app).post('/api/orders').send(orderBody()).expect(400);
    expect(res.body.details).toContain('orders_closed');
  });
});

describe('Tableau de bord', () => {
  it('exige une session admin', async () => {
    await request(app).get('/api/admin/orders').expect(401);
    const client = request.agent(app);
    await client.post('/api/auth/register').send({ email: 'c@example.com', password: 'motdepasse', name: 'Client' }).expect(201);
    await client.get('/api/admin/orders').expect(403);
  });

  it('cycle complet : confirmer (capture), préparer, prête, puis annuler avec remboursement', async () => {
    const { body } = await request(app).post('/api/orders').send(orderBody()).expect(201);
    const id = body.order._id;

    const list = await admin.get('/api/admin/orders?search=tremblay').expect(200);
    expect(list.body.total).toBe(1);

    const detail = await admin.get(`/api/admin/orders/${id}`).expect(200);
    expect(detail.body.order.customer.phone).toBe('418 555-1234');

    const when = '2026-12-20T15:00:00.000Z';
    const confirmed = await admin.post(`/api/admin/orders/${id}/confirm`).send({ scheduledFor: when }).expect(200);
    expect(confirmed.body.status).toBe('confirmed');
    expect(confirmed.body.payment.status).toBe('paid');
    expect(confirmed.body.scheduledFor).toBe(when);

    // Le client ne peut plus annuler lui-même
    await request(app).post(`/api/orders/track/${body.order.number}/cancel`).send({ token: body.trackingToken }).expect(400);

    await admin.post(`/api/admin/orders/${id}/status`).send({ status: 'ready' }).expect(200);
    await admin.post(`/api/admin/orders/${id}/notes`).send({ text: 'Appeler avant de livrer' }).expect(200);

    const partial = await admin.post(`/api/admin/orders/${id}/refund`).send({ amount: 1000 }).expect(200);
    expect(partial.body.payment.status).toBe('partially_refunded');

    const cancelled = await admin.post(`/api/admin/orders/${id}/cancel`).send({ reason: 'Imprévu' }).expect(200);
    expect(cancelled.body.status).toBe('cancelled');
    expect(cancelled.body.payment.status).toBe('refunded');
    expect(cancelled.body.payment.refundedAmount).toBe(5200);
    expect(cancelled.body.statusHistory.map((h) => h.status)).toEqual(
      expect.arrayContaining(['pending_payment', 'received', 'confirmed', 'ready', 'cancelled']),
    );
  });

  it('refuse une transition invalide', async () => {
    const { body } = await request(app).post('/api/orders').send(orderBody()).expect(201);
    await admin.post(`/api/admin/orders/${body.order._id}/status`).send({ status: 'completed' }).expect(400);
  });

  it('Interac : en attente de virement puis marqué reçu', async () => {
    const { body } = await request(app).post('/api/orders').send(orderBody({ paymentMethod: 'interac' })).expect(201);
    expect(body.order.payment.status).toBe('awaiting_transfer');
    expect(body.clientSecret).toBeNull();
    const res = await admin.post(`/api/admin/orders/${body.order._id}/interac-received`).expect(200);
    expect(res.body.payment.status).toBe('paid');
  });

  it('gère produits, promotions et réglages', async () => {
    const cats = await admin.get('/api/admin/categories').expect(200);
    const created = await admin
      .post('/api/admin/products')
      .send({
        name: { fr: 'Éclair au café' },
        category: cats.body[0]._id,
        allergens: ['gluten', 'milk'],
        variants: [{ label: { fr: 'Unité' }, price: 550 }],
      })
      .expect(201);
    expect(created.body.slug).toBe('eclair-au-cafe');
    await admin.patch(`/api/admin/products/${created.body._id}/active`).send({ active: false }).expect(200);
    await admin.post('/api/admin/products').send({ name: { fr: 'x' }, category: cats.body[0]._id, variants: [] }).expect(400);

    await admin.post('/api/admin/promos').send({ code: 'NOEL', type: 'percent', value: 150 }).expect(400);
    await admin.post('/api/admin/promos').send({ code: 'NOEL', type: 'fixed', value: 500 }).expect(201);

    const s = await admin.put('/api/admin/settings').send({ minimumOrder: 2000, taxesEnabled: true }).expect(200);
    expect(s.body.minimumOrder).toBe(2000);
    await admin.put('/api/admin/settings').send({ deliveryEnabled: false, pickupEnabled: false }).expect(400);

    await admin.delete(`/api/admin/categories/${cats.body[0]._id}`).expect(400);
  });

  it('statistiques', async () => {
    const { body } = await request(app).post('/api/orders').send(orderBody()).expect(201);
    await admin.post(`/api/admin/orders/${body.order._id}/confirm`).send({}).expect(200);
    const stats = await admin.get('/api/admin/stats').expect(200);
    expect(stats.body.orders).toBe(1);
    expect(stats.body.revenue).toBe(5200);
    expect(stats.body.topProducts[0].name).toBe('Fraisier');
  });
});

describe('Cartes-cadeaux', () => {
  it('achat, émission après paiement, puis utilisation', async () => {
    const buy = await request(app)
      .post('/api/orders')
      .send(
        orderBody({
          items: [{ productId: String(giftCardProduct._id), variantId: String(giftCardProduct.variants[0]._id), quantity: 1 }],
          fulfillment: undefined,
          paymentMethod: 'interac',
        }),
      )
      .expect(201);
    expect(buy.body.order.fulfillment.type).toBe('none');
    expect(buy.body.order.pricing.deliveryFee).toBe(0);

    await admin.post(`/api/admin/orders/${buy.body.order._id}/interac-received`).expect(200);
    const card = await GiftCard.findOne({ purchaseOrder: buy.body.order._id });
    expect(card.balance).toBe(5000);

    const check = await request(app).post('/api/giftcards/check').send({ code: card.code }).expect(200);
    expect(check.body).toMatchObject({ valid: true, balance: 5000 });

    // 4200 + 1000 livraison = 5200 ; la carte paie 5000, reste 200 par Stripe
    const use = await request(app).post('/api/orders').send(orderBody({ giftCardCode: card.code })).expect(201);
    expect(use.body.order.pricing).toMatchObject({ giftCardApplied: 5000, amountDue: 200 });
    expect((await GiftCard.findById(card._id)).balance).toBe(0);

    // Annulation : le solde est rendu
    await request(app).post(`/api/orders/track/${use.body.order.number}/cancel`).send({ token: use.body.trackingToken }).expect(200);
    expect((await GiftCard.findById(card._id)).balance).toBe(5000);
  });

  it('commande payée entièrement par carte-cadeau', async () => {
    await GiftCard.create({ code: 'GC-TEST-0001', initialBalance: 10000, balance: 10000 });
    const res = await request(app)
      .post('/api/orders')
      .send(orderBody({ giftCardCode: 'gc-test-0001', fulfillment: { type: 'pickup' } }))
      .expect(201);
    expect(res.body.order.payment).toMatchObject({ method: 'giftcard', status: 'paid' });
    expect(res.body.order.pricing.amountDue).toBe(0);
  });
});

describe('Comptes clients', () => {
  it('inscription, commande liée au compte, historique', async () => {
    const client = request.agent(app);
    await client.post('/api/auth/register').send({ email: 'Luc@Example.com', password: 'motdepasse', name: 'Luc' }).expect(201);
    const me = await client.get('/api/auth/me').expect(200);
    expect(me.body.email).toBe('luc@example.com');

    await client.post('/api/auth/register').send({ email: 'luc@example.com', password: 'autremotdepasse', name: 'Luc' }).expect(409);

    const { body } = await client.post('/api/orders').send(orderBody()).expect(201);
    // Le propriétaire suit sa commande sans jeton
    await client.get(`/api/orders/track/${body.order.number}`).expect(200);

    const history = await client.get('/api/account/orders').expect(200);
    expect(history.body).toHaveLength(1);

    await client.post('/api/auth/logout').expect(204);
    await client.get('/api/account/orders').expect(401);
    await request(app).post('/api/auth/login').send({ email: 'luc@example.com', password: 'mauvais-mdp' }).expect(401);
  });
});

describe('Nettoyage', () => {
  it('annule les paiements Stripe abandonnés sans notifier', async () => {
    const { expireAbandonedOrders } = await import('../src/services/orderService.js');
    const { body } = await request(app).post('/api/orders').send(orderBody()).expect(201);
    // Accès direct à la collection : Mongoose protège createdAt en écriture
    await Order.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(body.order._id) },
      { $set: { status: 'pending_payment', 'payment.status': 'pending', createdAt: new Date(Date.now() - 2 * 3600 * 1000) } },
    );
    expect(await expireAbandonedOrders(60)).toBe(1);
    expect((await Order.findById(body.order._id)).status).toBe('cancelled');
  });
});
