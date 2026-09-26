# PROJET — Site e-commerce « Pâtisserie » (Québec)

> **Document de référence unique du projet.** Il rassemble tout ce qui a été discuté et décidé.
> Il est destiné à Claude Code pour construire le projet **en intégralité**.
> En cas de conflit entre ce document et le code existant, **ce document fait foi**, sauf mention contraire.
> Dernière mise à jour : 26 septembre 2026.

---

## 0. Instructions pour Claude Code

1. **Lire ce document en entier avant de coder.**
2. Le **backend (`server/`) est déjà construit et testé** (41 tests qui passent depuis l’audit). Ne pas le réécrire. L'étendre seulement si une fonctionnalité de ce document l'exige, et garder tous les tests au vert (`cd server && npm test`).
3. Il reste à construire : le **frontend public**, le **tableau de bord admin** (tous deux dans `client/`), les **pages légales**, l'**identité visuelle** (section 14) et le **déploiement**.
4. Respecter l'ordre des étapes de la section 17 et livrer une étape fonctionnelle avant de passer à la suivante.
5. Règles non négociables :
   - Tous les montants sont en **cents CAD** (entiers), côté API comme en base. Le frontend formate avec `Intl.NumberFormat('fr-CA' | 'en-CA', { style: 'currency', currency: 'CAD' })`.
   - Les prix sont **toujours recalculés par le serveur**. Le frontend n'envoie que des identifiants et des quantités.
   - Le site est en **français par défaut** (Loi 96), avec l'anglais en option.
   - Aucune donnée de carte bancaire ne transite par notre serveur : on utilise uniquement Stripe Payment Element.
   - Le code et les commentaires sont en **français**.
6. Quand une information manque, choisir la valeur par défaut la plus raisonnable, la rendre **configurable depuis l'admin** si c'est une règle métier, et la noter dans la section « Questions ouvertes » (section 19).

---

## 1. Contexte et acteurs

| Rôle | Qui |
|---|---|
| Développeur | **Hamid** (Hamidou Mamoudou), étudiant ingénieur à Casablanca, Maroc. GitHub : `github.com/hamid78631` |
| Cliente (propriétaire de la boutique) | Une pâtissière qui **démarre son entreprise à domicile** à **Québec (ville), province de Québec, Canada** |
| Administratrices | La cliente **et une 2e personne** (2 comptes admin) |
| Clients finaux | Particuliers de la ville de Québec, francophones en majorité, anglophones possibles |

**Historique de la décision.** Le projet a d'abord été pensé pour le Maroc, mais **Stripe n'y est pas disponible** (il aurait fallu CMI, PayZone ou le paiement à la livraison). La boutique est finalement **au Canada**, où Stripe est pleinement disponible. **Tout ce qui concernait le Maroc est abandonné** : pas de CMI, pas de MAD, pas de paiement à la livraison.

**État de l'entreprise.** Rien n'existe encore : pas de nom, pas de logo, pas de photos, pas de permis alimentaire, probablement pas d'entreprise enregistrée. Le site sert au lancement. Tout le contenu (produits, prix, délais, textes) est **fictif mais réaliste**, et la cliente le modifiera ensuite depuis l'admin.

---

## 2. Nom et marque

- Nom **provisoire** : **« Pâtisserie »**. Il doit être modifiable facilement : centraliser le nom, le slogan et les coordonnées dans un seul fichier de configuration du frontend (`client/src/config/brand.js`).
- Logo, palette et typographie : à créer, voir la section 14 (Identité visuelle).

---

## 3. Contraintes légales (Québec, Canada)

Je ne donne pas d'avis juridique : ces points sont **à faire valider par la cliente**. Le site doit cependant être prêt pour chacun d'eux.

