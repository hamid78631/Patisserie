/*
 * Page Panier : lignes, quantités, sous-total, progression vers le minimum, bouton Commander.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../cart/CartContext.jsx';
import CartLines from '../components/CartLines.jsx';
import MinimumProgress, { useMinimum } from '../components/MinimumProgress.jsx';
import { EmptyState } from '../components/States.jsx';
import { useSettings } from '../hooks/queries.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { useFormat } from '../lib/format.js';
import styles from './Panier.module.css';

export default function Panier() {
  const { t } = useTranslation();
  const { money } = useFormat();
  const { items, count, subtotal } = useCart();
  const { data: settings } = useSettings();
  const { atteint } = useMinimum();
  usePageMeta({ title: t('cart.title'), description: t('cart.seoDescription') });

  if (items.length === 0) {
    return (
      <div className="container page">
        <h1 className="page-title">{t('cart.title')}</h1>
        <EmptyState title={t('cart.empty')} action={t('cart.emptyCta')} to="/boutique" />
      </div>
    );
  }

  const ferme = settings && !settings.ordersOpen;
  const bloque = ferme || !atteint;
  return (
    <div className="container page">
      <h1 className="page-title">
        {t('cart.title')} <span className={styles.nombre}>({t('cart.lines', { count })})</span>
      </h1>
      <div className={styles.grille}>
        <section aria-label={t('cart.title')}>
          <CartLines />
          <Link to="/boutique" className={`btn btn-ghost ${styles.continuer}`}>
            {t('cart.continue')}
          </Link>
        </section>

        <aside className={styles.resume} aria-label={t('cart.subtotal')}>
          <MinimumProgress />
          <p className={styles.total}>
            <span>{t('cart.subtotal')}</span>
            <span className="price">{money(subtotal)}</span>
          </p>
          <p className="small muted">{t('cart.nextStep')}</p>
          {ferme && <p className="notice notice-warning">{t('cart.closed')}</p>}
          <div className={styles.action} data-barre-action>
            <Link to="/paiement" className="btn btn-primary btn-block" aria-disabled={bloque} onClick={(e) => bloque && e.preventDefault()}>
              {t('cart.checkout')}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
