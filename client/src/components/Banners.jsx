/*
 * Bandeaux au-dessus de l'en-tête :
 * - commandes fermées (fond bordeaux, icône Clock) avec le message choisi dans l'admin ;
 * - mode test quand l'API fonctionne sans Stripe (paiements simulés).
 */
import { Clock, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/queries.js';
import { useFormat } from '../lib/format.js';
import styles from './Banners.module.css';

export default function Banners() {
  const { t } = useTranslation();
  const { text } = useFormat();
  const { data: settings } = useSettings();
  if (!settings) return null;
  return (
    <>
      {settings.paymentsMode === 'mock' && (
        <aside className={styles.test} aria-label={t('common.mockBanner')}>
          <Info size={16} strokeWidth={1.5} aria-hidden="true" />
          {t('common.mockBanner')}
        </aside>
      )}
      {!settings.ordersOpen && (
        <aside className={styles.ferme} aria-label={t('closed.default')}>
          <Clock size={20} strokeWidth={1.5} aria-hidden="true" />
          <p>{text(settings.closedMessage) || t('closed.default')}</p>
        </aside>
      )}
    </>
  );
}
