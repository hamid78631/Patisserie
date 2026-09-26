/*
 * Recherche de produits avec suggestions (vignette, nom, prix « à partir de »).
 * Le catalogue étant petit, le filtrage se fait dans le navigateur.
 * Entrée ouvre /boutique?q=… ; flèches haut/bas pour parcourir les suggestions.
 */
import { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProducts } from '../hooks/queries.js';
import { normalize, useFormat } from '../lib/format.js';
import ProductImage from './ProductImage.jsx';
import styles from './SearchBox.module.css';

/** Produits correspondant à la recherche (nom ou catégorie, FR et EN, sans accents). */
export function filterProducts(products = [], q) {
  const mots = normalize(q).split(/\s+/).filter(Boolean);
  if (mots.length === 0) return products;
  return products.filter((p) => {
    const texte = normalize([p.name?.fr, p.name?.en, p.category?.name?.fr, p.category?.name?.en].join(' '));
    return mots.every((m) => texte.includes(m));
  });
}

export default function SearchBox({ autoFocus = false, onDone, className }) {
  const { t } = useTranslation();
  const { money, text } = useFormat();
  const navigate = useNavigate();
  const id = useId();
  const [q, setQ] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const { data: products } = useProducts();

  const suggestions = useMemo(() => (q.trim() ? filterProducts(products, q).slice(0, 5) : []), [products, q]);
  const afficher = ouvert && q.trim().length > 0;

  const aller = (chemin) => {
    setOuvert(false);
    setQ('');
    setActif(-1);
    navigate(chemin);
    onDone?.();
  };

  const surSoumission = (e) => {
    e.preventDefault();
    if (actif >= 0 && suggestions[actif]) return aller(`/produit/${suggestions[actif].slug}`);
    if (q.trim()) aller(`/boutique?q=${encodeURIComponent(q.trim())}`);
  };

  const surTouche = (e) => {
    // Échap ferme d'abord les suggestions (sans fermer le panneau de recherche mobile)
    if (e.key === 'Escape' && afficher) {
      e.stopPropagation();
      setOuvert(false);
      return;
    }
    if (!afficher || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActif((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActif((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    }
  };

  return (
    <form role="search" className={`${styles.recherche} ${className || ''}`} onSubmit={surSoumission}>
      <label htmlFor={`${id}-q`} className="visually-hidden">
        {t('search.label')}
      </label>
      <Search className={styles.icone} size={20} strokeWidth={1.5} aria-hidden="true" />
      <input
        id={`${id}-q`}
        type="search"
        className={styles.champ}
        placeholder={t('search.placeholder')}
        value={q}
        autoComplete="off"
        autoFocus={autoFocus}
        data-autofocus={autoFocus || undefined}
        role="combobox"
        aria-expanded={afficher}
        aria-controls={`${id}-liste`}
        aria-autocomplete="list"
        aria-activedescendant={actif >= 0 ? `${id}-option-${actif}` : undefined}
        onChange={(e) => {
          setQ(e.target.value);
          setOuvert(true);
          setActif(-1);
        }}
        onFocus={() => setOuvert(true)}
        onBlur={() => setTimeout(() => setOuvert(false), 150)}
        onKeyDown={surTouche}
      />
      {afficher && (
        <div className={styles.menu}>
          <ul id={`${id}-liste`} role="listbox" aria-label={t('search.label')}>
            {suggestions.map((p, i) => (
              <li
                key={p._id}
                id={`${id}-option-${i}`}
                role="option"
                aria-selected={i === actif}
                className={styles.option}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => aller(`/produit/${p.slug}`)}
              >
                <span className={styles.vignette}>
                  <ProductImage image={p.images?.[0]} categorySlug={p.category?.slug} isGiftCard={p.isGiftCard} width={96} />
                </span>
                <span className={styles.nom}>{text(p.name)}</span>
                <span className={`price ${styles.prix}`}>{t('common.from', { price: money(p.fromPrice) })}</span>
              </li>
            ))}
          </ul>
          {suggestions.length === 0 ? (
            <p className={styles.vide}>{t('search.noResults', { q: q.trim() })}</p>
          ) : (
            <button type="submit" className={`btn btn-ghost ${styles.tout}`} onMouseDown={(e) => e.preventDefault()}>
              {t('search.seeAll')}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
