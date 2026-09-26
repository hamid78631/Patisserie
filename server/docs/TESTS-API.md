# Tester l'API à la main

Ce guide permet de tester **toutes les routes de l'API** sur votre ordinateur, en mode simulé
(sans clés Stripe, Twilio ni Resend). Toutes les requêtes et leurs corps JSON sont prêts dans
**`patisserie-api.postman_collection.json`** (84 requêtes, 120 vérifications automatiques).

## 1. Préparer la base MongoDB

Deux possibilités :

- **MongoDB Atlas (recommandé, rien à installer)** : créer un compte gratuit sur
  <https://www.mongodb.com/atlas>, un cluster **M0**, un utilisateur de base de données,
  autoriser votre adresse IP (Network Access), puis copier l'URI (Connect → Drivers).
- **MongoDB installé en local** (MongoDB Community Server) : l'URI est alors
  `mongodb://127.0.0.1:27017/patisserie`.

Les collections et les index sont créés automatiquement au premier démarrage : rien à faire à la main.

## 2. Lancer l'API

```bash
cd server
cp .env.example .env      # puis mettre votre URI dans MONGODB_URI (le reste peut rester vide)
npm install
npm run seed              # catalogue de démonstration (ATTENTION : vide le catalogue)
npm run create-admin -- admin@exemple.com "Admin Test" "motdepasse123"
npm run dev               # http://localhost:4000/api/health doit répondre {"ok":true,"db":"up"}
```

L'administratrice `admin@exemple.com` / `motdepasse123` est celle utilisée par la collection.
Si vous en choisissez une autre, changez les variables `adminEmail` et `adminPassword` de la collection.

## 3. Importer et lancer la collection

1. Installer **Postman** (gratuit), ou Insomnia / Bruno qui savent importer ce format.
2. **Import** → choisir `server/docs/patisserie-api.postman_collection.json`.
3. Ouvrir la collection → **Run** → **Run Pâtisserie — tests de l'API**.

Les requêtes s'enchaînent : chacune enregistre ce dont les suivantes ont besoin (identifiants de
produits, numéro et jeton de commande, code de carte-cadeau…). Les cookies de session sont gérés
automatiquement par Postman. On peut aussi les lancer une par une, **dans l'ordre**.

En ligne de commande : `npx newman run server/docs/patisserie-api.postman_collection.json`

Pour relancer depuis zéro : `npm run seed` puis relancer la collection (les courriels des comptes
et des administratrices créés changent à chaque exécution, il n'y a donc pas de conflit).

## 4. Ce que couvre la collection

| Dossier | Contenu |
|---|---|
| 0. Santé et réglages publics | `GET /health`, `GET /settings` (vérifie que l'adresse de cueillette et les coordonnées de notification restent privées) |
| 1. Catalogue | catégories, produits (tous, par catégorie, vedettes, saisonniers), fiche produit, produit inexistant (404) |
| 2. Devis du panier | livraison, cueillette, code promo, et chaque erreur : minimum, hors zone, promo inconnue, réception manquante, données invalides |
| 3. Commandes d'un invité | commande par carte (simulée) et par Interac, suivi avec et sans jeton, annulation par le client, carte-cadeau inconnue |
| 4. Compte client | inscription, profil, commande connectée, historique, mot de passe, déconnexion, accès admin refusé |
| 5. Tableau de bord : commandes | connexion admin, listes et recherche, détail, confirmer (débit), changer la date, préparation, prête, note interne, remboursement partiel, terminée, transition refusée, virement Interac reçu, annulation, statistiques |
| 6. Catalogue et promotions (admin) | CRUD catégorie, produit (variantes, allergènes, saisonnier, taxable), désactivation rapide, suppression refusée d'une catégorie non vide, CRUD code promo |
| 7. Cartes-cadeaux | achat par Interac, émission après paiement, vérification du solde, paiement d'une commande avec la carte, émission manuelle, ajustement |
| 8. Réglages, équipe, divers | fermer et rouvrir les commandes, coordonnées publiques et permis, réglage refusé, ajout et retrait d'une administratrice, signature Cloudinary |

## 5. À observer dans la console de l'API

En mode simulé, les SMS et les courriels sont affichés dans le terminal de `npm run dev`, avec
leurs liens. Exemple après « Confirmer » :

```
[Courriel simulé] → lea.tremblay@exemple.com: Commande P-2026-0001 confirmée | http://localhost:5173/commande/P-2026-0001?t=5486…
[SMS simulé] → 418 555-1234: Votre commande P-2026-0001 est confirmée pour le dimanche 20 décembre 2026 à 15 h 00.
```

## 6. Rappels utiles

- **Montants en cents** : `4200` = 42,00 $. Le serveur recalcule toujours les prix ; le client
  n'envoie que des identifiants et des quantités.
- **Erreurs** : format `{ "error": "code", "message": "…", "details": … }`. Pour une commande
  refusée, `error` vaut `order_invalid` et `details` liste les codes (`below_minimum`, `delivery_zone`…).
- **Mode simulé** : sans `STRIPE_SECRET_KEY`, une commande par carte est immédiatement « Reçue »
  et « pré-autorisée » (`clientSecret: null`). Le vrai parcours Stripe sera testé à l'étape 4
  avec des clés de test.
- **Limitation de débit** : 20 connexions ou commandes par 15 minutes et par adresse IP. Si vous
  relancez la collection très souvent, attendez ou redémarrez l'API (`too_many_requests`).
