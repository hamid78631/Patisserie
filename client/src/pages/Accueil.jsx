/*
 * Accueil (STYLE.md §9) : bannière, coups de cœur, « Comment ça marche »,
 * produits saisonniers en cours, bandeau d'informations.
 */
import { Link } from 'react-router-dom';
import { CreditCard, Phone, ShoppingBag, Truck, CakeSlice } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Accueil as IllustrationAccueil } from '../assets/illustrations/index.js';
import { brand } from '../config/brand.js';
import ProductGrid from '../components/ProductGrid.jsx';
import { useProducts, useSettings } from '../hooks/queries.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { useFormat } from '../lib/format.js';
import styles from './Accueil.module.css';

export default function Accueil() {
  const { t } = useTranslation();
  const { money } = useFormat();
  const { data: settings } = useSettings();
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

  const etapes = [
    { Icone: ShoppingBag, titre: 'home.step1Title', texte: 'home.step1Text' },
    { Icone: Phone, titre: 'home.step2Title', texte: 'home.step2Text' },
    { Icone: Truck, titre: 'home.step3Title', texte: 'home.step3Text' },
  ];
  const prefixes = settings?.deliveryPostalPrefixes?.join(', ') || 'G1, G2, G3';

  return (
    <>
      <section className={`container ${styles.hero}`}>
        <div className={styles.heroTexte}>
          <p className={`overline ${styles.surtitre}`}>{t('home.overline')}</p>
          <h1 className="display">{t('home.title')}</h1>
          <p className={styles.chapeau}>{t('home.lead')}</p>
          <div className={styles.boutons}>
            <Link to="/boutique" className="btn btn-primary">
              {t('home.ctaShop')}
            </Link>
            <a href="#comment-ca-marche" className="btn btn-secondary">
              {t('home.ctaHow')}
            </a>
          </div>
        </div>
        <div className={styles.heroImage}>
          <IllustrationAccueil />
        </div>
      </section>

      {(vedettes.isLoading || vedettes.data?.length > 0) && (
        <section className={`container section ${styles.sectionVedettes}`} aria-labelledby="vedettes">
          <div className={styles.enteteSection}>
            <h2 id="vedettes">{t('home.featured')}</h2>
            <Link to="/boutique" className="btn btn-ghost">
              {t('home.seeShop')}
            </Link>
          </div>
          <ProductGrid products={vedettes.data?.slice(0, 4) || []} loading={vedettes.isLoading} />
        </section>
      )}

      <section id="comment-ca-marche" className={`container section ${styles.etapes}`} aria-labelledby="comment">
        <h2 id="comment" className="section-title">
          {t('home.howTitle')}
        </h2>
        <ol className={styles.listeEtapes}>
          {etapes.map(({ Icone, titre, texte }, i) => (
            <li key={titre}>
              <span className={styles.iconeEtape} aria-hidden="true">
                <Icone size={24} strokeWidth={1.5} />
              </span>
              <h3>
                <span className="visually-hidden">{i + 1}. </span>
                {t(titre)}
              </h3>
              <p className="muted">{t(texte)}</p>
            </li>
          ))}
        </ol>
      </section>

      {saisonniers.data?.length > 0 && (
        <section className={styles.saison} aria-labelledby="saison">
          <div className="container section">
            <h2 id="saison">{t('home.seasonal')}</h2>
            <p className={`muted ${styles.saisonTexte}`}>{t('home.seasonalLead')}</p>
            <ProductGrid products={saisonniers.data} />
          </div>
        </section>
      )}

      <section className="container section">
        <ul className={styles.infos}>
          <li>
            <Truck size={24} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <h3>{t('home.infoDeliveryTitle')}</h3>
              <p className="muted">{t('home.infoDeliveryText', { prefixes })}</p>
            </div>
          </li>
          {settings?.minimumOrder > 0 && (
            <li>
              <CakeSlice size={24} strokeWidth={1.5} aria-hidden="true" />
              <div>
                <h3>{t('home.infoMinimumTitle', { amount: money(settings.minimumOrder) })}</h3>
                <p className="muted">{t('home.infoMinimumText')}</p>
              </div>
            </li>
          )}
          <li>
            <CreditCard size={24} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <h3>{t('home.infoPaymentTitle')}</h3>
              <p className="muted">{t('home.infoPaymentText')}</p>
            </div>
          </li>
        </ul>
      </section>
    </>
  );
}
