/*
 * Tiroir panier : panneau de 420 px à droite (plein écran sur mobile),
 * pied collant avec le sous-total et le bouton Commander (STYLE.md §7.6).
 */
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../cart/CartContext.jsx';
import { useSettings } from '../hooks/queries.js';
import { useFormat } from '../lib/format.js';
import CartLines from './CartLines.jsx';
import MinimumProgress, { useMinimum } from './MinimumProgress.jsx';
import { EmptyState } from './States.jsx';
import { useDialog } from './useDialog.js';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { t } = useTranslation();
  const { money } = useFormat();
  const { items, count, subtotal, drawerOpen, closeDrawer } = useCart();
  const { data: settings } = useSettings();
  const { atteint } = useMinimum();
  const panneau = useDialog(drawerOpen, closeDrawer);
  if (!drawerOpen) return null;

  const ferme = settings && !settings.ordersOpen;
  return (
    <div className={styles.fond} onMouseDown={(e) => e.target === e.currentTarget && closeDrawer()}>
      <div className={styles.tiroir} data-tiroir-panier role="dialog" aria-modal="true" aria-labelledby="tiroir-titre" ref={panneau}>
        <div className={styles.haut}>
          <h2 id="tiroir-titre" className={styles.titre}>
            {t('cart.title')} {count > 0 && <span className="muted">({t('cart.lines', { count })})</span>}
          </h2>
          <button type="button" className="icon-btn" onClick={closeDrawer} aria-label={t('common.close')} data-autofocus>
            <X size={24} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.corps}>
            <EmptyState title={t('cart.empty')} action={t('cart.emptyCta')} to="/boutique" onAction={closeDrawer} />
          </div>
        ) : (
          <>
            <div className={styles.corps}>
              <CartLines onNavigate={closeDrawer} />
            </div>
            <div className={styles.pied}>
              <MinimumProgress />
              <p className={styles.total}>
                <span>{t('cart.subtotal')}</span>
                <span className="price">{money(subtotal)}</span>
              </p>
              {ferme && <p className="notice notice-warning">{t('cart.closed')}</p>}
              <Link
                to="/paiement"
                className="btn btn-primary btn-block"
                onClick={(e) => {
                  if (ferme || !atteint) e.preventDefault();
                  else closeDrawer();
                }}
                aria-disabled={ferme || !atteint}
              >
                {t('cart.checkout')}
              </Link>
              <Link to="/panier" className="btn btn-ghost" onClick={closeDrawer}>
                {t('cart.viewCart')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
