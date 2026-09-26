/*
 * Barre fine (rouge vif sur rose poudré) vers le minimum de commande (STYLE.md §7.6).
 * Les cartes-cadeaux ne comptent pas dans le minimum ; un panier de cartes seules n'en a pas.
 */
import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../cart/CartContext.jsx';
import { useSettings } from '../hooks/queries.js';
import { useFormat } from '../lib/format.js';
import styles from './MinimumProgress.module.css';

export function useMinimum() {
  const { data: settings } = useSettings();
  const { minimumBase, onlyGiftCards } = useCart();
  const minimum = settings?.minimumOrder || 0;
  const applicable = minimum > 0 && !onlyGiftCards;
  const manque = applicable ? Math.max(0, minimum - minimumBase) : 0;
  return { minimum, applicable, manque, atteint: manque === 0, base: minimumBase };
}

export default function MinimumProgress() {
  const { t } = useTranslation();
  const { money } = useFormat();
  const { minimum, applicable, manque, atteint, base } = useMinimum();
  if (!applicable) return null;
  const pourcentage = Math.min(100, Math.round((base / minimum) * 100));

  return (
    <div className={styles.progression}>
      {atteint ? (
        <p className={styles.atteint}>
          <CheckCircle2 size={16} strokeWidth={1.5} aria-hidden="true" />
          {t('cart.minimumReached')}
        </p>
      ) : (
        <p>{t('cart.minimumLeft', { amount: money(manque) })}</p>
      )}
      <div
        className={styles.barre}
        role="progressbar"
        aria-label={t('cart.minimumLabel')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pourcentage}
      >
        <span style={{ width: `${pourcentage}%` }} />
      </div>
    </div>
  );
}
