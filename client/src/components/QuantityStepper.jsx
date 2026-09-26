/*
 * Sélecteur de quantité « – 1 + » (cibles tactiles de 44 px).
 */
import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QUANTITE_MAX } from '../cart/CartContext.jsx';
import styles from './QuantityStepper.module.css';

export default function QuantityStepper({ value, onChange, min = 1, max = QUANTITE_MAX, label, compact = false }) {
  const { t } = useTranslation();
  return (
    <div className={`${styles.stepper} ${compact ? styles.compact : ''}`} role="group" aria-label={label || t('common.quantity')}>
      <button type="button" className={styles.bouton} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={t('common.decrease')}>
        <Minus size={18} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <output className={styles.valeur} aria-live="polite">
        {value}
      </output>
      <button type="button" className={styles.bouton} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={t('common.increase')}>
        <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}
