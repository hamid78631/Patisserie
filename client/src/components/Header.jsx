/*
 * En-tête collant, style PawCare : barre bordeaux ombrée, logo blanc, liens blancs,
 * recherche en pilule blanche et panier en pilule rouge.
 * - Ordinateur (≥ 1024 px) : logo, navigation, recherche, FR·EN, compte, panier.
 * - Tablette (768–1023 px) : menu, logo, recherche, panier.
 * - Mobile (< 768 px) : menu, logo centré, loupe, panier.
 */
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logo from '../assets/brand/logo-white.svg';
import { brand } from '../config/brand.js';
import { LIENS } from '../config/navigation.js';
import AccountButton from './AccountButton.jsx';
import CartButton from './CartButton.jsx';
import LanguageSwitch from './LanguageSwitch.jsx';
import MobileMenu from './MobileMenu.jsx';
import MobileSearch from './MobileSearch.jsx';
import SearchBox from './SearchBox.jsx';
import styles from './Header.module.css';

export default function Header() {
  const { t } = useTranslation();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);

  return (
    <header className={styles.entete}>
      <div className={`container ${styles.barre}`}>
        <button type="button" className={`icon-btn ${styles.menu}`} onClick={() => setMenuOuvert(true)} aria-label={t('header.openMenu')} aria-haspopup="dialog">
          <Menu size={24} strokeWidth={1.5} aria-hidden="true" />
        </button>

        <Link to="/" className={styles.logo} aria-label={t('header.homeLink', { brand: brand.name })}>
          <img src={logo} alt="" />
        </Link>

        <nav className={styles.nav} aria-label={t('nav.main')}>
          {LIENS.map(({ to, cle }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? styles.actif : undefined)}>
              {t(cle)}
            </NavLink>
          ))}
        </nav>

        <SearchBox className={styles.recherche} />

        <div className={styles.actions}>
          <button type="button" className={`icon-btn ${styles.loupe}`} onClick={() => setRechercheOuverte(true)} aria-label={t('header.openSearch')} aria-haspopup="dialog">
            <Search size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <span className={styles.langue}>
            <LanguageSwitch sombre />
          </span>
          <span className={styles.compte}>
            <AccountButton />
          </span>
          <CartButton />
        </div>
      </div>

      <MobileMenu open={menuOuvert} onClose={() => setMenuOuvert(false)} />
      <MobileSearch open={rechercheOuverte} onClose={() => setRechercheOuverte(false)} />
    </header>
  );
}
