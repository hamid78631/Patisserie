/*
 * Accueil, style PawCare : haut de page en dégradé avec gâteaux dans des bulles,
 * bandeau d'informations en dégradé bordeaux, coups de cœur, « Comment ça marche »
 * illustré, produits saisonniers, « Pourquoi nous » et appel à l'action final.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CakeSlice, ChevronRight, Clock, CreditCard, HandHeart, Search, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Croissant, Gateau, Macarons, illustrationPour } from '../assets/illustrations/index.js';
import imageCommander from '../assets/pawcare/commander.webp';
import imageAppel from '../assets/pawcare/appel.webp';
import imageCueillette from '../assets/pawcare/cueillette.webp';
import { brand } from '../config/brand.js';
import ProductGrid from '../components/ProductGrid.jsx';
import { useCategories, useProducts, useSettings } from '../hooks/queries.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { useFormat } from '../lib/format.js';
import styles from './Accueil.module.css';

export default function Accueil() {
  const { t } = useTranslation();
  const { money, text } = useFormat();
  const naviguer = useNavigate();
  const [recherche, setRecherche] = useState('');
  const { data: settings } = useSettings();
  const { data: categories } = useCategories();
  const vedettes = useProducts({ featured: true });
  const saisonniers = useProducts({ seasonal: true });

  usePageMeta({
    description: t('home.seoDescription'),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Bakery',
      name: brand.name,
      description: t('home.seoDescription'),
      address: { '@type': 'PostalAddress', addressLocality: brand.city, addressRegion: 'QC', addressCountry: 'CA' },
      areaServed: 'Québec',
      currenciesAccepted: 'CAD',
      ...(settings?.publicEmail ? { email: settings.publicEmail } : {}),
      ...(settings?.publicPhone ? { telephone: settings.publicPhone } : {}),
    },
  });

  const rechercher = (e) => {
    e.preventDefault();
    const q = recherche.trim();
    naviguer(q ? `/boutique?q=${encodeURIComponent(q)}` : '/boutique');
  };

  const prefixes = settings?.deliveryPostalPrefixes?.join(' · ') || 'G1 · G2 · G3';
  const chiffres = [
    { Icone: HandHeart, valeur: '100 %', libelle: t('home.statHandmade') },
    { Icone: Truck, valeur: prefixes, libelle: t('home.statDelivery') },
    ...(settings?.minimumOrder > 0
      ? [{ Icone: CakeSlice, valeur: money(settings.minimumOrder), libelle: t('home.statMinimum') }]
      : []),
    { Icone: CreditCard, valeur: t('home.statPaymentValue'), libelle: t('home.statPayment') },
  ];

  const etapes = [
    { image: imageCommander, titre: 'home.step1Title', texte: 'home.step1Text' },
    { image: imageAppel, titre: 'home.step2Title', texte: 'home.step2Text' },
    { image: imageCueillette, titre: 'home.step3Title', texte: 'home.step3Text' },
  ];

  const raisons = [
    { Icone: HandHeart, titre: t('home.why1') },
    { Icone: Clock, titre: t('home.why2') },
    { Icone: ShieldCheck, titre: t('home.why3') },
    { Icone: Truck, titre: t('home.why4') },
  ];

  return (
    <>
      {/* --- Haut de page ------------------------------------------------------ */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInterieur}`}>
          <div className={styles.bulles} aria-hidden="true">
            <svg className={`${styles.connecteur} ${styles.connecteurLarge}`} viewBox="0 0 460 640" fill="none" preserveAspectRatio="none">
              <path d="M 165 155 C 125 300 110 420 105 535" />
              <path d="M 165 155 C 250 210 300 270 335 320" />
            </svg>
            {/* Téléphone et tablette : bulles disposées à l'horizontale */}
            <svg className={`${styles.connecteur} ${styles.connecteurCompact}`} viewBox="0 0 343 250" fill="none" preserveAspectRatio="none">
              <path d="M 93 79 C 105 150 140 185 175 198" />
              <path d="M 93 79 C 160 30 225 50 271 85" />
            </svg>
            <div className={`${styles.bulle} ${styles.bulle1}`}>
              <Gateau />
            </div>
            <div className={`${styles.bulle} ${styles.bulle2}`}>
              <Macarons />
            </div>
            <div className={`${styles.bulle} ${styles.bulle3}`}>
              <Croissant />
            </div>
          </div>

          <div className={styles.heroTexte}>
            <p className={`tag ${styles.etiquette}`}>
              <Sparkles size={14} aria-hidden="true" />
              {t('home.overline')}
            </p>
            <h1 className={styles.titre}>
              {t('home.titleStart')} <span>{t('home.titleAccent')}</span>
            </h1>
            <p className={styles.chapeau}>{t('home.lead')}</p>
            <ul className={styles.pastilles}>
              <li>
                <HandHeart size={14} aria-hidden="true" /> {t('home.pillHandmade')}
              </li>
              <li>
                <ShieldCheck size={14} aria-hidden="true" /> {t('home.pillPayment')}
              </li>
            </ul>
            <form className={styles.recherche} onSubmit={rechercher}>
              <Search size={18} aria-hidden="true" className={styles.loupe} />
              <label htmlFor="recherche-accueil" className="visually-hidden">
                {t('search.label')}
              </label>
              <input
                id="recherche-accueil"
                type="search"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                autoComplete="off"
                enterKeyHint="search"
              />
              <button type="submit">{t('home.searchButton')}</button>
            </form>
            <a href="#comment-ca-marche" className={styles.lienComment}>
              {t('home.ctaHow')} →
            </a>

            {/* Mobile et tablette : raccourcis vers les catégories, à la manière d'une application */}
            <nav className={styles.raccourcis} aria-label={t('home.categoriesLabel')}>
              <ul>
                {categories?.map((c) => {
                  const Illustration = illustrationPour({ slugCategorie: c.slug });
                  return (
                    <li key={c._id}>
                      <Link to={`/boutique/${c.slug}`}>
                        <span className={styles.raccourciBulle}>
                          <Illustration />
                        </span>
                        {text(c.name)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </section>

      {/* --- Bandeau d'informations -------------------------------------------- */}
      <section className={styles.chiffres} aria-label={t('home.statsLabel')}>
        <ul className={styles.chiffresInterieur}>
          {chiffres.map(({ Icone, valeur, libelle }) => (
            <li key={libelle}>
              <span className={styles.chiffreIcone} aria-hidden="true">
                <Icone size={22} />
              </span>
              <strong className={styles.chiffreValeur}>{valeur}</strong>
              <span className={styles.chiffreLibelle}>{libelle}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* --- Coups de cœur ----------------------------------------------------- */}
      {(vedettes.isLoading || vedettes.data?.length > 0) && (
        <section className="container section" aria-labelledby="vedettes">
          <div className={styles.enteteSection}>
            <h2 id="vedettes" className={styles.titreSection}>
              {t('home.featured')}
            </h2>
            <p className={styles.sousTitre}>{t('home.featuredLead')}</p>
            <Link to="/boutique" className={styles.toutVoir}>
              {t('home.seeAll')} <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className={styles.carrousel}>
            <ProductGrid products={vedettes.data?.slice(0, 4) || []} loading={vedettes.isLoading} />
          </div>
          <div className={styles.voirTout}>
            <Link to="/boutique" className="btn btn-secondary">
              {t('home.seeShop')}
            </Link>
          </div>
        </section>
      )}

      {/* --- Comment ça marche -------------------------------------------------- */}
      <section id="comment-ca-marche" className={styles.comment} aria-labelledby="comment">
        <div className={styles.enteteSection}>
          <h2 id="comment" className={styles.titreSection}>
            {t('home.howTitle')}
          </h2>
          <p className={styles.sousTitre}>{t('home.howLead')}</p>
        </div>
        <div className={styles.flux}>
          <svg className={styles.courbe} viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 17 10 C 26 2, 40 18, 50 10 C 60 2, 74 18, 83 10" />
          </svg>
          <ol className={styles.etapes}>
          {etapes.map(({ image, titre, texte }, i) => (
            <li key={titre} className={styles.etape}>
              <div className={`${styles.forme} ${styles[`forme${i + 1}`]}`}>
                <img src={image} alt="" width="360" height="260" loading="lazy" decoding="async" />
              </div>
              <div className={styles.texteBloc}>
                <span className={styles.numero} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className={styles.titreEtape}>
                  <span className="visually-hidden">{i + 1}. </span>
                  {t(titre)}
                </h3>
                <p className={styles.texteEtape}>{t(texte)}</p>
              </div>
            </li>
          ))}
          </ol>
        </div>
      </section>

      {/* --- Produits saisonniers ---------------------------------------------- */}
      {saisonniers.data?.length > 0 && (
        <section className={styles.saison} aria-labelledby="saison">
          <div className="container section">
            <div className={styles.enteteSection}>
              <h2 id="saison" className={styles.titreSection}>
                {t('home.seasonal')}
              </h2>
              <p className={styles.sousTitre}>{t('home.seasonalLead')}</p>
            </div>
            <div className={styles.carrousel}>
              <ProductGrid products={saisonniers.data} />
            </div>
          </div>
        </section>
      )}

      {/* --- Pourquoi nous ------------------------------------------------------ */}
      <section className={styles.pourquoi} aria-labelledby="pourquoi">
        <div className={styles.enteteSection}>
          <h2 id="pourquoi" className={styles.titrePourquoi}>
            {t('home.whyTitle', { brand: brand.name })}
          </h2>
          <p className={styles.sousTitrePourquoi}>{t('home.whyLead')}</p>
        </div>
        <div className={styles.pourquoiInterieur}>
          <ul className={styles.raisons}>
            {raisons.map(({ Icone, titre }) => (
              <li key={titre} className={styles.raison}>
                <span className={styles.raisonIcone} aria-hidden="true">
                  <Icone size={26} />
                </span>
                <span className={styles.raisonTitre}>{titre}</span>
              </li>
            ))}
          </ul>
          <div className={styles.grandeBulle} aria-hidden="true">
            <Gateau />
          </div>
        </div>
      </section>

      {/* --- Appel à l'action --------------------------------------------------- */}
      <section className={styles.cta} aria-labelledby="cta">
        <CakeSlice size={48} className={styles.ctaIcone} aria-hidden="true" />
        <h2 id="cta" className={styles.titreSection}>
          {t('home.ctaTitle')}
        </h2>
        <p className={styles.sousTitre}>{t('home.ctaText')}</p>
        <Link to="/boutique" className={`btn btn-primary ${styles.ctaBouton}`}>
          {t('home.ctaShop')}
        </Link>
      </section>
    </>
  );
}
