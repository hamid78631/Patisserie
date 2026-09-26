/*
 * Page temporaire pour les routes des étapes suivantes (paiement, suivi, comptes, pages légales).
 */
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../components/States.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';

export default function Bientot({ titre }) {
  const { t } = useTranslation();
  usePageMeta({ title: t(titre) });
  return (
    <div className="container page">
      <h1 className="page-title">{t(titre)}</h1>
      <EmptyState title={t('soon.title')} text={t('soon.text')} action={t('soon.cta')} to="/boutique" />
    </div>
  );
}
