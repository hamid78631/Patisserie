/*
 * Lignes du panier (tiroir et page Panier) : vignette 64 px, nom, format,
 * message personnalisé en italique, quantité « – 1 + », prix, suppression.
 */
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../cart/CartContext.jsx';
import { useFormat } from '../lib/format.js';
import ProductImage from './ProductImage.jsx';
import QuantityStepper from './QuantityStepper.jsx';
import styles from './CartLines.module.css';

export default function CartLines({ onNavigate }) {
  const { t } = useTranslation();
  const { money, text } = useFormat();
  const { items, setQuantity, removeItem, lineTotal } = useCart();

  return (
    <ul className={styles.lignes}>
      {items.map((item) => {
        const s = item.snapshot || {};
        const nom = text(item.line?.productName || s.name);
        const format = text(item.line?.variantLabel || s.variantLabel);
        return (
          <li key={item.key} className={styles.ligne}>
            <Link to={`/produit/${s.slug}`} className={styles.vignette} onClick={onNavigate} tabIndex={-1} aria-hidden="true">
              <ProductImage image={s.image} categorySlug={s.categorySlug} isGiftCard={s.isGiftCard} width={128} />
            </Link>
            <div className={styles.infos}>
              <Link to={`/produit/${s.slug}`} className={styles.nom} onClick={onNavigate}>
                {nom}
              </Link>
              <p className={styles.format}>{format}</p>
              {item.message && <p className={styles.message}>{t('cart.message', { message: item.message })}</p>}
              <div className={styles.actions}>
                <QuantityStepper compact value={item.quantity} onChange={(q) => setQuantity(item.key, q)} label={`${t('common.quantity')} : ${nom}`} />
                <button type="button" className="icon-btn" onClick={() => removeItem(item.key)} aria-label={t('cart.remove', { name: nom })}>
                  <Trash2 size={20} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            </div>
            <p className={`price ${styles.prix}`}>{money(lineTotal(item))}</p>
          </li>
        );
      })}
    </ul>
  );
}
