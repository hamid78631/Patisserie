/*
 * Pied de page : fond bordeaux, logo blanc, 3 colonnes (Boutique, Aide, Contact),
 * mentions légales, « Prix en dollars canadiens » et numéro de permis MAPAQ s'il est renseigné.
 * Les coordonnées viennent des réglages (admin) ; brand.js sert de repli.
 */
import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoBlanc from '../assets/brand/logo-white.svg';
import { brand } from '../config/brand.js';
import { useCategories, useSettings } from '../hooks/queries.js';
import { useFormat } from '../lib/format.js';
import styles from './Footer.module.css';

export default function Footer() {
  const { t } = useTranslation();
  const { text, lang } = useFormat();
  const { data: settings } = useSettings();
  const { data: categories = [] } = useCategories();

  const courriel = settings?.publicEmail || brand.email;
  const telephone = settings?.publicPhone || brand.phone;
  const instagram = settings?.instagramUrl || brand.instagramUrl;
  const facebook = settings?.facebookUrl || brand.facebookUrl;

  return (
    <footer className={styles.pied}>
      <div className={`container ${styles.grille}`}>
        <div className={styles.marque}>
          <img src={logoBlanc} alt={brand.name} className={styles.logo} />
          <p>{brand.tagline[lang]}</p>
        </div>

        <nav aria-labelledby="pied-boutique">
          <h2 id="pied-boutique" className={styles.titre}>
            {t('footer.shop')}
          </h2>
          <ul>
            <li>
              <Link to="/boutique">{t('footer.allProducts')}</Link>
            </li>
            {categories
              .filter((c) => !/cadeau/.test(c.slug))
              .map((c) => (
                <li key={c._id}>
                  <Link to={`/boutique/${c.slug}`}>{text(c.name)}</Link>
                </li>
              ))}
            <li>
              <Link to="/cartes-cadeaux">{t('nav.giftCards')}</Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="pied-aide">
          <h2 id="pied-aide" className={styles.titre}>
            {t('footer.help')}
          </h2>
          <ul>
            <li>
              <Link to="/faq">{t('nav.faq')}</Link>
            </li>
            <li>
              <Link to="/a-propos">{t('nav.about')}</Link>
            </li>
            <li>
              <Link to="/conditions">{t('footer.terms')}</Link>
            </li>
            <li>
              <Link to="/confidentialite">{t('footer.privacy')}</Link>
            </li>
          </ul>
        </nav>

        <div className={styles.coordonnees}>
          <h2 className={styles.titre}>{t('footer.contact')}</h2>
          <ul>
            <li>
              <a href={`mailto:${courriel}`} className={styles.contact}>
                <Mail size={20} strokeWidth={1.5} aria-hidden="true" />
                {courriel}
              </a>
            </li>
            <li>
              <a href={`tel:${telephone.replace(/[^\d+]/g, '')}`} className={styles.contact}>
                <Phone size={20} strokeWidth={1.5} aria-hidden="true" />
                {telephone}
              </a>
            </li>
            <li className={styles.reseaux}>
              <a href={instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href={facebook} target="_blank" rel="noreferrer">
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className={`container ${styles.mentions}`}>
        <p>{t('footer.prices')}</p>
        {settings?.permitNumber && <p>{t('footer.permit', { number: settings.permitNumber })}</p>}
        <p>{t('footer.rights', { year: new Date().getFullYear(), brand: brand.name })}</p>
      </div>
    </footer>
  );
}
