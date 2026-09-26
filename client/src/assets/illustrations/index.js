/*
 * Illustrations de remplacement, utilisées tant qu'un produit n'a pas de photo (STYLE.md §8).
 * Chaque catégorie a son illustration ; un produit sans photo reprend celle de sa catégorie.
 */
import Accueil from './Accueil.jsx';
import AssietteVide from './AssietteVide.jsx';
import Buche from './Buche.jsx';
import CarteCadeau from './CarteCadeau.jsx';
import CeriseSeule from './CeriseSeule.jsx';
import Croissant from './Croissant.jsx';
import Gateau from './Gateau.jsx';
import Macarons from './Macarons.jsx';

export { Accueil, AssietteVide, Buche, CarteCadeau, CeriseSeule, Croissant, Gateau, Macarons };

// Mots-clés recherchés dans le slug de la catégorie (la cliente peut renommer ses catégories)
const CORRESPONDANCES = [
  { motsCles: ['cadeau', 'gift'], illustration: CarteCadeau },
  { motsCles: ['fete', 'noel', 'buche', 'holiday'], illustration: Buche },
  { motsCles: ['macaron', 'mignardise'], illustration: Macarons },
  { motsCles: ['viennoiserie', 'croissant', 'chocolatine', 'brioche'], illustration: Croissant },
  { motsCles: ['gateau', 'tarte', 'cake'], illustration: Gateau },
];

/**
 * Renvoie le composant d'illustration d'un produit ou d'une catégorie.
 * @param {{ slugCategorie?: string, estCarteCadeau?: boolean }} options
 */
export function illustrationPour({ slugCategorie = '', estCarteCadeau = false } = {}) {
  if (estCarteCadeau) return CarteCadeau;
  const slug = slugCategorie.toLowerCase();
  const trouvee = CORRESPONDANCES.find(({ motsCles }) => motsCles.some((m) => slug.includes(m)));
  return trouvee ? trouvee.illustration : CeriseSeule;
}
