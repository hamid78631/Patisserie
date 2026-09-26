/*
 * Notifications éphémères (toasts) : en bas au centre sur mobile, en bas à droite sur ordinateur.
 * Disparaissent après 4 secondes ; annoncées aux lecteurs d'écran.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import styles from './Toasts.module.css';

const ToastContext = createContext(null);
const DUREE = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const suivant = useRef(1);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message, { type = 'success' } = {}) => {
      const id = suivant.current++;
      setToasts((list) => [...list.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), DUREE);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastList({ toasts, onDismiss }) {
  const { t } = useTranslation();
  return (
    <div className={styles.zone} aria-live="polite" role="status">
      {toasts.map(({ id, message, type }) => {
        const Icone = type === 'error' ? AlertTriangle : CheckCircle2;
        return (
          <div key={id} className={styles.toast}>
            <Icone size={20} strokeWidth={1.5} aria-hidden="true" />
            <p>{message}</p>
            <button type="button" className={styles.fermer} onClick={() => onDismiss(id)} aria-label={t('common.close')}>
              <X size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
