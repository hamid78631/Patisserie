/*
 * Fenêtre modale (STYLE.md §7.9) : fond blanc, coins de 24 px, voile ;
 * en feuille du bas sur mobile.
 */
import { createPortal } from 'react-dom';
import { useDialog } from './useDialog.js';
import styles from './Modal.module.css';

export default function Modal({ open, onClose, title, children }) {
  const panneau = useDialog(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className={styles.fond} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.fenetre} role="dialog" aria-modal="true" aria-labelledby="modale-titre" ref={panneau}>
        <h2 id="modale-titre" className={styles.titre}>
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
