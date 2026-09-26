/*
 * Grille de produits : 2 colonnes (mobile), 3 (tablette), 4 (ordinateur).
 */
import ProductCard, { ProductCardSkeleton } from './ProductCard.jsx';
import styles from './ProductGrid.module.css';

export default function ProductGrid({ products, loading = false, skeletons = 4, headingLevel }) {
  if (loading) {
    return (
      <ul className={styles.grille} aria-busy="true">
        {Array.from({ length: skeletons }, (_, i) => (
          <li key={i}>
            <ProductCardSkeleton />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className={styles.grille}>
      {products.map((p) => (
        <li key={p._id}>
          <ProductCard product={p} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
