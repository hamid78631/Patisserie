/*
 * Mise en forme des montants (toujours reçus en cents CAD) et des textes bilingues.
 */
import { useTranslation } from 'react-i18next';

const formats = {};
function moneyFormat(lang) {
  const locale = lang === 'en' ? 'en-CA' : 'fr-CA';
  formats[locale] ||= new Intl.NumberFormat(locale, { style: 'currency', currency: 'CAD' });
  return formats[locale];
}

/** 4200 → « 42,00 $ » (fr) ou « $42.00 » (en) */
export function formatMoney(cents, lang = 'fr') {
  return moneyFormat(lang).format((cents || 0) / 100);
}

/** Texte bilingue de l'API { fr, en } : la langue courante, sinon le français. */
export function localize(field, lang = 'fr') {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[lang] || field.fr || '';
}

/** Raccourcis liés à la langue courante. */
export function useFormat() {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === 'en' ? 'en' : 'fr';
  return {
    lang,
    money: (cents) => formatMoney(cents, lang),
    text: (field) => localize(field, lang),
  };
}

/** Pour la recherche : minuscules et sans accents (« Bûche » → « buche »). */
export function normalize(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Image Cloudinary redimensionnée et compressée automatiquement (format et qualité adaptés).
 * Les autres adresses sont renvoyées telles quelles.
 */
export function imageUrl(url, width) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}
