/*
 * Sélecteur de langue « FR · EN » : la langue active en gras (blanc sur la barre bordeaux).
 */
import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitch.module.css';

export default function LanguageSwitch({ sombre = false }) {
  const { t, i18n } = useTranslation();
  const actuelle = i18n.resolvedLanguage === 'en' ? 'en' : 'fr';
  return (
    <div className={`${styles.switch} ${sombre ? styles.sombre : ''}`} role="group" aria-label={t('header.language')}>
      <button type="button" lang="fr" aria-pressed={actuelle === 'fr'} onClick={() => i18n.changeLanguage('fr')} aria-label="Français">
        FR
      </button>
      <span aria-hidden="true">·</span>
      <button type="button" lang="en" aria-pressed={actuelle === 'en'} onClick={() => i18n.changeLanguage('en')} aria-label="English">
        EN
      </button>
    </div>
  );
}
