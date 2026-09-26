/*
 * Image d'un produit : sa photo si elle existe (Cloudinary, chargement différé),
 * sinon l'illustration de sa catégorie (STYLE.md §8).
 */
import { illustrationPour } from '../assets/illustrations/index.js';
import { imageUrl } from '../lib/format.js';

export default function ProductImage({ image, alt = '', categorySlug, isGiftCard, width = 600, className, eager = false }) {
  const url = typeof image === 'string' ? image : image?.url;
  if (url) {
    return (
      <img
        className={className}
        src={imageUrl(url, width)}
        srcSet={`${imageUrl(url, width)} 1x, ${imageUrl(url, width * 2)} 2x`}
        alt={image?.alt || alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    );
  }
  const Illustration = illustrationPour({ slugCategorie: categorySlug, estCarteCadeau: isGiftCard });
  return <Illustration className={className} />;
}
