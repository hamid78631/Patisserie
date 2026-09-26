/*
 * Icône panier avec pastille rouge vif : ouvre le tiroir panier (STYLE.md §7.1).
 */
import { ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../cart/CartContext.jsx';
import styles from './CartButton.module.css';

export default function CartButton() {
  const { t } = useTranslation();
  const { count, openDrawer } = useCart();
  return (
    <button type="button" className={`icon-btn ${styles.panier}`} onClick={openDrawer} aria-label={t('header.cart', { count })} aria-haspopup="dialog">
      <ShoppingBag size={24} strokeWidth={1.5} aria-hidden="true" />
      {count > 0 && (
        <span className={styles.pastille} aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
