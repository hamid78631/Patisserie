/*
 * Bandeau au-dessus de l'en-tête quand les commandes sont fermées
 * (dégradé bordeaux, icône Clock), avec le message choisi dans l'admin.
 * Pas de bandeau « Mode test » : retiré à la demande de Hamid.
 */
import { Clock } from 'lucide-react';
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
      {!settings.ordersOpen && (
        <aside className={styles.ferme} aria-label={t('closed.default')}>
          <Clock size={20} strokeWidth={1.5} aria-hidden="true" />
          <p>{text(settings.closedMessage) || t('closed.default')}</p>
        </aside>
      )}
    </>
  );
}
