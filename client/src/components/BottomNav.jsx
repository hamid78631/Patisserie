/*
 * Barre de navigation du bas (mobile uniquement) : Accueil · Boutique · Panier · Compte.
 * L'onglet actif est en rouge vif ; respecte la zone sûre de l'iPhone.
 */
import { NavLink } from 'react-router-dom';
import { CakeSlice, Home, ShoppingBag, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../cart/CartContext.jsx';
import { useMe } from '../hooks/queries.js';
import { Avatar } from './AccountButton.jsx';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const { t } = useTranslation();
  const { count } = useCart();
  const { data: user } = useMe();
  const classe = ({ isActive }) => (isActive ? `${styles.lien} ${styles.actif}` : styles.lien);

  return (
    <nav className={styles.barre} aria-label={t('nav.main')}>
      <NavLink to="/" end className={classe}>
        <Home size={24} strokeWidth={1.5} aria-hidden="true" />
        <span>{t('nav.home')}</span>
      </NavLink>
      <NavLink to="/boutique" className={classe}>
        <CakeSlice size={24} strokeWidth={1.5} aria-hidden="true" />
        <span>{t('nav.shop')}</span>
      </NavLink>
      <NavLink to="/panier" className={classe} aria-label={t('header.cart', { count })}>
        <span className={styles.icone}>
          <ShoppingBag size={24} strokeWidth={1.5} aria-hidden="true" />
          {count > 0 && (
            <span className={styles.pastille} aria-hidden="true">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </span>
        <span aria-hidden="true">{t('nav.cart')}</span>
      </NavLink>
      <NavLink to={user ? '/compte' : '/compte/connexion'} className={classe}>
        {user ? <Avatar user={user} size={24} /> : <User size={24} strokeWidth={1.5} aria-hidden="true" />}
        <span>{t('nav.account')}</span>
      </NavLink>
    </nav>
  );
}
