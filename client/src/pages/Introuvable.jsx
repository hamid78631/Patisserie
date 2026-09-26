import { useTranslation } from 'react-i18next';
import { EmptyState } from '../components/States.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';

/** Page 404. */
export default function Introuvable() {
  const { t } = useTranslation();
  usePageMeta({ title: t('notFound.seoTitle') });
  return (
    <div className="container page">
      <EmptyState title={t('notFound.title')} text={t('notFound.text')} action={t('notFound.cta')} to="/" headingLevel={1} />
    </div>
  );
}
