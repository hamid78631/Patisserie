/*
 * États vides et d'erreur : petite illustration au trait, phrase, bouton (STYLE.md §7.9).
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AssietteVide } from '../assets/illustrations/index.js';
import styles from './States.module.css';

export function EmptyState({ title, text, action, to, onAction, headingLevel = 2 }) {
  const Titre = `h${headingLevel}`;
  return (
    <div className={styles.etat}>
      <div className={styles.illustration}>
        <AssietteVide />
      </div>
      {title && <Titre className={styles.titre}>{title}</Titre>}
      {text && <p className="muted">{text}</p>}
      {action && to && (
        <Link to={to} className="btn btn-primary" onClick={onAction}>
          {action}
        </Link>
      )}
      {action && !to && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ onRetry }) {
  const { t } = useTranslation();
  return <EmptyState title={t('common.errorTitle')} text={t('common.errorText')} action={onRetry ? t('common.retry') : null} onAction={onRetry} />;
}
