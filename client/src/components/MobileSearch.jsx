/*
 * Recherche plein écran sur mobile (ouverte par la loupe de l'en-tête).
 */
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SearchBox from './SearchBox.jsx';
import { useDialog } from './useDialog.js';
import styles from './MobileSearch.module.css';

export default function MobileSearch({ open, onClose }) {
  const { t } = useTranslation();
  const panneau = useDialog(open, onClose);
  if (!open) return null;
  // Rendu à la racine du document : au-dessus de l’en-tête collant et de la barre du bas
  return createPortal(
    <div className={styles.panneau} role="dialog" aria-modal="true" aria-label={t('search.label')} ref={panneau}>
      <div className={`container ${styles.barre}`}>
        <SearchBox autoFocus onDone={onClose} />
        <button type="button" className="icon-btn" onClick={onClose} aria-label={t('header.closeSearch')}>
          <X size={24} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
