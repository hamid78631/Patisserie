/**
 * Données de démonstration : catégories, produits, réglages et un code promo.
 * Usage : npm run seed   (ATTENTION : vide le catalogue existant)
 */
import mongoose from 'mongoose';
import { config } from './config.js';
import { Category, Product, PromoCode, Settings } from './models/index.js';

const v = (fr, en, price) => ({ label: { fr, en }, price });

async function seed() {
  await mongoose.connect(config.mongoUri);
  await Promise.all([Category.deleteMany({}), Product.deleteMany({})]);

  const [gateaux, viennoiseries, mignardises, fetes, cadeaux] = await Category.create([
    { name: { fr: 'Gâteaux', en: 'Cakes' }, sortOrder: 1, description: { fr: 'Gâteaux entiers faits sur commande.', en: 'Whole cakes made to order.' } },
    { name: { fr: 'Viennoiseries', en: 'Pastries' }, sortOrder: 2, description: { fr: 'Croissants, brioches et plus.', en: 'Croissants, brioches and more.' } },
    { name: { fr: 'Macarons et mignardises', en: 'Macarons & petits fours' }, sortOrder: 3 },
    { name: { fr: 'Temps des fêtes', en: 'Holiday season' }, sortOrder: 4, description: { fr: 'Éditions limitées.', en: 'Limited editions.' } },
    { name: { fr: 'Cartes-cadeaux', en: 'Gift cards' }, sortOrder: 5 },
  ]);

  const year = new Date().getFullYear();

  await Product.create([
    {
      name: { fr: 'Fraisier', en: 'Strawberry cake' },
      category: gateaux._id,
      description: {
        fr: 'Génoise légère, crème mousseline à la vanille et fraises fraîches du Québec.',
        en: 'Light sponge, vanilla mousseline cream and fresh Québec strawberries.',
      },
      ingredients: { fr: 'Farine, œufs, sucre, beurre, lait, fraises, vanille', en: 'Flour, eggs, sugar, butter, milk, strawberries, vanilla' },
      allergens: ['gluten', 'eggs', 'milk'],
      variants: [v('6 parts', '6 servings', 4200), v('10 parts', '10 servings', 6500), v('16 parts', '16 servings', 9500)],
      allowsMessage: true,
      featured: true,
      leadTimeHours: 72,
    },
    {
      name: { fr: 'Gâteau au chocolat noir', en: 'Dark chocolate cake' },
      category: gateaux._id,
      description: { fr: 'Trois couches de chocolat 70 %, ganache fondante.', en: 'Three layers of 70% chocolate, silky ganache.' },
      ingredients: { fr: 'Chocolat noir, beurre, œufs, sucre, farine, crème', en: 'Dark chocolate, butter, eggs, sugar, flour, cream' },
      allergens: ['gluten', 'eggs', 'milk', 'soy'],
      variants: [v('6 parts', '6 servings', 3800), v('10 parts', '10 servings', 5900)],
      allowsMessage: true,
      featured: true,
      leadTimeHours: 48,
    },
    {
      name: { fr: 'Tarte au sucre', en: 'Sugar pie' },
      category: gateaux._id,
      description: { fr: 'La classique québécoise, à l’érable.', en: 'The Québec classic, with maple.' },
      ingredients: { fr: 'Farine, beurre, cassonade, sirop d’érable, crème', en: 'Flour, butter, brown sugar, maple syrup, cream' },
      allergens: ['gluten', 'milk'],
      variants: [v('9 pouces', '9 inch', 2400)],
      leadTimeHours: 48,
    },
    {
      name: { fr: 'Croissants au beurre', en: 'Butter croissants' },
      category: viennoiseries._id,
      description: { fr: 'Pâte feuilletée au beurre, trois jours de préparation.', en: 'Butter laminated dough, three days in the making.' },
      ingredients: { fr: 'Farine, beurre, lait, sucre, levure, sel', en: 'Flour, butter, milk, sugar, yeast, salt' },
      allergens: ['gluten', 'milk'],
      variants: [v('Boîte de 6', 'Box of 6', 1800), v('Boîte de 12', 'Box of 12', 3300)],
      featured: true,
      leadTimeHours: 72,
    },
    {
      name: { fr: 'Chocolatines', en: 'Chocolate croissants' },
      category: viennoiseries._id,
      ingredients: { fr: 'Farine, beurre, chocolat, lait, sucre, levure', en: 'Flour, butter, chocolate, milk, sugar, yeast' },
      allergens: ['gluten', 'milk', 'soy'],
      variants: [v('Boîte de 6', 'Box of 6', 2000), v('Boîte de 12', 'Box of 12', 3700)],
      leadTimeHours: 72,
    },
    {
      name: { fr: 'Macarons assortis', en: 'Assorted macarons' },
      category: mignardises._id,
      description: { fr: 'Framboise, pistache, caramel salé, citron, chocolat.', en: 'Raspberry, pistachio, salted caramel, lemon, chocolate.' },
      ingredients: { fr: 'Poudre d’amande, sucre, blancs d’œufs, beurre, crème, pistaches', en: 'Almond flour, sugar, egg whites, butter, cream, pistachios' },
      allergens: ['tree_nuts', 'eggs', 'milk'],
      variants: [v('Boîte de 12', 'Box of 12', 2800), v('Boîte de 24', 'Box of 24', 5200)],
      featured: true,
      leadTimeHours: 48,
    },
    {
      name: { fr: 'Bûche de Noël', en: 'Yule log' },
      category: fetes._id,
      description: { fr: 'Chocolat, praliné noisette et crème vanille.', en: 'Chocolate, hazelnut praline and vanilla cream.' },
      ingredients: { fr: 'Chocolat, noisettes, œufs, sucre, beurre, crème, farine', en: 'Chocolate, hazelnuts, eggs, sugar, butter, cream, flour' },
      allergens: ['gluten', 'eggs', 'milk', 'tree_nuts'],
      variants: [v('6 parts', '6 servings', 4800), v('10 parts', '10 servings', 7200)],
      allowsMessage: true,
      seasonal: { enabled: true, startDate: new Date(`${year}-11-15`), endDate: new Date(`${year}-12-24T23:59:59`) },
      leadTimeHours: 96,
    },
    {
      name: { fr: 'Carte-cadeau', en: 'Gift card' },
      category: cadeaux._id,
      description: {
        fr: 'Le code est envoyé par courriel dès la confirmation du paiement. Valide 5 ans.',
        en: 'The code is emailed as soon as payment is confirmed. Valid for 5 years.',
      },
      variants: [v('25 $', '$25', 2500), v('50 $', '$50', 5000), v('100 $', '$100', 10000)],
      isGiftCard: true,
      leadTimeHours: 0,
    },
  ]);

  await Settings.findOneAndUpdate(
    { _id: 'shop' },
    { interacEmail: 'paiement@example.com', notificationEmail: 'commandes@example.com' },
    { upsert: true, setDefaultsOnInsert: true },
  );

  await PromoCode.updateOne(
    { code: 'BIENVENUE10' },
    { $setOnInsert: { code: 'BIENVENUE10', type: 'percent', value: 10, minSubtotal: 3000 } },
    { upsert: true },
  );

  console.log('Catalogue de démonstration créé (5 catégories, 8 produits, code BIENVENUE10).');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