| Sujet | Ce que ça implique pour le site |
|---|---|
| **Permis MAPAQ** (vente d'aliments préparés à domicile) | La cliente n'en a probablement pas encore. Il est à obtenir **avant d'ouvrir les ventes**. Le site peut être construit en parallèle, avec les commandes **fermées** (`ordersOpen = false`) jusqu'à l'obtention. Prévoir un champ « Numéro de permis » affichable en pied de page (réglage admin). |
| **Loi 96** (langue française) | Le français est la langue par défaut de tout le site, des courriels et des SMS. L'anglais est une option, jamais plus visible que le français. |
| **Loi 25** (renseignements personnels) | Une page **Politique de confidentialité** : responsable de la protection des renseignements personnels (nom et courriel de la cliente), données collectées, finalités, sous-traitants (Stripe, Twilio, Resend, MongoDB Atlas, Cloudinary, Render), durée de conservation, droits d'accès, de rectification et de suppression. Pas de cookies de suivi ni d'analytics sans consentement (aucun analytics prévu pour l'instant). |
| **Taxes TPS / TVQ** | TPS 5 % et TVQ 9,975 %. En dessous de **30 000 $ de ventes sur 4 trimestres**, la cliente est « petit fournisseur » et **n'a pas à percevoir** les taxes. Les taxes sont donc **désactivées par défaut** et activables dans l'admin, avec saisie des numéros TPS et TVQ affichés sur les reçus. |
| **Taxabilité des produits** | Beaucoup de produits de boulangerie sont **détaxés** (produits alimentaires de base, ex. un gâteau entier). Les portions individuelles vendues en quantité inférieure à 6 sont généralement **taxables**. Chaque produit a donc une case **« taxable »** (décochée par défaut). À valider avec un comptable. |
| **Loi sur la protection du consommateur** | Prix affichés en **dollars canadiens**, total clair avant paiement, conditions d'annulation et de remboursement visibles avant la commande. |
| **Allergènes** | Liste des allergènes et des ingrédients affichée sur chaque produit, plus une mention générale « préparé dans une cuisine qui manipule noix, arachides, gluten… ». |

---

## 4. Stack et hébergement (décisions prises)

| Couche | Choix | Remarques |
|---|---|---|
| Frontend | **React + Vite** | Site statique hébergé sur Render (Static Site, gratuit, pas de mise en veille) |
| API | **Node.js ≥ 20 + Express** | Render **Web Service, plan Starter (~7 $/mois)** pour éviter la mise en veille. Budget validé. |
| Base | **MongoDB Atlas** (offre gratuite M0) + **Mongoose** | |
| Paiement | **Stripe** (Payment Element + PaymentIntent en capture manuelle) | Cartes, Apple Pay, Google Pay, en CAD |
| Paiement alternatif | **Virement Interac** | Manuel, confirmé par l'admin |
| Images | **Cloudinary** (offre gratuite) | Le disque de Render est éphémère : jamais d'upload sur le serveur |
| SMS | **Twilio** | Numéro canadien, quelques $ par mois |
| Courriels | **Resend** (offre gratuite) | Domaine à vérifier (SPF/DKIM) |
| Domaine | Un **.ca** (~15 $/an), prévu mais pas encore acheté | Recommandé : `www.<domaine>.ca` pour le site et `api.<domaine>.ca` pour l'API (même site, donc cookies `SameSite=Lax`) |
| Code | **GitHub, sur le compte de Hamid** (`hamid78631`) | Monorepo `patisserie/` avec `server/` et `client/` |

Tous les services externes sont **optionnels en développement** : sans clé, l'API fonctionne en **mode simulé** (paiements pré-autorisés automatiquement, SMS et courriels affichés dans la console). Le frontend doit gérer ce mode (voir 9.4).

---

## 5. Décisions fonctionnelles (synthèse)

| Sujet | Décision |
|---|---|
| Production | **Tout est fait sur commande**, aucun stock à gérer |
| Date et heure | **Le client ne choisit PAS de date.** Il commande, puis la pâtissière **le contacte** pour convenir de la date et de l'heure, qu'elle saisit dans l'admin (`scheduledFor`). |
| Délai de préparation | Un délai par produit (`leadTimeHours`, défaut 48 h), affiché à titre indicatif (« Prévoir au moins 48 h »). Valeurs fictives que la cliente ajustera. |
| Réception | **Livraison** (ville de Québec uniquement) **et cueillette** (retrait chez la pâtissière), toutes deux activées |
| Zone de livraison | Codes postaux commençant par **G1, G2, G3** (configurable) |
| Frais de livraison | **10 $** fixes (configurable). Cueillette gratuite. |
| Minimum de commande | **30 $** avant taxes, hors livraison et hors cartes-cadeaux (configurable) |
| Paiement | **Stripe avec pré-autorisation** + **Interac** proposé dans l'application |
| Annulation | Le client annule lui-même **tant que la commande n'est pas confirmée** ; ensuite seule l'admin peut annuler et rembourser |
| Remboursements | Faits **depuis le site** (tableau de bord), en tout ou en partie |
| Codes promo | Oui |
| Cartes-cadeaux | Oui (achat sur le site + émission manuelle par l'admin) |
| Comptes clients | **Optionnels** : commande en invité possible |
| Langues | **Français** (défaut) et **anglais** |
| Notifications | **SMS** pour les étapes clés + **courriels** |
| Allergènes et ingrédients | Affichés sur chaque produit |
| Produits saisonniers | Oui (Noël, Pâques, Saint-Valentin…), avec dates d'affichage |
| Variantes | Oui (taille ou nombre de parts, boîte de 6 ou 12, montant de carte-cadeau) |
| Personnalisation | Message personnalisé par article (ex. « Bonne fête Léa ») pour les produits qui l'autorisent |
| Fermeture des commandes | Interrupteur dans l'admin + message affiché sur le site |
| Admin | 2 personnes ; produits, commandes, fiche client complète, remboursements, fermeture, promos, statistiques |

---

## 6. Catalogue

### 6.1 Catégorie
`name {fr,en}`, `slug` (généré depuis le nom français), `description {fr,en}`, `sortOrder`, `active`.

### 6.2 Produit
| Champ | Détail |
|---|---|
| `name {fr,en}`, `slug`, `description {fr,en}` | |
| `category` | référence |
| `images[] { url, alt }` | URLs Cloudinary, 10 au maximum ; la première est l'image principale |
| `ingredients {fr,en}` | texte libre |
| `allergens[]` | liste fermée : `gluten, milk, eggs, peanuts, tree_nuts, soy, sesame, mustard, sulphites, fish, crustaceans` (les 11 allergènes prioritaires de Santé Canada), avec libellés et icônes FR/EN côté frontend |
| `variants[] { _id, label {fr,en}, price (cents), active }` | au moins une ; le frontend affiche « à partir de X $ » (`fromPrice`) |
| `isGiftCard` | produit carte-cadeau : la variante vaut le solde |
| `allowsMessage` | autorise un message personnalisé (200 caractères au maximum) |
| `taxable` | défaut `false` |
| `leadTimeHours` | défaut 48 |
| `seasonal { enabled, startDate, endDate }` | un produit saisonnier n'est visible et commandable qu'entre ces dates |
| `featured` | mis en avant sur l'accueil |
| `active`, `sortOrder` | |

### 6.3 Catalogue de démonstration (déjà dans `npm run seed`)
- **Gâteaux** : Fraisier (6, 10 ou 16 parts : 42, 65 ou 95 $), Gâteau au chocolat noir (6 ou 10 parts : 38 ou 59 $), Tarte au sucre (9 pouces : 24 $)
- **Viennoiseries** : Croissants au beurre (boîte de 6 ou 12 : 18 ou 33 $), Chocolatines (20 ou 37 $)
- **Macarons et mignardises** : Macarons assortis (12 ou 24 : 28 ou 52 $)
- **Temps des fêtes** : Bûche de Noël (saisonnière du 15 novembre au 24 décembre ; 48 ou 72 $)
- **Cartes-cadeaux** : 25, 50 ou 100 $
- Code promo **BIENVENUE10** (−10 %, minimum 30 $)

Aucune photo n'existe : le frontend doit afficher une **illustration de remplacement élégante** (voir la section 14) quand `images` est vide.

---

## 7. Commande — règles métier complètes

### 7.1 Parcours client
1. Ajout au panier depuis la fiche produit : variante, quantité (1 à 50), message personnalisé si autorisé.
2. Panier (stocké dans le navigateur : `localStorage`, clé `patisserie-cart`) : modification des quantités et suppression d'articles. Le panier se revalide via `POST /api/cart/quote` à chaque changement.
3. Page Paiement :
   - Mode de réception : **Livraison** (adresse : rue, app., ville, code postal) ou **Cueillette** (adresse communiquée après la commande). Si le panier ne contient que des cartes-cadeaux, cette étape est masquée (`fulfillment.type = 'none'`).
   - Coordonnées : nom, courriel, téléphone (obligatoires). Préremplies si le client est connecté.
   - Notes pour la pâtissière (facultatif, 1 000 caractères au maximum).
   - Code promo et carte-cadeau (champs repliables, appliqués via `quote`).
   - Récapitulatif des montants (sous-total, remise, livraison, TPS, TVQ, carte-cadeau, **à payer**).
   - Mode de paiement : **Carte (Stripe)** ou **Virement Interac**.
   - Case obligatoire : « J'accepte les conditions de vente » (avec lien).
   - Message clair : **« Votre carte sera autorisée mais débitée seulement quand nous confirmerons votre commande avec vous. »**
4. Page Confirmation et suivi (`/commande/:numero?t=jeton`).

### 7.2 Règles (déjà implémentées côté serveur)
- Les commandes fermées (`ordersOpen = false`) sont refusées (`orders_closed`) ; le frontend affiche `closedMessage` dans une bannière et désactive le bouton Commander.
- Produit indisponible ou variante inactive : erreur. Le frontend retire l'article et prévient le client.
- Livraison hors zone : `delivery_zone`. Minimum non atteint : `below_minimum` (afficher le montant manquant).
- Code postal normalisé au format `A1A 1A1`.
- Les remises ne s'appliquent pas aux cartes-cadeaux, et on ne paie pas une carte-cadeau avec une autre carte-cadeau.
- La carte-cadeau ne laisse jamais un reste de 1 à 49 cents (minimum Stripe de 0,50 $).
- Numéro de commande : `P-AAAA-0001` (séquence annuelle).
- Un **jeton de suivi** secret est remis à la commande ; il donne accès au suivi sans compte.

### 7.3 Codes d'erreur à traduire dans le frontend
`orders_closed, product_unavailable, variant_unavailable, fulfillment_required, pickup_disabled, delivery_disabled, address_required, delivery_zone, below_minimum, promo_invalid, promo_inactive, promo_not_started, promo_expired, promo_exhausted, promo_min_subtotal, giftcard_invalid, giftcard_changed, payment_method_disabled, cannot_cancel, validation_error, too_many_requests, email_taken, unauthorized`

### 7.4 Statuts de commande
```
pending_payment → received → confirmed → in_preparation → ready → completed
        │             │           │              │           │
        └──────── cancelled ◄─────┴──────────────┴───────────┘
```
| Statut | Libellé FR | Libellé EN | Signification |
|---|---|---|---|
| `pending_payment` | Paiement en cours | Awaiting payment | Formulaire Stripe pas encore validé (masqué dans l'admin par défaut ; annulé automatiquement après 60 min) |
| `received` | Reçue | Received | Carte pré-autorisée ou Interac en attente. **À traiter : appeler le client.** |
| `confirmed` | Confirmée | Confirmed | Date convenue, carte débitée |
| `in_preparation` | En préparation | Being prepared | |
| `ready` | Prête | Ready | SMS au client |
| `completed` | Terminée | Completed | Livrée ou récupérée |
| `cancelled` | Annulée | Cancelled | |

### 7.5 Statuts de paiement
`pending` (en attente), `authorized` (pré-autorisée, non débitée), `awaiting_transfer` (virement Interac attendu), `paid` (payée), `partially_refunded` (remboursée en partie), `refunded` (remboursée), `voided` (autorisation libérée, aucun débit), `failed` (échec).

---

## 8. Paiement

### 8.1 Stripe — pré-autorisation (décision validée)
Puisque la date est convenue **après** la commande :
1. `POST /api/orders` crée un PaymentIntent en **`capture_method: 'manual'`** et renvoie `clientSecret`.
2. Le frontend monte **Stripe Payment Element** (`@stripe/react-stripe-js`) avec ce `clientSecret`, puis appelle `stripe.confirmPayment({ redirect: 'if_required', return_url: <page de suivi> })`.
3. Stripe appelle le **webhook** (`payment_intent.amount_capturable_updated`) → la commande passe à `received` et les notifications partent.
4. La pâtissière appelle le client, convient de la date, puis clique **Confirmer** dans l'admin → **capture** (débit).
5. Annulation avant confirmation → **annulation du PaymentIntent** : fonds libérés, **aucun frais**.
6. ⚠️ Une pré-autorisation **expire après 7 jours**. L'admin affiche une alerte dès 5 jours (`authorizationExpiringSoon`). Si elle expire, l'admin doit annuler la commande ou demander un nouveau paiement (hors périmètre v1 : annuler et demander au client de repasser commande).
7. Après la redirection Stripe, la page de suivi **interroge l'API** (polling toutes les 2 s pendant 20 s au maximum) jusqu'à ce que le statut quitte `pending_payment`.

Clé publique : variable `VITE_STRIPE_PUBLISHABLE_KEY` côté frontend.

### 8.2 Virement Interac (décision validée : proposé dans l'application)
- Le virement Interac (Interac e-Transfer) est un virement bancaire canadien envoyé par courriel ou téléphone, instantané et presque gratuit. Il évite les frais Stripe (~3 %), mais **n'est pas automatisé**.
- Après la commande, la page de confirmation affiche : le montant, l'adresse Interac de la boutique (`settings.interacEmail`), le **numéro de commande à indiquer dans le message**, et une consigne (« si une question de sécurité est demandée… » ; recommander le dépôt automatique).
- La commande est `received` avec le paiement `awaiting_transfer`. L'admin clique **« Virement reçu »** → `paid`.
- Les remboursements Interac se font **manuellement** par la cliente ; l'admin note le remboursement dans les notes internes.

### 8.3 Carte-cadeau comme moyen de paiement
Utilisable seule ou combinée à Stripe ou Interac. Le solde est **réservé** à la commande et **rendu** en cas d'annulation.

---

## 9. Frontend public (À CONSTRUIRE)

### 9.1 Technique
- React 18+, Vite, **React Router**, **TanStack Query** pour les appels API, `fetch` avec `credentials: 'include'`.
- i18n : **react-i18next**, fichiers `fr.json` et `en.json`. Langue par défaut `fr`, choix mémorisé (`localStorage`), bouton FR | EN dans l'en-tête. Mêmes URL pour les deux langues. `<html lang>` mis à jour. La langue courante est envoyée comme `locale` dans la commande.
- Contenus bilingues de l'API : afficher `champ[lang] || champ.fr`.
- Variables : `VITE_API_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`. En développement, proxy Vite `/api` vers `http://localhost:4000`.
- Accessibilité **WCAG 2.1 AA** : contrastes, focus visible, labels, navigation au clavier, `alt` sur les images.
- Responsive, **mobile d'abord** (la majorité des clients commanderont depuis leur téléphone).
- SEO de base : titres et descriptions par page, Open Graph, `sitemap.xml`, `robots.txt`, données structurées `Bakery` / `Product`.
- Performance : images Cloudinary transformées (`f_auto,q_auto,w_…`), chargement différé.

### 9.2 Pages et routes
| Route | Page | Contenu |
|---|---|---|
| `/` | Accueil | Présentation, produits vedettes (`featured=true`), produits saisonniers en cours, fonctionnement en 3 étapes (Commandez → Nous vous appelons → Livraison ou cueillette), zone de livraison, bannière si commandes fermées |
| `/boutique` | Catalogue | Filtres par catégorie (onglets ou puces), grille de produits (image, nom, « à partir de », pictos allergènes) |
| `/boutique/:categorie` | Catalogue filtré | |
| `/produit/:slug` | Fiche produit | Galerie, description, sélecteur de variante, prix, quantité, message personnalisé (si autorisé, avec compteur de caractères), délai indicatif, **ingrédients**, **allergènes**, bouton Ajouter au panier |
| `/cartes-cadeaux` | Cartes-cadeaux | Achat (montants) + vérification du solde (`POST /api/giftcards/check`) |
| `/panier` | Panier | Lignes, quantités, sous-total, progression vers le minimum (« Plus que 12 $ pour atteindre le minimum »), bouton Commander |
| `/paiement` | Paiement | Voir 7.1 |
| `/commande/:numero` | Confirmation et suivi | Utilise `?t=jeton` ou la session. Frise des statuts, date convenue si connue, récapitulatif, instructions Interac si nécessaire, bouton **Annuler ma commande** si `canCancel` (avec confirmation et motif facultatif). **Ce chemin est utilisé dans les courriels envoyés par l'API : ne pas le changer.** |
| `/compte/connexion`, `/compte/inscription` | Authentification | |
| `/compte` | Mon compte | Profil, adresse par défaut, langue, changement de mot de passe, historique des commandes |
| `/a-propos` | À propos | Texte fictif sur la pâtissière (à remplacer) |
| `/faq` | FAQ | Délais, zone de livraison, paiement et pré-autorisation, Interac, annulation, allergènes, conservation |
| `/contact` | Contact | Courriel et téléphone de la boutique, liens Instagram et Facebook (placeholders) |
| `/conditions` | Conditions de vente | Voir la section 12 |
| `/confidentialite` | Politique de confidentialité | Voir la section 12 |
| `*` | 404 | |

Les URL restent en français, même en anglais.

### 9.3 Composants globaux
En-tête (logo, navigation, sélecteur de langue, compte, icône panier avec compteur), pied de page (coordonnées, liens légaux, réseaux, mention « Prix en dollars canadiens », numéro de permis MAPAQ si renseigné), bannière « commandes fermées », notifications (toasts), états de chargement (squelettes) et d'erreur.

### 9.4 Mode simulé
Si `GET /api/settings` renvoie `paymentsMode: 'mock'`, la réponse de `POST /api/orders` a `clientSecret: null` et la commande est déjà `received` : ne pas monter Stripe, aller directement à la page de suivi. Afficher un petit bandeau « Mode test : aucun paiement réel ».

---

## 10. Tableau de bord admin (À CONSTRUIRE)

Même application React, routes `/admin/*`, protégées (redirection vers `/admin/connexion` si `GET /api/auth/me` ne renvoie pas `role: 'admin'`). Interface **en français** uniquement. Pensée pour être utilisée **sur téléphone** autant que sur ordinateur.

| Route | Écran | Fonctionnalités |
|---|---|---|
| `/admin` | Accueil | Chiffres (commandes à confirmer, ventes 30 j, panier moyen), **liste des commandes « Reçues » à traiter**, alertes de pré-autorisation qui expire, virements Interac en attente, graphique des ventes par jour (`/stats`) |
| `/admin/commandes` | Liste | Filtres par statut (onglets : À traiter / En cours / Terminées / Annulées / Toutes), recherche (numéro, nom, courriel, téléphone), pagination. Colonnes : numéro, date, client, total, mode (livraison/cueillette), paiement, statut, date convenue. Badge d'alerte si la pré-autorisation expire bientôt. |
| `/admin/commandes/:id` | **Détail** (chemin utilisé dans les courriels admin : ne pas changer) | **Toutes les informations** : client (nom, courriel cliquable `mailto:`, téléphone cliquable `tel:` et `sms:`, compte lié ou invité), **autres commandes du client**, articles (variante, quantité, **message personnalisé** bien visible), adresse de livraison (lien Google Maps) ou cueillette, notes du client, montants détaillés, paiement (méthode, statut, dates, montant remboursé), historique des statuts (qui, quand, note), **notes internes** (ajout). Actions selon l'état : **Confirmer** (avec sélecteur de date et d'heure → `scheduledFor`), modifier la date, **En préparation**, **Prête**, **Terminée**, **Virement reçu**, **Rembourser** (montant partiel ou total), **Annuler** (motif obligatoire, case « rembourser »). Chaque action destructive demande une confirmation. Bouton **Imprimer** (fiche de préparation). |
| `/admin/produits` | Produits | Liste avec interrupteur actif/inactif rapide, recherche, filtre par catégorie |
| `/admin/produits/nouveau`, `/admin/produits/:id` | Formulaire | Tous les champs de 6.2 ; onglets FR/EN pour les textes ; éditeur de variantes (ajout, suppression, réordonnancement, prix saisi en dollars puis converti en cents) ; **upload d'images vers Cloudinary** (signature via `POST /api/admin/uploads/signature`, envoi direct du navigateur), réordonnancement et suppression ; allergènes en cases à cocher ; aperçu |
| `/admin/categories` | Catégories | CRUD, ordre (suppression refusée si la catégorie contient des produits) |
| `/admin/promotions` | Codes promo | CRUD, utilisations / maximum, dates, activation |
| `/admin/cartes-cadeaux` | Cartes-cadeaux | Liste, recherche par code, solde, commande d'origine ; émission manuelle ; désactivation et ajustement du solde |
| `/admin/reglages` | Réglages | **Ouvrir/fermer les commandes** (très visible) + message FR/EN ; minimum ; frais de livraison ; préfixes de codes postaux ; livraison et cueillette activables ; adresse de cueillette ; taxes (activation, taux, numéros TPS/TVQ) ; Stripe et Interac activables ; adresse Interac ; courriel et téléphone de notification |
| `/admin/equipe` | Administratrices | Liste, ajout (courriel, nom, mot de passe), retrait (pas soi-même) |
| `/admin/connexion` | Connexion | |

Création du **premier** compte admin : `npm run create-admin -- courriel "Nom" "motdepasse"` (10 caractères minimum).

---

## 11. Notifications (déjà implémentées)

Langue = celle choisie par le client lors de la commande. En l'absence de clés, elles sont journalisées dans la console.

| Événement | Client | Équipe |
|---|---|---|
| Commande reçue | **SMS** + courriel (récapitulatif, lien de suivi, instructions Interac si nécessaire) | SMS + courriel (lien vers `/admin/commandes/:id`) |
| Commande confirmée | **SMS** + courriel (avec date convenue) | — |
| Commande prête | **SMS** + courriel | — |
| Commande annulée | Courriel (précise « carte non débitée » ou le montant remboursé) | Courriel + SMS si annulée par le client |
| Carte-cadeau achetée (une fois payée) | Courriel avec le code | — |
| Paiement abandonné (60 min) | Rien | Rien |

Téléphones normalisés au format E.164 (`+1…`). Heure affichée dans le fuseau `America/Toronto` (même heure que Québec).

À prévoir (non fait) : gabarits de courriel plus soignés et à l'image de la marque une fois l'identité définie ; lien de désinscription non requis (messages transactionnels uniquement).

---

## 12. Pages légales (contenu à rédiger, en FR et EN)

**Conditions de vente**
- Produits faits sur commande ; délais indicatifs ; la date est convenue par téléphone ou courriel après la commande.
- Pré-autorisation de la carte, débitée à la confirmation ; autorisation valide 7 jours.
- **Annulation** : gratuite tant que la commande n'est pas confirmée (depuis le lien de suivi ou le compte). Après confirmation, il faut contacter la boutique ; remboursement à la discrétion de la boutique, les produits périssables faits sur mesure n'étant généralement pas remboursables une fois commencés.
- Livraison dans la ville de Québec seulement (codes postaux G1, G2, G3), frais de 10 $ ; cueillette gratuite.
- Minimum de commande de 30 $.
- Allergènes : les informations sont données de bonne foi ; contamination croisée possible.
- Cartes-cadeaux : valides 5 ans, non remboursables, non échangeables contre de l'argent.
- Prix en dollars canadiens ; taxes applicables le cas échéant.

**Politique de confidentialité (Loi 25)** : voir la section 3. Ajouter un bandeau discret uniquement si des cookies non essentiels sont ajoutés un jour (aucun pour l'instant : la session est un cookie essentiel).

Ajouter en commentaire dans le code source de ces pages (pas sur le site) : `Modèle à faire relire par un professionnel`.

---

## 13. Backend — état actuel (DÉJÀ CONSTRUIT)

### 13.1 Arborescence
```
patisserie/
├── PROJET.md                 ← ce document
├── SPEC.md                   ← spécification courte (antérieure, ce document la complète)
├── README.md                 ← démarrage, référence API, déploiement
├── render.yaml               ← Blueprint Render (API)
├── .gitignore
└── server/
    ├── package.json          (type: module ; scripts dev, start, seed, create-admin, test)
    ├── .env.example
    ├── vitest.config.js
    ├── src/
    │   ├── server.js         connexion MongoDB + écoute + nettoyage toutes les 15 min
    │   ├── app.js            Express : helmet, cors (credentials), webhook avant json(), routes, erreurs
    │   ├── config.js         variables d'environnement
    │   ├── seed.js           catalogue de démo
    │   ├── scripts/createAdmin.js
    │   ├── models/           Category, Product, Order, User, PromoCode, GiftCard, Settings, Counter, common
    │   ├── lib/              pricing (pur), payments (Stripe + simulé), messaging (Twilio/Resend), notifications, errors, rateLimit
    │   ├── services/orderService.js   toute la logique de commande
    │   ├── middleware/auth.js         JWT en cookie httpOnly « session », 30 jours
    │   └── routes/           catalog, orders, account, webhooks, admin/{index,orders,catalog,promotions,shop}
    ├── docs/                 TESTS-API.md + collection Postman (84 requêtes) pour tester l'API à la main
    └── tests/                pricing.test.js (13), api.test.js (28) — 41 tests au vert
```

### 13.2 Référence de l'API
Montants en cents. Erreurs au format `{ error: 'code', message, details? }` (`details` = liste de codes pour `order_invalid`, liste Zod pour `validation_error`).

**Public**
| Méthode | Route | Entrée → Sortie |
|---|---|---|
| GET | `/api/health` | `{ ok, db }` |
| GET | `/api/settings` | `{ ordersOpen, closedMessage, minimumOrder, deliveryFee, deliveryEnabled, pickupEnabled, deliveryPostalPrefixes, taxesEnabled, stripeEnabled, interacEnabled, interacEmail, pickupCity, permitNumber, publicEmail, publicPhone, instagramUrl, facebookUrl, paymentsMode }` (jamais `pickupAddress` ni les coordonnées de notification) |
| GET | `/api/categories` | catégories actives triées |
| GET | `/api/products?category=<slug>&featured=true&seasonal=true` | produits disponibles (+ `fromPrice`, catégorie peuplée, variantes actives seulement) |
| GET | `/api/products/:slug` | fiche produit |
| POST | `/api/cart/quote` | `{ locale, items:[{productId, variantId, quantity, message?}], fulfillment?:{type, address?}, promoCode?, giftCardCode? }` → `{ items, fulfillment, pricing:{subtotal, discount, deliveryFee, gst, qst, total, giftCardApplied, amountDue}, promoCode, giftCardCode, minimumOrder, maxLeadTimeHours, errors:[] }` |
| POST | `/api/orders` | même entrée + `customer:{name,email,phone}`, `customerNotes?`, `paymentMethod:'stripe'|'interac'` → `201 { order, trackingToken, clientSecret, paymentsMode }` |
| GET | `/api/orders/track/:number?t=<jeton>` | commande publique (+ `canCancel`) ; accès par jeton, compte propriétaire ou admin |
| POST | `/api/orders/track/:number/cancel` | `{ token, reason? }` |
| POST | `/api/giftcards/check` | `{ code }` → `{ valid, balance?, expiresAt? }` |
| POST | `/api/webhooks/stripe` | webhook Stripe (corps brut, signature vérifiée) |

**Compte** : `POST /api/auth/register {email,password(≥8),name,phone?,locale?}`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` (→ utilisateur ou `null`), `PATCH /api/account {name?,phone?,locale?,defaultAddress?}`, `POST /api/account/password {current,next}`, `GET /api/account/orders`.

**Admin** (`/api/admin`, rôle admin) :
`GET /orders?status=<statut|active>&payment=&search=&from=&to=&page=&limit=` → `{ total, page, pages, orders[] (+ itemCount, authorizationExpiringSoon) }` ·
`GET /orders/:id` → `{ order, customerHistory }` ·
`POST /orders/:id/confirm {scheduledFor?, note?}` · `POST /orders/:id/status {status: in_preparation|ready|completed, note?}` · `PATCH /orders/:id/schedule {scheduledFor}` · `POST /orders/:id/interac-received` · `POST /orders/:id/cancel {reason, refund=true}` · `POST /orders/:id/refund {amount?, note?}` · `POST /orders/:id/notes {text}` ·
`GET|POST /categories`, `PUT|DELETE /categories/:id` ·
`GET|POST /products`, `GET|PUT|DELETE /products/:id`, `PATCH /products/:id/active {active}` ·
`GET|POST /promos`, `PUT|DELETE /promos/:id` ·
`GET|POST /giftcards` (POST : `{amount, expiresAt?, recipientEmail?, note?}`), `PATCH /giftcards/:id` ·
`GET|PUT /settings` · `GET /stats?days=30` → `{ revenue, orders, averageOrder, awaitingConfirmation, topProducts[], byDay[] }` ·
`POST /uploads/signature` → `{ cloudName, apiKey, timestamp, folder, signature, uploadUrl }` ·
`GET|POST /users`, `DELETE /users/:id`.

### 13.3 Décisions techniques et de sécurité déjà prises
- Helmet ; CORS limité à `CLIENT_ORIGIN` avec `credentials` ; `trust proxy` (Render).
- Limitation de débit : authentification (20 / 15 min), commandes (20 / 15 min), vérification de carte-cadeau (30 / 15 min) ; désactivée en test.
- Validation Zod sur toutes les entrées ; mots de passe bcrypt (12 tours).
- Session : JWT dans un cookie `httpOnly`, `secure` en production, `SameSite` configurable (`lax` si même domaine, `none` sinon).
- **Les commandes invité ne sont PAS rattachées automatiquement** à un compte créé plus tard avec le même courriel (sans vérification du courriel, ce serait une fuite de données). Amélioration possible : vérification du courriel, puis rattachement.
- Réservations atomiques du solde de carte-cadeau et des utilisations de code promo, avec retour arrière en cas d'échec.
- Les commandes gardent une **copie** du nom, de la variante et du prix : modifier ou supprimer un produit ne casse pas l'historique.
- Idempotence : clé `order-<id>` lors de la création du PaymentIntent ; `markAuthorized` et `issueGiftCards` sont idempotents.
- Statistiques calculées en JavaScript (volumes faibles, compatibilité maximale).
- Tests : `mongodb-memory-server` par défaut, ou `MONGODB_TEST_URI`.
- **Accès admin** : le rôle est relu en base à chaque requête `/api/admin/*` (et non dans le jeton) : une administratrice retirée perd l'accès immédiatement. On ne peut pas promouvoir un compte client existant (son mot de passe serait écrasé) : `409 email_taken`.
- **Liens de suivi** : tous les courriels au client contiennent le jeton de suivi (le jeton est relu en base), y compris après un paiement Stripe réel (webhook). Comparaison du jeton en temps constant.
- **Cartes-cadeaux et annulation** : si une commande est annulée **avec remboursement** (ou remboursée en totalité), les cartes-cadeaux qu'elle a achetées sont désactivées (note dans l'historique si l'une a déjà servi) et le solde de la carte utilisée pour payer est recrédité. Annulation **sans** remboursement : rien n'est rendu, les cartes achetées restent valides.
- **Erreurs Stripe** (capture après expiration de la pré-autorisation, etc.) : renvoyées en `400 capture_failed` / `refund_failed` / `void_failed` avec le message de Stripe, au lieu d'une erreur 500.
- **Statistiques** : ventes nettes des remboursements.
- Un produit sans aucune variante active n'est pas affiché (ni en liste, ni en fiche).
- En mode simulé, les courriels affichés dans la console incluent leurs liens (suivi, admin) pour pouvoir tester le parcours.

### 13.4 Améliorations backend à faire pendant la construction du frontend
- ✅ `GET /api/settings` expose aussi : `pickupCity` (la ville seulement : l'adresse précise de cueillette reste privée, car c'est un domicile, et n'est envoyée qu'avec la confirmation), `interacEmail` (vide si Interac est désactivé), `permitNumber`, `publicEmail`, `publicPhone`, `instagramUrl`, `facebookUrl` (ajoutés au modèle Settings et à `PUT /api/admin/settings`).
- ✅ Adresse de cueillette dans le courriel de **confirmation** quand `fulfillment.type = 'pickup'` (sinon : « Nous vous communiquerons l'adresse… »).
- ⏳ Mot de passe oublié (lien par courriel, jeton à usage unique de 1 h) : **à l'étape 5** (comptes clients).
- ⏳ `sitemap.xml` : généré au build du frontend, **à l'étape 7** (SEO).
- ⏳ Courriels à l'image de la marque (police, couleurs, détail des taxes et numéros TPS/TVQ) : **à l'étape 6**.

---

## 14. Identité visuelle — DÉFINIE (voir STYLE.md)

La charte complète est dans **STYLE.md**, qui fait foi pour tout ce qui touche au visuel. Mise en œuvre (étape 2) :
- **Jetons CSS** : `client/src/styles/tokens.css` (seul endroit où les couleurs sont écrites) ; styles de base dans `client/src/styles/base.css`.
- **Logo** : cerise minimaliste + « Pâtisserie » en DM Sans 500 vectorisée. Fichiers dans `brand/` (`logo.svg`, `logo-white.svg`, `logo-mark.svg`, `favicon.svg`, `planche-logo.png`), copies utilisées par l'application dans `client/src/assets/brand/`.
- **Icônes et partage** : `client/public/` (`favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-image.png`, `manifest.webmanifest`).
- **Tout est régénéré** par `cd client && npm run marque` à partir du nom défini dans `client/src/config/brand.js` (à relancer si le nom change).
- **Illustrations de remplacement** : composants SVG dans `client/src/assets/illustrations/` (gâteau, croissant, macarons, bûche, carte-cadeau, cerise par défaut, accueil 16:9, assiette vide). `illustrationPour({ slugCategorie, estCarteCadeau })` choisit l'illustration d'un produit sans photo.

---

## 15. Variables d'environnement

**server/.env** (voir `.env.example`) : `NODE_ENV, PORT, MONGODB_URI, CLIENT_ORIGIN, PUBLIC_SITE_URL, JWT_SECRET, COOKIE_SAMESITE, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, RESEND_API_KEY, EMAIL_FROM, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET`

**client/.env** : `VITE_API_URL` (vide en développement grâce au proxy), `VITE_STRIPE_PUBLISHABLE_KEY`

---

## 16. Déploiement

1. Dépôt GitHub `hamid78631/patisserie` (privé recommandé).
2. **MongoDB Atlas** : cluster M0, utilisateur dédié, Network Access `0.0.0.0/0` (Render n'a pas d'IP fixe), récupérer l'URI.
3. **Render** :
   - Blueprint `render.yaml` : API en Web Service **Starter** (`rootDir: server`, health check `/api/health`).
   - Ajouter au Blueprint le **Static Site** du frontend : `rootDir: client`, build `npm ci && npm run build`, dossier `dist`, **règle de réécriture `/* → /index.html`** (routes React).
4. **Domaine .ca** : `www.` → site statique, `api.` → API ; `COOKIE_SAMESITE=lax` ; `CLIENT_ORIGIN=https://www.<domaine>.ca` ; `PUBLIC_SITE_URL=https://www.<domaine>.ca`.
5. **Stripe** : compte au nom de l'entreprise de la cliente (compte bancaire canadien requis) ; commencer en mode test ; webhook `https://api.<domaine>.ca/api/webhooks/stripe` avec les événements `payment_intent.amount_capturable_updated`, `payment_intent.payment_failed`, `payment_intent.canceled` ; activer Apple Pay (vérification du domaine).
6. **Twilio** : numéro canadien (indicatif 418 ou 581 idéalement) ; **Resend** : vérifier le domaine (SPF, DKIM).
7. `npm run create-admin` pour les 2 administratrices ; vider le catalogue de démo ou le modifier.
8. Laisser les commandes **fermées** jusqu'à l'obtention du permis MAPAQ.

Coûts mensuels estimés : Render ~7 $ US, Twilio quelques $, le reste gratuit ; domaine ~15 $/an ; Stripe ~2,9 % + 0,30 $ par transaction.

---

## 17. Étapes de construction

| # | Étape | État |
|---|---|---|
| 1 | API Express : modèles, catalogue, commandes, Stripe, Interac, promos, cartes-cadeaux, admin, tests | ✅ Fait |
| 2 | Identité visuelle : tokens CSS, logo SVG, illustrations de remplacement | ✅ Fait |
| 3 | Frontend public : structure, i18n, catalogue, fiche produit, panier | À faire |
| 4 | Paiement : checkout, Stripe Payment Element, Interac, confirmation et suivi, annulation | À faire |
| 5 | Comptes clients | À faire |
| 6 | Tableau de bord admin (section 10) + améliorations backend (13.4) | À faire |
| 7 | Pages légales, FAQ, SEO, accessibilité | À faire |
| 8 | Tests frontend (Vitest + Testing Library pour le panier et le checkout ; un test de bout en bout Playwright du parcours complet en mode simulé) | À faire |
| 9 | Déploiement (section 16) | À faire |

**Critère de fin de chaque étape** : fonctionne en local en mode simulé, sans erreur console, responsive, textes FR et EN présents, tests au vert.

---

## 18. Hors périmètre v1 (idées pour plus tard)

Choix d'une date par le client dans un calendrier avec capacité maximale par jour · avis clients · newsletter · programme de fidélité · devis pour gâteaux sur mesure avec photo · SMS bidirectionnels · export comptable CSV · nouvelle demande de paiement quand une pré-autorisation expire · vérification du courriel · analytics avec consentement.

---

## 19. Questions ouvertes

**Style** : réglé par STYLE.md.

**Décisions prises pendant la construction** (modifiables) :
- *Étape 2 — logo* : le dossier `brand/` annoncé par STYLE.md n'existait pas dans le dépôt ; avec l'accord de Hamid, le logo a été créé d'après STYLE.md §4 et est généré par `client/scripts/generer-marque.mjs` (texte vectorisé depuis DM Sans 500, aucune police requise).
- *Étape 2 — jetons* : trois jetons ajoutés à ceux de STYLE.md §12, sans nouvelle couleur : `--color-overlay` (voile des modales, valeur de STYLE.md §7.9), `--container-text` (680 px) et `--gutter` (marges latérales 16 / 24 / 32 px de STYLE.md §6).
- *Étape 2 — illustrations* : l'illustration d'un produit sans photo est choisie d'après des mots-clés du slug de sa catégorie (`gateau`, `viennoiserie`, `macaron`, `fete`/`noel`, `cadeau`…), pour résister aux renommages ; catégorie inconnue → la cerise de la marque.
- *Étape 2 — police* (validé par Hamid) : DM Sans est **hébergée avec le site** (`@fontsource/dm-sans`, graisses 400, 500 et 600) au lieu du lien Google Fonts de STYLE.md §3 : aucune adresse IP de visiteur transmise à Google (Loi 25), aucun appel externe. Rendu identique.
- *Étape 2 — page `/charte`* : page de contrôle de la charte (outil de développement), à retirer ou réserver au développement à l'étape 3.

- *Audit du backend (avant l'étape 3)* : 3 bugs corrigés (lien de suivi sans jeton dans les courriels, carte-cadeau encore valide après annulation remboursée, administratrice retirée gardant l'accès), plus erreurs Stripe lisibles, statistiques nettes des remboursements, carte-cadeau de paiement non recréditée lors d'une annulation sans remboursement, promotion d'un compte client refusée. Voir 13.3.

**À trancher avec Hamid** :
- *Carte-cadeau achetée par carte bancaire* : comme tout paiement Stripe, elle n'est débitée et envoyée qu'à la **confirmation par l'admin** (comportement conservé par défaut). Alternative : débit immédiat et envoi automatique quand le panier ne contient que des cartes-cadeaux.
- *Recherche de l'en-tête* (STYLE.md §7.1) : l'API n'a pas de paramètre de recherche ; proposition : filtrer côté navigateur (catalogue petit).
- *Photo de profil du client* (STYLE.md §7.1) : le modèle User n'a pas de champ photo ; proposition : initiales seulement en v1.
- *Section « Conservation » de la fiche produit* (STYLE.md §9) : aucun champ dans le modèle Product ; proposition : ajouter `storage {fr,en}` ou un texte générique.

**À confirmer avec la cliente plus tard (valeurs par défaut en place, modifiables dans l'admin)** :
- Vrais produits, prix, variantes et délais.
- Montant minimum (30 $) et frais de livraison (10 $) ; zone exacte de livraison.
- Adresse de cueillette, adresse Interac, courriel et téléphone de notification.
- Statut fiscal (petit fournisseur ou non) et taxabilité de chaque produit.
- Obtention du permis MAPAQ et numéro à afficher.
- Nom définitif de la marque et nom de domaine.
- Politique d'annulation après confirmation.
