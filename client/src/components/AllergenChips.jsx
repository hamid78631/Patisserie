/*
 * Allergènes : puces texte sur fond rose poudré, précédées d'une icône Info (STYLE.md §5).
 */
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './AllergenChips.module.css';

export default function AllergenChips({ allergens = [] }) {
  const { t } = useTranslation();
  if (allergens.length === 0) return <p className="muted">{t('product.allergensNone')}</p>;
  return (
    <ul className={styles.liste}>
      {allergens.map((a) => (
        <li key={a} className={styles.puce}>
          <Info size={16} strokeWidth={1.5} aria-hidden="true" />
          {t(`allergens.${a}`)}
        </li>
      ))}
    </ul>
  );
}
