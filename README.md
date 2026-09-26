# Pâtisserie

Boutique en ligne d'une pâtisserie maison à Québec. Voir [SPEC.md](SPEC.md) pour la spécification complète.

```
patisserie/
├── server/   API Express + MongoDB (étape 1 — terminée)
├── client/   React + Vite (étape 2 : identité visuelle — terminée)
├── brand/    Logo (SVG) et planche de présentation
├── PROJET.md Document de référence du projet
├── STYLE.md  Identité visuelle et interface
├── SPEC.md
└── render.yaml
```

## Démarrer l'API en local

```bash
cd server
cp .env.example .env        # remplir au minimum MONGODB_URI
npm install
npm run seed                # catalogue de démonstration (vide le catalogue !)
npm run create-admin -- vous@exemple.com "Votre nom" "motDePasseDe10Car"
npm run dev                 # http://localhost:4000/api/health
```

Sans clés Stripe, Twilio ou Resend, tout fonctionne en **mode simulé** : les paiements sont
pré-autorisés automatiquement, SMS et courriels s'affichent dans la console.

## Démarrer le site en local

```bash
cd client
npm install
npm run dev                 # http://localhost:5173 (les appels /api vont vers :4000)
npm run marque              # régénère logo, favicon et icônes (si le nom change dans src/config/brand.js)
```

## Tests

```bash
npm test
```

41 tests (calcul des prix + parcours complets de l'API). Ils téléchargent une base MongoDB en
mémoire au premier lancement ; pour utiliser une base existante :
`MONGODB_TEST_URI=mongodb://127.0.0.1:27017 npm test`.

Pour tester l'API à la main (Postman, 84 requêtes prêtes) : voir [server/docs/TESTS-API.md](server/docs/TESTS-API.md).

## Organisation du code

| Dossier | Rôle |
|---|---|
| `src/models/` | Schémas Mongoose : produits, catégories, commandes, clients, promos, cartes-cadeaux, réglages |
| `src/lib/pricing.js` | Calcul des montants (fonction pure, testée) |
| `src/services/orderService.js` | Toute la logique de commande : création, pré-autorisation, confirmation, annulation, remboursement |
| `src/lib/payments.js` | Stripe (avec mode simulé) |
| `src/lib/notifications.js` | SMS et courriels bilingues |
| `src/routes/` | Routes publiques, compte client, webhook Stripe |
| `src/routes/admin/` | Tableau de bord (protégé) |

## Référence de l'API

Montants en **cents CAD**. Textes bilingues sous la forme `{ fr, en }`.

### Public
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/settings` | Réglages publics (ouverture, minimum, frais, modes de paiement) |
| GET | `/api/categories` | Catégories actives |
| GET | `/api/products?category=&featured=&seasonal=` | Produits disponibles |
| GET | `/api/products/:slug` | Fiche produit |
| POST | `/api/cart/quote` | Montants et erreurs du panier, sans enregistrer |
| POST | `/api/orders` | Passer commande → `{ order, trackingToken, clientSecret }` |
| GET | `/api/orders/track/:number?t=jeton` | Suivi |
| POST | `/api/orders/track/:number/cancel` | Annulation client (avant confirmation) |
| POST | `/api/giftcards/check` | Solde d'une carte-cadeau |

### Compte client
`POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` ·
`PATCH /api/account` · `POST /api/account/password` · `GET /api/account/orders`

### Admin (`/api/admin`, rôle admin requis)
| Route | Description |
|---|---|
| `GET /orders?status=&search=&page=` | Liste (`status=active` pour les commandes en cours) |
| `GET /orders/:id` | Détail + autres commandes du même client |
| `POST /orders/:id/confirm` `{ scheduledFor }` | Confirme et **débite** la pré-autorisation |
| `POST /orders/:id/status` `{ status }` | `in_preparation`, `ready`, `completed` |
| `PATCH /orders/:id/schedule` | Modifier la date convenue |
| `POST /orders/:id/interac-received` | Virement Interac reçu |
| `POST /orders/:id/cancel` `{ reason, refund }` | Annule (libère ou rembourse) |
| `POST /orders/:id/refund` `{ amount? }` | Remboursement partiel ou total |
| `POST /orders/:id/notes` | Note interne |
| `/categories`, `/products` | CRUD (+ `PATCH /products/:id/active`) |
| `/promos`, `/giftcards` | Codes promo et cartes-cadeaux |
| `GET/PUT /settings` | Réglages de la boutique |
| `GET /stats?days=30` | Ventes, panier moyen, meilleurs produits |
| `POST /uploads/signature` | Signature pour envoyer une image à Cloudinary |
| `/users` | Gestion des administratrices |

## Paiement Stripe : comment ça marche

1. `POST /api/orders` crée un PaymentIntent en **capture manuelle** et renvoie `clientSecret`.
2. Le frontend affiche le formulaire Stripe (Payment Element) avec ce `clientSecret`.
3. Stripe appelle le webhook → la commande passe à `received` (carte bloquée, pas débitée).
4. La pâtissière appelle le client, puis **confirme** dans le tableau de bord → débit.
5. Annulation avant confirmation → fonds libérés sans frais.

⚠️ Une pré-autorisation expire après 7 jours : la liste admin signale `authorizationExpiringSoon` après 5 jours.

**Webhook** (tableau de bord Stripe → Développeurs → Webhooks) : URL `https://api.votre-domaine.ca/api/webhooks/stripe`,
événements `payment_intent.amount_capturable_updated`, `payment_intent.payment_failed`, `payment_intent.canceled`.
En local : `stripe listen --forward-to localhost:4000/api/webhooks/stripe`.

## Déploiement (Render)

1. Pousser le dépôt sur GitHub.
2. Render → **New → Blueprint** → choisir le dépôt (`render.yaml` crée le service).
3. Renseigner les variables marquées `sync: false`.
4. Idéalement : `api.votre-domaine.ca` pour l'API et `www.votre-domaine.ca` pour le site,
   ce qui permet `COOKIE_SAMESITE=lax`. Sinon, mettre `none`.
5. MongoDB Atlas → Network Access : autoriser `0.0.0.0/0` (Render n'a pas d'IP fixe sur ce plan).
