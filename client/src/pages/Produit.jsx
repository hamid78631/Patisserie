/*
 * Fiche produit : galerie (60 %) et informations (40 %) sur ordinateur, empilées sur mobile
 * avec la barre « Ajouter au panier » collée en bas. Sections repliables : Ingrédients,
 * Allergènes, Conservation.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronDown, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MESSAGE_MAX, useCart } from '../cart/CartContext.jsx';
import AllergenChips from '../components/AllergenChips.jsx';
import ProductImage from '../components/ProductImage.jsx';
import QuantityStepper from '../components/QuantityStepper.jsx';
import { EmptyState, ErrorState } from '../components/States.jsx';
import { useToast } from '../components/Toasts.jsx';
import { brand } from '../config/brand.js';
import { useProduct } from '../hooks/queries.js';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { useFormat } from '../lib/format.js';
import styles from './Produit.module.css';

export default function Produit() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const produit = useProduct(slug);

  if (produit.isLoading) return <FicheSquelette />;
  if (produit.error?.status === 404) {
    return (
      <div className="container page">
        <EmptyState title={t('product.notFound')} text={t('product.notFoundText')} action={t('product.backToShop')} to="/boutique" headingLevel={1} />
      </div>
    );
  }
  if (produit.isError) {
    return (
      <div className="container page">
        <ErrorState onRetry={() => produit.refetch()} />
      </div>
    );
  }
  // La clé réinitialise les choix (format, quantité, message) quand on change de produit
  return <Fiche key={produit.data._id} product={produit.data} />;
}

function Fiche({ product }) {
  const { t } = useTranslation();
  const { money, text } = useFormat();
  const { addItem, openDrawer } = useCart();
  const toast = useToast();
  const [variantId, setVariantId] = useState(product.variants[0]._id);
  const [quantite, setQuantite] = useState(1);
  const [message, setMessage] = useState('');
  const [photo, setPhoto] = useState(0);

  const variante = product.variants.find((v) => v._id === variantId) || product.variants[0];
  const nom = text(product.name);
  const description = text(product.description);
  const ingredients = text(product.ingredients);
  const images = product.images || [];

  usePageMeta({
    title: nom,
    description: description || t('shop.seoDescription'),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: nom,
      description,
      ...(images[0]?.url ? { image: images.map((i) => i.url) } : {}),
      brand: { '@type': 'Brand', name: brand.name },
      offers: product.variants.map((v) => ({
        '@type': 'Offer',
        name: text(v.label),
        price: (v.price / 100).toFixed(2),
        priceCurrency: 'CAD',
        availability: 'https://schema.org/InStock',
      })),
    },
  });

  const ajouter = (e) => {
    e.preventDefault();
    addItem({ product, variant: variante, quantity: quantite, message });
    toast.show(t('product.added', { name: nom }));
    setMessage('');
    setQuantite(1);
    if (window.matchMedia('(min-width: 1024px)').matches) openDrawer();
  };

  const delai = product.leadTimeHours || 0;
  const texteDelai =
    delai >= 72 ? t('product.leadTimeDays', { days: Math.round(delai / 24) }) : t('product.leadTime', { hours: delai });

  return (
    <div className={`container page ${styles.fiche}`}>
      <div className={styles.galerie}>
        <div className={styles.imagePrincipale}>
          <ProductImage
            image={images[photo]}
            alt={nom}
            categorySlug={product.category?.slug}
            isGiftCard={product.isGiftCard}
            width={900}
            eager
          />
        </div>
        {images.length > 1 && (
          <ul className={styles.miniatures}>
            {images.map((img, i) => (
              <li key={img.url}>
                <button
                  type="button"
                  className={styles.miniature}
                  aria-pressed={i === photo}
                  aria-label={t('product.photo', { index: i + 1, total: images.length })}
                  onClick={() => setPhoto(i)}
                >
                  <ProductImage image={img} width={160} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.infos}>
        {product.category && (
          <Link to={`/boutique/${product.category.slug}`} className={`overline ${styles.categorie}`}>
            {text(product.category.name)}
          </Link>
        )}
        <h1>{nom}</h1>
        <p className={`price ${styles.prix}`}>{money(variante.price)}</p>
        {description && <p className={styles.description}>{description}</p>}

        <form className={styles.formulaire} onSubmit={ajouter}>
          {product.variants.length > 1 && (
            <fieldset className={styles.variantes}>
              <legend>{t('product.variant')}</legend>
              <div className={styles.pastilles}>
                {product.variants.map((v) => (
                  <label key={v._id} className={styles.pastille}>
                    <input type="radio" name="variante" value={v._id} checked={v._id === variante._id} onChange={() => setVariantId(v._id)} />
                    <span>{text(v.label)}</span>
                    <span className={styles.pastillePrix}>{money(v.price)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className={styles.quantite}>
            <span className={styles.etiquette} id="etiquette-quantite">
              {t('common.quantity')}
            </span>
            <QuantityStepper value={quantite} onChange={setQuantite} />
          </div>

          {product.allowsMessage && (
            <div className="field">
              <label htmlFor="message">{t('product.message')}</label>
              <textarea
                id="message"
                className="input"
                rows={2}
                maxLength={MESSAGE_MAX}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                aria-describedby="message-aide"
              />
              <p id="message-aide" className="help" aria-live="polite">
                {t('product.messageHelp', { count: MESSAGE_MAX - message.length })}
              </p>
            </div>
          )}

          {delai > 0 && (
            <p className={styles.delai}>
              <Clock size={20} strokeWidth={1.5} aria-hidden="true" />
              {texteDelai}
            </p>
          )}

          {/* Collé en bas de l'écran sur mobile */}
          <div className={styles.barreAjout} data-barre-action>
            <span className={`price ${styles.prixBarre}`}>{money(variante.price * quantite)}</span>
            <button type="submit" className="btn btn-primary">
              {t('common.addToCart')}
            </button>
          </div>
        </form>

        <div className={styles.sections}>
          <Section titre={t('product.ingredients')}>
            <p>{ingredients || t('product.ingredientsNone')}</p>
          </Section>
          <Section titre={t('product.allergens')} ouvert>
            <AllergenChips allergens={product.allergens} />
            <p className={styles.avertissement}>{t('product.allergensWarning')}</p>
          </Section>
          {!product.isGiftCard && (
            <Section titre={t('product.storage')}>
              <p>{t('product.storageText')}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ titre, ouvert = false, children }) {
  return (
    <details className={styles.section} open={ouvert}>
      <summary>
        <span>{titre}</span>
        <ChevronDown size={20} strokeWidth={1.5} aria-hidden="true" />
      </summary>
      <div className={styles.sectionCorps}>{children}</div>
    </details>
  );
}

function FicheSquelette() {
  return (
    <div className={`container page ${styles.fiche}`} aria-busy="true">
      <span className={`skeleton ${styles.imagePrincipale}`} />
      <div className={styles.infos}>
        <span className="skeleton" style={{ height: 12, width: '30%' }} />
        <span className="skeleton" style={{ height: 40, width: '80%' }} />
        <span className="skeleton" style={{ height: 24, width: '25%' }} />
        <span className="skeleton" style={{ height: 96, width: '100%' }} />
      </div>
    </div>
  );
}
