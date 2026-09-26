/*
 * Boutique (/boutique, /boutique/:categorie, ?q=recherche) :
 * puces de catégories défilables, recherche active en puce retirable, grille de produits.
 * Tout le catalogue est chargé une fois ; le filtre se fait dans le navigateur.
 */
import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductGrid from '../components/ProductGrid.jsx';
import { filterProducts } from '../components/SearchBox.jsx';
import { EmptyState, ErrorState } from '../components/States.jsx';
import { useCategories, useProducts } from '../hooks/queries.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { useFormat } from '../lib/format.js';
import styles from './Boutique.module.css';

export default function Boutique() {
  const { t } = useTranslation();
  const { text } = useFormat();
  const { categorie } = useParams();
  const [params, setParams] = useSearchParams();
  const q = params.get('q')?.trim() || '';

  const categories = useCategories();
  const produits = useProducts();
  const categorieActive = categories.data?.find((c) => c.slug === categorie);

  usePageMeta({
    title: categorieActive ? text(categorieActive.name) : t('shop.title'),
    description: categorieActive ? text(categorieActive.description) || t('shop.seoDescription') : t('shop.seoDescription'),
  });

  const liste = useMemo(() => {
    let resultat = produits.data || [];
    if (categorie) resultat = resultat.filter((p) => p.category?.slug === categorie);
    return filterProducts(resultat, q);
  }, [produits.data, categorie, q]);

  const lienCategorie = (slug) => `/boutique${slug ? `/${slug}` : ''}${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  const categorieInconnue = categorie && categories.isSuccess && !categorieActive;

  return (
    <div className="container page">
      <h1 className="page-title">{categorieActive ? text(categorieActive.name) : t('shop.title')}</h1>

      <nav aria-label={t('shop.categories')} className={styles.puces}>
        <Link to={lienCategorie('')} className="chip" aria-current={!categorie ? 'page' : undefined}>
          {t('shop.all')}
        </Link>
        {categories.data?.map((c) => (
          <Link key={c._id} to={lienCategorie(c.slug)} className="chip" aria-current={c.slug === categorie ? 'page' : undefined}>
            {text(c.name)}
          </Link>
        ))}
      </nav>

      {(q || produits.isSuccess) && (
        <div className={styles.resume}>
          {q && (
            <button
              type="button"
              className="chip"
              aria-pressed="true"
              onClick={() => {
                params.delete('q');
                setParams(params);
              }}
            >
              {t('shop.searchChip', { q })}
              <X size={16} strokeWidth={1.5} aria-hidden="true" />
              <span className="visually-hidden">{t('shop.removeSearch')}</span>
            </button>
          )}
          {produits.isSuccess && !categorieInconnue && (
            <p className="small muted" aria-live="polite">
              {t('shop.count', { count: liste.length })}
            </p>
          )}
        </div>
      )}

      {produits.isError ? (
        <ErrorState onRetry={() => produits.refetch()} />
      ) : categorieInconnue ? (
        <EmptyState title={t('shop.categoryNotFound')} action={t('shop.backToAll')} to="/boutique" />
      ) : produits.isLoading ? (
        <ProductGrid loading skeletons={8} headingLevel={2} />
      ) : liste.length === 0 ? (
        <EmptyState
          title={q ? t('shop.emptySearch', { q }) : t('shop.empty')}
          action={t('shop.backToAll')}
          to="/boutique"
        />
      ) : (
        <ProductGrid products={liste} headingLevel={2} />
      )}
    </div>
  );
}
