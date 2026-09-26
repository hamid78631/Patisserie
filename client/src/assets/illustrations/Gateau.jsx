import Cadre from './Cadre.jsx';
import Cerise from './Cerise.jsx';

/** Part de gâteau étagé surmontée d'une cerise (catégorie Gâteaux) — cadrage 4:5. */
export default function Gateau(props) {
  return (
    <Cadre viewBox="0 0 400 500" {...props}>
      {/* Assiette */}
      <ellipse className="blanc" cx="210" cy="386" rx="158" ry="24" />
      {/* Face coupée avec les étages */}
      <path className="blanc" d="M92 302 L332 284 L332 372 L92 392 Z" />
      <path className="rouge" d="M92 332 L332 314 L332 328 L92 346 Z" />
      <path className="trait" d="M92 364 L332 346" />
      {/* Dessus de la part */}
      <path className="blanc" d="M92 302 L262 246 Q314 250 332 284 Z" />
      <Cerise cx={250} cy={262} taille={1.3} />
    </Cadre>
  );
}
