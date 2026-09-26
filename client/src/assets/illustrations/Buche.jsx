import Cadre from './Cadre.jsx';

// Spirale de la tranche (roulé), aplatie pour suivre l'ellipse de la coupe
const spirale = (() => {
  const points = [];
  for (let i = 0; i <= 90; i += 1) {
    const angle = (i / 90) * 3.4 * Math.PI;
    const rayon = 3 + 12.5 * angle / Math.PI;
    points.push(`${(306 + rayon * Math.cos(angle) * 0.72).toFixed(1)} ${(303 + rayon * Math.sin(angle)).toFixed(1)}`);
  }
  return `M${points.join(' L')}`;
})();

/** Bûche de Noël décorée de houx (Temps des fêtes) — cadrage 4:5. */
export default function Buche(props) {
  return (
    <Cadre viewBox="0 0 400 500" {...props}>
      {/* Planche de service */}
      <rect className="blanc" x="46" y="356" width="308" height="18" rx="9" />
      {/* Corps de la bûche et écorce */}
      <rect className="blanc" x="66" y="248" width="240" height="110" rx="28" />
      <path className="trait" d="M96 282 Q146 272 196 284 T 270 278" />
      <path className="trait" d="M90 318 Q140 328 190 316" />
      <path className="trait" d="M206 336 Q244 328 276 340" />
      {/* Tranche avec la spirale */}
      <ellipse className="blanc" cx="306" cy="303" rx="40" ry="55" />
      <path className="trait" d={spirale} />
      {/* Houx */}
      <path className="bordeaux" d="M176 250 Q146 216 108 230 Q140 266 176 250 Z" />
      <path className="bordeaux" d="M176 250 Q206 214 246 226 Q214 266 176 250 Z" />
      <circle className="rouge" cx="165" cy="243" r="11" />
      <circle className="rouge" cx="187" cy="243" r="11" />
      <circle className="rouge" cx="176" cy="226" r="11" />
    </Cadre>
  );
}
