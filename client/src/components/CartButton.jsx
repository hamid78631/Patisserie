/*
 * Panier dans l'en-tête : pilule rouge (le bouton d'action de PawCare) avec le nombre d'articles.
 * Sur mobile, seulement l'icône avec sa pastille. Ouvre le tiroir panier.
 */
import { ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../cart/CartContext.jsx';
import styles from './CartButton.module.css';

export default function CartButton() {
  const { t } = useTranslation();
  const { count, openDrawer } = useCart();
  return (
    <button type="button" className={styles.panier} onClick={openDrawer} aria-label={t('header.cart', { count })} aria-haspopup="dialog">
      <ShoppingBag size={20} strokeWidth={2} aria-hidden="true" />
      <span className={styles.libelle} aria-hidden="true">
        {t('nav.cart')}
      </span>
      {count > 0 && (
        <span className={styles.pastille} aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
