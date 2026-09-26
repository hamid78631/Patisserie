/*
 * Page de contrôle de l'identité visuelle (outil de développement).
 * Montre la palette, la typographie, le logo et les illustrations
 * pour vérifier la charte sur mobile et sur ordinateur.
 */
import logo from '../assets/brand/logo.svg';
import logoBlanc from '../assets/brand/logo-white.svg';
import logoCerise from '../assets/brand/logo-mark.svg';
import { brand } from '../config/brand.js';
import {
  Accueil,
  AssietteVide,
  Buche,
  CarteCadeau,
  CeriseSeule,
  Croissant,
  Gateau,
  Macarons,
} from '../assets/illustrations/index.js';
import styles from './Charte.module.css';

const COULEURS = [
  { nom: 'Rouge vif', variable: '--color-red', hex: '#C8102E', role: 'Actions, pastille du panier, prix' },
  { nom: 'Bordeaux', variable: '--color-wine', hex: '#6B0F1A', role: 'Titres, logo, pied de page' },
  { nom: 'Rose poudré', variable: '--color-blush', hex: '#F7E4E2', role: 'Fonds de section, illustrations' },
  { nom: 'Blanc', variable: '--color-white', hex: '#FFFFFF', role: 'Fond principal' },
  { nom: 'Encre', variable: '--color-ink', hex: '#2A1215', role: 'Texte courant' },
  { nom: 'Encre douce', variable: '--color-ink-muted', hex: '#6E5A5C', role: 'Texte secondaire' },
  { nom: 'Filet', variable: '--color-line', hex: '#EEDFDD', role: 'Bordures, séparateurs' },
  { nom: 'Fond doux', variable: '--color-surface', hex: '#FDF7F6', role: 'Champs, zones secondaires' },
];

const PRODUITS = [
  { categorie: 'Gâteaux', nom: 'Fraisier', prix: 4200, Illustration: Gateau },
  { categorie: 'Viennoiseries', nom: 'Croissants au beurre', prix: 1800, Illustration: Croissant },
  { categorie: 'Macarons et mignardises', nom: 'Macarons assortis', prix: 2800, Illustration: Macarons, badge: 'Coup de cœur' },
  { categorie: 'Temps des fêtes', nom: 'Bûche de Noël', prix: 4800, Illustration: Buche, badge: 'Saisonnier' },
  { categorie: 'Cartes-cadeaux', nom: 'Carte-cadeau', prix: 2500, Illustration: CarteCadeau },
  { categorie: 'Autre catégorie', nom: 'Illustration par défaut', prix: 2400, Illustration: CeriseSeule },
];

const prix = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' });

export default function Charte() {
  return (
    <main className={styles.page}>
      <div className="container">
        <header className={styles.entete}>
          <img src={logo} alt={brand.name} className={styles.logoEntete} />
          <p className="overline muted">Charte graphique — outil de développement</p>
        </header>

        {/* Bannière d'accueil (aperçu de la mise en page de STYLE.md §9) */}
        <section className={styles.hero}>
          <div className={styles.heroTexte}>
            <p className="overline" style={{ color: 'var(--color-red)' }}>Pâtisserie maison à Québec</p>
            <h1 className="display">Des douceurs faites à la main, sur commande</h1>
            <p className="muted">
              Gâteaux, viennoiseries et macarons préparés chez nous, à Québec. Vous commandez,
              nous vous appelons pour convenir de la date.
            </p>
          </div>
          <div className={styles.heroImage}>
            <Accueil titre="Gâteau entier surmonté d'une cerise" />
          </div>
        </section>

        <section className={styles.section}>
          <h2>Couleurs</h2>
          <ul className={styles.palette}>
            {COULEURS.map((c) => (
              <li key={c.variable}>
                <span className={styles.pastille} style={{ background: `var(${c.variable})` }} />
                <strong>{c.nom}</strong>
                <span className="small muted">
                  {c.hex} · <code>{c.variable}</code>
                </span>
                <span className="small">{c.role}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>Typographie — DM Sans</h2>
          <div className={styles.typo}>
            <p className="display">Display 36 → 56</p>
            <h1>Titre de page H1</h1>
            <h2>Section H2</h2>
            <h3>Carte ou sous-section H3</h3>
            <p>
              Texte courant de 16 px, interligne 1,6. Chaque création est préparée à la main, sur
              commande, avec du beurre, des œufs frais et beaucoup de patience.
            </p>
            <p className="small muted">Petit texte de 14 px : légendes et aide des champs.</p>
            <p className="overline" style={{ color: 'var(--color-wine)' }}>Sur-titre · Nouveauté</p>
            <p className="price">{prix.format(42)} · {prix.format(123.45)}</p>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Logo</h2>
          <div className={styles.logos}>
            <div className={styles.logoCadre}>
              <img src={logo} alt={`${brand.name} — logo principal`} />
            </div>
            <div className={`${styles.logoCadre} ${styles.fondRose}`}>
              <img src={logoCerise} alt={`${brand.name} — cerise seule`} className={styles.cerise} />
            </div>
            <div className={`${styles.logoCadre} ${styles.fondRouge}`}>
              <img src={logoBlanc} alt={`${brand.name} — version blanche sur rouge`} />
            </div>
            <div className={`${styles.logoCadre} ${styles.fondBordeaux}`}>
              <img src={logoBlanc} alt={`${brand.name} — version blanche sur bordeaux`} />
            </div>
            <div className={styles.logoCadre}>
              <div className={styles.favicons}>
                {[16, 32, 48, 64].map((t) => (
                  <img key={t} src="/favicon.svg" width={t} height={t} alt={`Favicon ${t} px`} />
                ))}
              </div>
            </div>
            <div className={styles.logoCadre}>
              <img src={logo} alt={`${brand.name} — taille minimale 28 px`} style={{ height: 28 }} />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Illustrations des produits sans photo</h2>
          <ul className={styles.grille}>
            {PRODUITS.map(({ categorie, nom, prix: montant, Illustration, badge }) => (
              <li key={nom} className={styles.carte}>
                <div className={styles.image}>
                  <Illustration />
                  {badge && <span className={styles.badge}>{badge}</span>}
                </div>
                <p className="overline muted">{categorie}</p>
                <h3>{nom}</h3>
                <p className="price">À partir de {prix.format(montant / 100)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>État vide</h2>
          <div className={styles.vide}>
            <div className={styles.videImage}>
              <AssietteVide />
            </div>
            <p>Votre panier est vide.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
