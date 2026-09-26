/**
 * La cerise du logo, dans le style des illustrations (contour bordeaux).
 * Géométrie identique à celle de scripts/generer-marque.mjs (boîte d'environ 48 × 48).
 * (cx, cy) : centre du fruit ; taille : facteur d'échelle (1 = fruit de 28 unités de diamètre).
 */
export default function Cerise({ cx, cy, taille = 1 }) {
  const tx = cx - 20 * taille;
  const ty = cy - 31 * taille;
  return (
    <g transform={`translate(${tx} ${ty}) scale(${taille})`}>
      <path className="trait" d="M20 19.5 C 21 12.5, 25 8, 31 5" />
      <path className="bordeaux" d="M31 5 C 35 0.8, 41 0.6, 46 4 C 41 8.6, 35 8.8, 31 5 Z" />
      <circle className="rouge" cx="20" cy="31" r="14" />
      <ellipse className="reflet" cx="14.2" cy="25.6" rx="2.4" ry="4.4" transform="rotate(35 14.2 25.6)" />
    </g>
  );
}
