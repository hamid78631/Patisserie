# STYLE — Identité visuelle et interface « Pâtisserie »

> Ce document complète **PROJET.md** : il décrit comment le site doit **paraître** et **se comporter**.
> Pour tout ce qui touche au style, **ce document fait foi**.
> Les fichiers du logo se trouvent dans `brand/`.
>
> **Refonte en cours (septembre 2026)** : à la demande de Hamid, le style est désormais **calqué sur le projet PawCare** (github.com/hamid78631/pawcare) : police **Nunito** (700–800 pour les titres), boutons et étiquettes en **pilules**, **dégradés**, **ombres**, cercles décoratifs, verre dépoli. La **palette reste celle de la pâtisserie** : le vert de PawCare devient **bordeaux**, l'orange des boutons devient **rouge vif**, le fond vert pâle devient **rose très pâle**. Les interdits de la section 13 sur les dégradés, les ombres et la police ne s'appliquent plus. La refonte se fait composant par composant ; les jetons à jour sont dans `client/src/styles/tokens.css`, qui fait foi.


---

## 1. Direction générale

| Principe | Ce que ça veut dire concrètement |
|---|---|
| **Chic et épuré** | Beaucoup de blanc, peu d'éléments par écran, alignements nets. Chaque élément doit avoir une raison d'être. |
| **Moderne et agréable** | Coins arrondis doux, ombres très légères, transitions discrètes, typographie aérée. |
| **Rien de superflu** | Pas de dégradé, pas de néon, pas d'ombre portée lourde, pas d'animation gratuite, pas de texture ni de motif de fond. Couleurs toujours **pleines**. |
| **Mobile d'abord** | Conçu pour un téléphone, puis élargi pour l'ordinateur. |
| **Vouvoiement** | Partout : site, courriels, SMS, admin. |

Ambiance recherchée : une pâtisserie fine, sobre et lumineuse, où le rouge fait office de signature (un peu comme une cerise sur un gâteau blanc).

---

## 2. Couleurs

La palette repose sur **trois couleurs de la même famille** sur la roue chromatique (rouge vif, rouge foncé et une teinte claire du même rouge) et sur le **blanc**.

> **Note pour Hamid** : tu ne te souvenais plus de la 3e couleur. J'ai choisi un **rose poudré**, qui est le rouge très éclairci : il reste dans la même famille, donne de la douceur et sert de fond aux sections et aux illustrations. Si elle préfère autre chose (un beige crème, par exemple), il suffit de changer la variable `--color-blush`.

### 2.1 Palette

