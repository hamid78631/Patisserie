# Pâtisserie — Spécification

Site e-commerce d'une pâtisserie maison à Québec (QC, Canada). Nom provisoire : **Pâtisserie**.

## 1. Contexte

- Entreprise en démarrage, production à domicile, tout est fait **sur commande**.
- Le client ne choisit pas de date : après la commande, la pâtissière le contacte pour convenir de la date et de l'heure.
- Deux administratrices gèrent le site.
- À régler hors site avant l'ouverture des ventes : permis MAPAQ, inscription TPS/TVQ (si > 30 000 $/an), relecture juridique de la politique de confidentialité (Loi 25).

## 2. Stack

| Couche | Choix |
|---|---|
| Frontend | React + Vite (site statique Render) |
| API | Node.js + Express (Render, plan Starter ~7 $/mois) |
| Base | MongoDB Atlas (Mongoose) |
| Paiement | Stripe (PaymentIntent, capture manuelle) + Interac (manuel) |
| Images | Cloudinary |
| SMS | Twilio |
| Courriels | Resend |
| Code | GitHub (compte hamid78631) |

Tous les services externes sont **optionnels en développement** : sans clé, l'API journalise au lieu d'envoyer (SMS, courriel) et Stripe est simulé.

## 3. Langues

Français par défaut (Loi 96), anglais en option. Les contenus traduisibles sont stockés `{ fr, en }`.

## 4. Catalogue

- **Catégorie** : nom, slug, description, ordre d'affichage, active.
- **Produit** : nom, slug, description, catégorie, images, ingrédients, allergènes (liste normalisée : gluten, lait, œufs, arachides, noix, soja, sésame, moutarde, sulfites, poisson, crustacés), variantes, saisonnier (dates de début et fin), vedette, actif, délai de préparation (h).
- **Variante** : libellé (ex. « 8 parts »), prix (en cents), active. Au moins une par produit.
- Un produit saisonnier n'est visible qu'entre ses dates.

## 5. Commande

### Parcours client
1. Panier → choix **livraison** (ville de Québec, adresse + code postal G1*/G2*/G3*) ou **cueillette**.
2. Coordonnées (nom, courriel, téléphone), notes, message personnalisé par article.
3. Code promo et/ou carte-cadeau.
4. Mode de paiement : **Stripe** (carte, Apple Pay, Google Pay) ou **Interac**.
5. Confirmation : numéro de commande (ex. `P-2026-0042`) et lien de suivi.

### Règles
- Montant minimum : **30 $** (avant taxes, hors livraison) — configurable.
- Frais de livraison : **10 $** — configurable. Cueillette gratuite.
- Taxes : TPS 5 % + TVQ 9,975 %, **désactivées par défaut** (petit fournisseur), activables.
- Les prix sont toujours recalculés côté serveur, jamais pris du navigateur.
- Commandes fermables par l'admin (interrupteur global + message affiché).

### Statuts
```
pending_payment → received → confirmed → in_preparation → ready → completed
                      ↘ cancelled (client ou admin)        ↘ cancelled (admin, avec remboursement)
```

### Paiement Stripe — pré-autorisation
- À la commande : PaymentIntent `capture_method=manual` → la carte est **bloquée**, pas débitée.
- L'admin **confirme** la commande (après avoir convenu de la date) → capture.
- Annulation avant confirmation → annulation du PaymentIntent (fonds libérés, aucun frais).
- Une pré-autorisation expire après **7 jours** : le tableau de bord signale les commandes proches de l'expiration.
- Webhook Stripe : `payment_intent.amount_capturable_updated` → passe la commande à `received`.

### Paiement Interac
- La page de confirmation affiche l'adresse Interac et le numéro de commande à mettre en message.
- La commande est `received` avec `payment.status = awaiting_transfer`; l'admin marque « paiement reçu ».

### Annulations et remboursements
- **Client** : peut annuler tant que la commande n'est pas `confirmed` (depuis le lien de suivi ou son compte).
- **Admin** : peut annuler à tout moment ; remboursement total ou partiel via Stripe. Interac : remboursement manuel, noté dans la commande.

## 6. Promotions

- **Code promo** : code, type (pourcentage ou montant fixe), valeur, minimum de commande, dates, nombre maximal d'utilisations, actif.
- **Carte-cadeau** : code unique, solde initial, solde restant, expiration. Achetable sur le site (produit spécial) ; code envoyé par courriel après paiement. Utilisable en paiement partiel ou total.

## 7. Comptes

- Commande **en invité** par défaut.
- Compte client **optionnel** : historique des commandes, coordonnées préremplies, annulation.
- Authentification par JWT en cookie httpOnly. Mots de passe hachés (bcrypt).
- Rôles : `customer`, `admin`.

## 8. Notifications

| Événement | Client | Admin |
|---|---|---|
| Commande reçue | SMS + courriel | SMS + courriel |
| Commande confirmée (paiement capturé) | SMS + courriel | — |
| Commande prête | SMS | — |
| Commande annulée / remboursée | courriel | courriel |
| Carte-cadeau achetée | courriel (avec code) | — |

## 9. Tableau de bord admin

- **Commandes** : liste filtrable (statut, mode, date), recherche par numéro, nom ou téléphone. Détail : client, articles, messages, adresse, paiement, historique des statuts, notes internes. Actions : confirmer, changer de statut, marquer Interac reçu, annuler, rembourser.
- **Produits et catégories** : création, édition, activation, upload d'images.
- **Promotions** : codes promo et cartes-cadeaux.
- **Paramètres** : ouverture des commandes, message de fermeture, minimum, frais de livraison, taxes, adresse Interac, adresse de cueillette, téléphone et courriel de notification.
- **Statistiques simples** : ventes du mois, nombre de commandes, produits les plus vendus.

## 10. Légal (pages statiques)

Politique de confidentialité (Loi 25, responsable des renseignements personnels), conditions de vente (annulation, remboursement, allergènes), mentions « prix en dollars canadiens ».

## 11. Sécurité

Helmet, CORS limité au domaine du frontend, limitation de débit sur l'authentification et la commande, validation des entrées (zod), aucun numéro de carte stocké (Stripe uniquement), vérification de la signature des webhooks.

## 12. Livraison par étapes

1. **API** : modèles, catalogue, commandes, paiements, promotions, admin, tests.
2. **Frontend public** : accueil, catalogue, fiche produit, panier, commande, suivi, compte.
3. **Frontend admin** : tableau de bord.
4. **Identité visuelle** : nom, logo, palette.
5. **Déploiement** : Render + Atlas + domaine + Stripe en mode réel.
