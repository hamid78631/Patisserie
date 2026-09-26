/*
 * Traductions : français par défaut (Loi 96), anglais en option.
 * Le choix est mémorisé dans le navigateur ; les URL restent les mêmes.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';

const CLE = 'patisserie-langue';

function langueMemorisee() {
  try {
    const valeur = localStorage.getItem(CLE);
    return valeur === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: langueMemorisee(),
  fallbackLng: 'fr',
  supportedLngs: ['fr', 'en'],
  interpolation: { escapeValue: false }, // React échappe déjà
});

document.documentElement.lang = i18n.language;

i18n.on('languageChanged', (langue) => {
  document.documentElement.lang = langue;
  try {
    localStorage.setItem(CLE, langue);
  } catch {
    /* navigation privée : le choix n'est simplement pas mémorisé */
  }
});

export default i18n;
