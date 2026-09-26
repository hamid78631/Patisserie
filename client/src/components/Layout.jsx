/*
 * Gabarit commun des pages publiques.
 */
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../cart/CartContext.jsx';
import Banners from './Banners.jsx';
import BottomNav from './BottomNav.jsx';
import CartDrawer from './CartDrawer.jsx';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import styles from './Layout.module.css';

export default function Layout() {
  const { t } = useTranslation();
  const { pathname, hash } = useLocation();
  const { closeDrawer } = useCart();

  // Nouvelle page : retour en haut (sauf ancre) et fermeture du tiroir panier
  useEffect(() => {
    closeDrawer();
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hash]);

  return (
    <div className={styles.app}>
      <a href="#contenu" className={styles.evitement}>
        {t('common.skipToContent')}
      </a>
      <Banners />
      <Header />
      <main id="contenu" tabIndex={-1} className={styles.contenu}>
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <CartDrawer />
    </div>
  );
}