| Nom | Variable CSS | Hex | Rôle |
|---|---|---|---|
| **Rouge vif** | `--color-red` | `#C8102E` | Couleur d'action : boutons principaux, liens actifs, pastille du panier, prix mis en avant, logo |
| **Bordeaux** (rouge foncé) | `--color-wine` | `#6B0F1A` | Titres, logo (texte), survol des boutons rouges, pied de page |
| **Rose poudré** | `--color-blush` | `#F7E4E2` | Fonds de section, fonds des cartes produit sans photo, illustrations, badges doux |
| **Blanc** | `--color-white` | `#FFFFFF` | Fond principal du site |
| **Encre** | `--color-ink` | `#2A1215` | Texte courant (un quasi-noir teinté de rouge, plus doux qu'un noir pur) |
| **Encre douce** | `--color-ink-muted` | `#6E5A5C` | Texte secondaire, légendes, placeholders |
| **Filet** | `--color-line` | `#EEDFDD` | Bordures, séparateurs |
| **Fond doux** | `--color-surface` | `#FDF7F6` | Fond des champs de formulaire, zones secondaires |

Survols et états pressés : `--color-red-hover: #A80D26`, `--color-wine-hover: #520B14`.

### 2.2 Couleurs fonctionnelles (usage restreint)
Réservées aux **messages** et aux **statuts de l'admin**, toujours accompagnées d'une icône et d'un texte (jamais la couleur seule) :
- Succès `#2E6B4F` (fond `#E8F2EC`)
- Avertissement `#8A5A00` (fond `#FBF1DE`)
- Erreur : le rouge vif de la marque, `#C8102E` (fond `#F7E4E2`)

### 2.3 Contrastes vérifiés (WCAG 2.1 AA)
| Combinaison | Ratio | Verdict |
|---|---|---|
| Blanc sur rouge vif | 5,9 : 1 | ✅ texte normal |
| Blanc sur bordeaux | 12,3 : 1 | ✅ |
| Encre sur blanc | 17,6 : 1 | ✅ |
| Encre douce sur blanc | 6,4 : 1 | ✅ |
| Rouge vif sur rose poudré | 4,8 : 1 | ✅ texte normal |
| Bordeaux sur rose poudré | 10,0 : 1 | ✅ |

**Règle** : ne jamais mettre de texte rouge vif en dessous de 14 px sur un fond autre que blanc ou rose poudré.

### 2.4 Répartition
Environ **80 % de blanc**, 10 % de rose poudré, 10 % de rouge et de bordeaux. Le rouge vif est **rare** : un seul bouton rouge principal par écran, de préférence.

---

## 3. Typographie

Une seule famille, simple, douce et très lisible : **DM Sans** (Google Fonts, gratuite, avec les accents français). Pas de police à empattements, pas de Playfair.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">
```

> **Décision (étape 2)** : la police est **hébergée avec le site** (paquet `@fontsource/dm-sans`, importé dans `client/src/main.jsx`) plutôt que chargée depuis Google Fonts avec le lien ci-dessus, pour ne transmettre aucune donnée de visiteur à Google (Loi 25). Voir PROJET.md §19.

Graisses : **400** (texte), **500** (titres, boutons, logo), **600** (rare : prix, chiffres clés). Jamais de gras 700 ou plus.

| Style | Taille mobile → ordinateur | Graisse | Interligne | Usage |
|---|---|---|---|---|
| Display | 36 → 56 px | 500 | 1,1 | Titre principal de l'accueil |
| H1 | 28 → 40 px | 500 | 1,15 | Titre de page |
| H2 | 22 → 28 px | 500 | 1,25 | Sections |
| H3 | 18 → 20 px | 500 | 1,3 | Cartes, sous-sections |
| Texte | 16 px | 400 | 1,6 | Paragraphes (jamais moins de 16 px sur mobile) |
| Petit | 14 px | 400 | 1,5 | Légendes, aide des champs |
| Sur-titre | 12 px, MAJUSCULES, espacement 0,08 em | 500 | 1,4 | Étiquettes (« NOUVEAUTÉ », catégorie) |

Utiliser `clamp()` pour les tailles fluides. Titres en **bordeaux**, texte en **encre**. Espacement des lettres des titres : `-0.01em`. Chiffres des prix : `font-variant-numeric: tabular-nums`.

---

## 4. Logo

Créé pour le projet : **une cerise minimaliste** (fruit rouge vif, tige et feuille bordeaux, petit reflet blanc) suivie du mot **« Pâtisserie »** en DM Sans 500, bordeaux. La cerise fait le lien avec le rouge de la palette et évoque la « cerise sur le gâteau ».

| Fichier (`brand/`) | Usage |
|---|---|
| `logo.svg` | Logo principal (fond blanc ou rose poudré) |
| `logo-white.svg` | Version blanche sur fond rouge ou bordeaux |
| `logo-mark.svg` | Cerise seule : en-tête mobile, avatar par défaut, filigrane |
| `favicon.svg` | Favicon et icône d'application (cerise sur carré rose poudré aux coins arrondis) |
| `planche-logo.png` | Planche de présentation (pour la cliente) |

Le texte du logo est **vectorisé** (aucune police requise).

Règles :
- Hauteur minimale : 28 px (logo complet) et 20 px (cerise seule).
- Marge libre autour du logo : au moins la largeur de la cerise.
- Ne pas déformer, ne pas changer les couleurs, ne pas ajouter d'ombre ni de contour.
- Le nom est provisoire : si le nom change, régénérer le logo en gardant la cerise.

À produire ensuite dans `client/public/` : `favicon.svg`, `apple-touch-icon.png` (180 px), `icon-192.png`, `icon-512.png`, `og-image.png` (1200 × 630 : logo centré sur fond rose poudré).

---

## 5. Icônes

- Bibliothèque : **Lucide** (`lucide-react`), au trait, sobre, cohérente.
- Trait **1,5 px**, taille **20 px** (24 px dans l'en-tête et la barre du bas sur mobile).
- Couleur : `currentColor` (encre par défaut, rouge vif si l'élément est actif).
- Aucune icône pleine, colorée ou en dégradé ; pas d'émojis dans l'interface.
- Icônes à utiliser :

| Fonction | Icône Lucide |
|---|---|
| Recherche | `Search` |
| Compte | `User` (ou l'avatar, voir 7.1) |
| Panier | `ShoppingBag` |
| Menu | `Menu` / `X` |
| Livraison | `Truck` |
| Cueillette | `Store` |
| Paiement | `CreditCard` |
| Interac | `Landmark` |
| Carte-cadeau | `Gift` |
| Téléphone / courriel | `Phone` / `Mail` |
| Date convenue | `CalendarCheck` |
| Délai | `Clock` |
| Allergènes | `Info` + libellé texte |
| Succès / alerte | `CheckCircle2` / `AlertTriangle` |
| Quantité | `Minus` / `Plus` |
| Supprimer | `Trash2` |
| Langue | pas d'icône : texte « FR · EN » |

**Allergènes** : pas de pictogrammes fantaisie. On affiche des **puces texte** (`Gluten`, `Lait`, `Œufs`…) sur fond rose poudré, précédées d'une petite icône `Info`.

---

## 6. Formes, espacements, ombres, mouvement

| Élément | Valeur |
|---|---|
| Rayon des coins | `--radius-sm: 8px` (champs, puces), `--radius-md: 14px` (cartes, boutons), `--radius-lg: 24px` (grandes sections, images), `--radius-full: 999px` (avatar, pastilles, barre de recherche) |
| Espacements | échelle de 4 px : 4, 8, 12, 16, 24, 32, 48, 64, 96 |
| Largeur du contenu | 1200 px au maximum ; texte long 680 px au maximum |
| Marges latérales | 16 px (mobile), 24 px (tablette), 32 px (ordinateur) |
| Ombre | une seule : `--shadow: 0 1px 2px rgba(42,18,21,.06), 0 4px 16px rgba(42,18,21,.06)`, uniquement pour les cartes au survol, les menus déroulants, le tiroir du panier et les fenêtres modales |
| Bordures | 1 px `--color-line` |
| Transitions | 150 à 200 ms, `ease-out`, sur la couleur, l'opacité et `transform: translateY(-2px)` au survol des cartes. Rien d'autre. |
| Mouvement réduit | respecter `prefers-reduced-motion` (supprimer les transitions) |
| Focus | contour **2 px rouge vif**, décalé de 2 px (`outline-offset: 2px`), visible au clavier (`:focus-visible`) |

Pas de mode sombre en v1.

---

## 7. Composants

### 7.1 En-tête (demandé explicitement)

**Ordinateur (≥ 1024 px)**, hauteur 72 px, fond blanc, filet en bas, **collant** en haut au défilement :
```
[Logo]   Boutique  Cartes-cadeaux  À propos  FAQ      [🔍 Rechercher un produit…    ]   FR·EN   (avatar)   🛍 2
```
- **Barre de recherche** centrée, forme pilule (`--radius-full`), fond `--color-surface`, icône `Search` à gauche, largeur 360 à 420 px. La saisie propose des **suggestions** (produits : petite vignette, nom, prix « à partir de ») dans un menu déroulant ; `Entrée` ouvre `/boutique?q=…`.
- **Icône compte** :
  - visiteur : icône `User` au trait, qui mène à `/compte/connexion` ;
  - connecté : **avatar rond de 32 px** avec la **photo du client** s'il en a téléversé une, sinon un cercle rose poudré avec ses **initiales** en bordeaux. Au clic, menu : « Mon compte », « Mes commandes », « Déconnexion » (+ « Tableau de bord » pour les admins).
- **Panier** : icône `ShoppingBag` avec une pastille rouge vif portant le nombre d'articles ; au clic, ouvre le **tiroir panier** (panneau latéral droit) plutôt que de changer de page.
- Sélecteur de langue : texte « FR · EN », la langue active en bordeaux 500.

**Mobile (< 768 px)**, hauteur 56 px :
```
[☰]        [cerise + Pâtisserie]        [🔍] [🛍 2]
```
- `☰` ouvre un menu plein écran (liens, langue, compte).
- `🔍` fait glisser une barre de recherche plein écran avec suggestions.
- L'avatar et le compte sont dans le menu et dans la **barre de navigation du bas**.

**Barre de navigation du bas (mobile uniquement)**, fixe, 64 px, fond blanc, filet en haut, 4 entrées icône + libellé de 12 px : **Accueil · Boutique · Panier · Compte** (l'onglet actif en rouge vif). Elle respecte la zone sûre de l'iPhone (`env(safe-area-inset-bottom)`).

### 7.2 Boutons
| Variante | Style |
|---|---|
| Principal | fond rouge vif, texte blanc 500, hauteur 48 px, `--radius-md`, survol `--color-red-hover` |
| Secondaire | fond blanc, bordure 1 px bordeaux, texte bordeaux ; survol fond rose poudré |
| Discret | texte bordeaux souligné au survol, sans fond |
| Icône | 40 × 40 px, rond, survol fond `--color-surface` |
| Désactivé | opacité 0,4, curseur interdit |
| Chargement | petit cercle tournant à la place du texte, largeur conservée |

Sur mobile, les boutons d'action principaux (Ajouter au panier, Commander, Payer) prennent **toute la largeur** et sont **collés en bas de l'écran** sur la fiche produit et au paiement. Toutes les cibles tactiles font au moins **44 × 44 px**.

### 7.3 Champs de formulaire
Hauteur 48 px, fond `--color-surface`, bordure `--color-line`, `--radius-sm`, libellé **au-dessus** (14 px, 500), aide en dessous (14 px, encre douce). Focus : bordure bordeaux + contour de focus. Erreur : bordure rouge vif + message sous le champ avec l'icône `AlertTriangle`. Utiliser les bons types (`email`, `tel`, `autocomplete`) pour le mobile.

### 7.4 Carte produit
```
┌───────────────────────┐
│  [image 4:5 arrondie]  │  ← photo, ou illustration sur fond rose poudré
│  SUR-TITRE CATÉGORIE   │
│  Nom du produit        │  ← H3 bordeaux
│  À partir de 42,00 $   │  ← encre, 600
└───────────────────────┘
```
Pas de bordure, pas d'ombre au repos ; au survol, léger soulèvement et ombre. Badge éventuel en haut à gauche de l'image (« Saisonnier », « Coup de cœur ») : pilule blanche, texte bordeaux 12 px. Grille : 2 colonnes (mobile), 3 (tablette), 4 (ordinateur), espacement 16 à 24 px.

### 7.5 Sélecteur de variantes
Des **pastilles** (et non une liste déroulante) : bordure `--color-line`, sélectionnée = bordure et texte bordeaux sur fond rose poudré. Le prix se met à jour à côté.

### 7.6 Tiroir panier et récapitulatif
Panneau de 420 px à droite (plein écran sur mobile). Lignes : vignette de 64 px, nom, variante, message personnalisé en italique, sélecteur de quantité `– 1 +`, prix. Barre de progression fine (rouge vif sur rose poudré) vers le minimum de commande : « Plus que 12,00 $ pour atteindre le minimum de commande ». Pied collant : sous-total + bouton Commander.

### 7.7 Suivi de commande
Frise horizontale (verticale sur mobile) de 5 étapes : **Reçue → Confirmée → En préparation → Prête → Terminée**. Étape faite : cercle plein bordeaux avec coche blanche ; étape actuelle : cercle rouge vif ; à venir : cercle vide au filet. Annulée : bandeau en haut, fond rose poudré.

### 7.8 Badges de statut (admin)
Pilules de 12 px 500 avec une icône Lucide. Reçue (à traiter) : fond rouge vif, texte blanc. Confirmée, En préparation, Prête : fond rose poudré, texte bordeaux. Terminée : fond `--color-surface`, texte encre douce. Annulée : texte encre douce barré. Pré-autorisation qui expire : fond avertissement. Payée : fond succès.

### 7.9 Autres
- **Toasts** : en bas au centre (mobile) ou en bas à droite (ordinateur), fond encre, texte blanc, 4 s.
- **Fenêtres modales** : fond blanc, `--radius-lg`, voile `rgba(42,18,21,.4)` ; plein écran en feuille du bas sur mobile.
- **Squelettes de chargement** : blocs `--color-surface` avec une pulsation d'opacité très légère (pas de brillance animée).
- **États vides** : petite illustration au trait + phrase + bouton (ex. panier vide : « Votre panier est vide. » + « Découvrir nos créations »).
- **Bannière commandes fermées** : pleine largeur au-dessus de l'en-tête, fond bordeaux, texte blanc, icône `Clock`.

---

## 8. Illustrations (en attendant les photos)

Il n'y a pas encore de photos : on utilise des **illustrations** créées pour le site.

- Style : **au trait** (1,5 à 2 px, bordeaux) avec **un ou deux aplats** rouge vif ou blanc, sur **fond rose poudré**. Même langage graphique que la cerise du logo : formes simples et rondes, aucun dégradé, aucune ombre, aucune texture.
- Une illustration **par catégorie**, réutilisée par chaque produit sans photo : gâteau en tranches, croissant, macarons empilés, bûche, carte-cadeau avec ruban. Plus une pour l'accueil (gâteau entier surmonté d'une cerise) et une pour les états vides (assiette vide avec une cerise).
- Format : SVG en ligne dans `client/src/assets/illustrations/`, cadrage 4:5 pour les cartes et 16:9 pour la bannière d'accueil.
- Quand un produit a une vraie photo (`images[0]`), la photo remplace l'illustration. Photos affichées **arrondies** (`--radius-lg`), en `object-fit: cover`, sans filtre.

---

## 9. Mise en page des pages principales

**Accueil**
1. Bannière (hero) : à gauche, sur-titre « PÂTISSERIE MAISON À QUÉBEC », titre Display (« Des douceurs faites à la main, sur commande »), phrase, bouton principal « Découvrir la boutique » et bouton secondaire « Comment commander ». À droite, l'illustration d'accueil sur un bloc rose poudré arrondi. Sur mobile : illustration au-dessus du texte.
2. « Nos coups de cœur » : 4 produits vedettes.
3. « Comment ça marche » : 3 colonnes (icône au trait, titre, phrase) : Vous commandez → Nous vous appelons pour fixer la date → Livraison ou cueillette.
4. Produits saisonniers (s'il y en a), sur fond rose poudré pleine largeur.
5. Bandeau infos : livraison à Québec, minimum de commande, paiement sécurisé.
6. Pied de page : fond bordeaux, texte blanc, logo blanc, 3 colonnes (Boutique, Aide, Contact), mentions légales, numéro de permis.

**Boutique** : titre, puces de catégories défilables horizontalement (mobile), grille de produits, recherche active affichée en puce retirable.

**Fiche produit** : galerie à gauche (60 %) et informations à droite (40 %) sur ordinateur ; empilées sur mobile avec la barre « Ajouter au panier » collée en bas. Sections repliables : Ingrédients, Allergènes, Conservation.

**Paiement** : une seule colonne sur mobile, par étapes numérotées (1 Réception, 2 Coordonnées, 3 Paiement) ; sur ordinateur, formulaire à gauche et récapitulatif collant à droite. Le Payment Element de Stripe est harmonisé avec l'API `appearance` : `colorPrimary: '#C8102E'`, `colorText: '#2A1215'`, `colorBackground: '#FDF7F6'`, `borderRadius: '8px'`, `fontFamily: 'DM Sans'`.

**Admin** : même charte, plus dense. Barre latérale blanche (logo, navigation avec icônes) sur ordinateur ; barre du bas sur mobile (Accueil, Commandes, Produits, Réglages). Tableaux avec en-têtes 12 px en majuscules, lignes de 56 px, **transformés en cartes empilées sur mobile**. Dans le détail d'une commande, le bouton d'action principal (ex. « Confirmer la commande ») est collé en bas sur mobile.

---

## 10. Responsive

| Point de rupture | Largeur | Adaptations |
|---|---|---|
| Mobile | < 768 px | en-tête compact, barre du bas, 2 colonnes de produits, boutons pleine largeur collés en bas, modales en feuilles du bas |
| Tablette | 768 – 1023 px | 3 colonnes, en-tête compact avec recherche visible |
| Ordinateur | ≥ 1024 px | en-tête complet avec barre de recherche, 4 colonnes, tiroir panier latéral |

À tester au minimum sur : iPhone SE (375 px), iPhone 15 (393 px), Android moyen (412 px), iPad (768 px) et un écran de 1440 px. Aucun défilement horizontal, sauf dans les rangées de puces prévues pour ça.

---

## 11. Ton et rédaction

- **Vouvoiement** partout. Phrases courtes, chaleureuses, sans familiarité ni point d'exclamation en série.
- Verbes d'action sur les boutons : « Ajouter au panier », « Commander », « Payer 52,00 $ », « Confirmer la commande ».
- Montants au format québécois : **42,00 $** (virgule, espace insécable avant $). En anglais : **$42.00**.
- Dates : « samedi 20 décembre à 15 h » (FR) / « Saturday, December 20 at 3:00 p.m. » (EN).
- Exemples de textes :
  - Pré-autorisation : « Votre carte sera autorisée maintenant, mais débitée seulement lorsque nous aurons confirmé votre commande avec vous. »
  - Après la commande : « Merci ! Nous avons bien reçu votre commande. Nous vous contacterons sous peu pour convenir de la date. »
  - Hors zone : « Nous livrons pour l'instant dans la ville de Québec seulement. Vous pouvez choisir la cueillette. »
  - Minimum : « Le minimum de commande est de 30,00 $. Il vous manque 12,00 $. »

---

## 12. Jetons CSS (à placer dans `client/src/styles/tokens.css`)

```css
:root {
  /* Couleurs de marque */
  --color-red: #C8102E;
  --color-red-hover: #A80D26;
  --color-wine: #6B0F1A;
  --color-wine-hover: #520B14;
  --color-blush: #F7E4E2;
  --color-white: #FFFFFF;

  /* Neutres */
  --color-ink: #2A1215;
  --color-ink-muted: #6E5A5C;
  --color-line: #EEDFDD;
  --color-surface: #FDF7F6;

  /* Fonctionnelles */
  --color-success: #2E6B4F;  --color-success-bg: #E8F2EC;
  --color-warning: #8A5A00;  --color-warning-bg: #FBF1DE;
  --color-danger: #C8102E;   --color-danger-bg: #F7E4E2;

  /* Typographie */
  --font-sans: 'DM Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --text-display: clamp(2.25rem, 1.6rem + 3vw, 3.5rem);
  --text-h1: clamp(1.75rem, 1.4rem + 1.6vw, 2.5rem);
  --text-h2: clamp(1.375rem, 1.2rem + 0.8vw, 1.75rem);
  --text-h3: clamp(1.125rem, 1.08rem + 0.2vw, 1.25rem);
  --text-body: 1rem;
  --text-small: 0.875rem;
  --text-overline: 0.75rem;

  /* Formes */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 24px;
  --radius-full: 999px;
  --shadow: 0 1px 2px rgba(42, 18, 21, .06), 0 4px 16px rgba(42, 18, 21, .06);

  /* Espacements */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px; --space-24: 96px;

  --container: 1200px;
  --header-h: 72px;
  --transition: 180ms ease-out;
}

@media (max-width: 767px) {
  :root { --header-h: 56px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
```

Implémentation : CSS Modules ou fichiers CSS simples qui s'appuient **uniquement** sur ces variables. Aucune couleur écrite en dur dans les composants. Pas de framework CSS imposé ; si Tailwind est utilisé, le brancher sur ces variables.

---

## 13. Ce qui est interdit

- ❌ Dégradés (y compris dans les boutons, fonds, textes, images)
- ❌ Couleurs néon, fluo ou saturées hors palette
- ❌ Ombres lourdes, lueurs (glow), flou de fond décoratif
- ❌ Police à empattements, Playfair, polices manuscrites ou fantaisie
- ❌ Icônes pleines, colorées, 3D ou émojis dans l'interface
- ❌ Photos de banques d'images génériques
- ❌ Carrousels automatiques, fenêtres surgissantes promotionnelles, animations au défilement
- ❌ Texte sous 14 px (sauf sur-titres et libellés de la barre du bas, 12 px)
- ❌ Tutoiement
