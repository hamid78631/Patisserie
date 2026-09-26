/*
 * Carte produit (STYLE.md §7.4) : image 4:5, catégorie, nom, prix « à partir de ».
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFormat } from '../lib/format.js';
import ProductImage from './ProductImage.jsx';
import styles from './ProductCard.module.css';

export default function ProductCard({ product, headingLevel = 3 }) {
  const { t } = useTranslation();
  const { money, text } = useFormat();
  const Titre = `h${headingLevel}`;
  const badge = product.seasonal?.enabled ? t('common.seasonal') : product.featured ? t('common.featured') : null;
  const prixUnique = product.variants?.length === 1;

  return (
    <article className={styles.carte}>
      <div className={styles.image}>
        <ProductImage
          image={product.images?.[0]}
          alt={text(product.name)}
          categorySlug={product.category?.slug}
          isGiftCard={product.isGiftCard}
          width={400}
        />
        {badge && <span className={styles.badge}>{badge}</span>}
      </div>
      {product.category?.name && <p className={`overline ${styles.categorie}`}>{text(product.category.name)}</p>}
      <Titre className={styles.nom}>
        {/* Le lien couvre toute la carte (voir le CSS) */}
        <Link to={`/produit/${product.slug}`} className={styles.lien}>
          {text(product.name)}
        </Link>
      </Titre>
      <p className="price">{prixUnique ? money(product.fromPrice) : t('common.from', { price: money(product.fromPrice) })}</p>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className={styles.carte} aria-hidden="true">
      <span className={`skeleton ${styles.image}`} />
      <span className="skeleton" style={{ height: 12, width: '40%' }} />
      <span className="skeleton" style={{ height: 20, width: '75%' }} />
      <span className="skeleton" style={{ height: 16, width: '50%' }} />
    </div>
  );
}
