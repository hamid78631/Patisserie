import Cadre from './Cadre.jsx';

// Point d'une courbe de Bézier cubique au paramètre t
function bezier([p0, p1, p2, p3], t) {
  const u = 1 - t;
  return [0, 1].map((i) => u ** 3 * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t ** 3 * p3[i]);
}

const f = (n) => Math.round(n * 10) / 10;
const enTrace = (courbe) => courbe.slice(1).map(([x, y]) => `${x} ${y}`).join(', ');

// Silhouette en croissant de lune, pointes effilées tournées vers le bas.
// Chaque bord est fait de deux courbes (pointe gauche → sommet → pointe droite).
const EXT_GAUCHE = [[88, 318], [66, 236], [120, 176], [200, 176]];
const EXT_DROITE = [[200, 176], [280, 176], [334, 236], [312, 318]];
const INT_DROITE = [[312, 318], [292, 280], [252, 256], [200, 256]];
const INT_GAUCHE = [[200, 256], [148, 256], [108, 280], [88, 318]];
const silhouette =
  `M${EXT_GAUCHE[0]} C ${enTrace(EXT_GAUCHE)} C ${enTrace(EXT_DROITE)} ` +
  `C ${enTrace(INT_DROITE)} C ${enTrace(INT_GAUCHE)} Z`;

// Plis du feuilletage : relient le bord extérieur au bord intérieur, bombés vers les pointes
const PLIS = [
  [EXT_GAUCHE, 0.45, INT_GAUCHE, 0.62, -10],
  [EXT_GAUCHE, 0.8, INT_GAUCHE, 0.18, -6],
  [EXT_DROITE, 0.2, INT_DROITE, 0.82, 6],
  [EXT_DROITE, 0.55, INT_DROITE, 0.38, 10],
].map(([ext, te, int, ti, bombe]) => {
  const [x1, y1] = bezier(ext, te);
  const [x2, y2] = bezier(int, ti);
  return `M${f(x1)} ${f(y1)} Q ${f((x1 + x2) / 2 + bombe)} ${f((y1 + y2) / 2)} ${f(x2)} ${f(y2)}`;
});

/** Croissant sur une assiette avec un petit pot de confiture (Viennoiseries) — cadrage 4:5. */
export default function Croissant(props) {
  return (
    <Cadre viewBox="0 0 400 500" {...props}>
      <ellipse className="blanc" cx="200" cy="326" rx="164" ry="26" />
      <path className="blanc" d={silhouette} />
      {PLIS.map((d) => (
        <path key={d} className="trait" d={d} />
      ))}
      {/* Pot de confiture */}
      <path className="blanc" d="M284 384 L290 412 Q320 422 350 412 L356 384 Z" />
      <ellipse className="rouge" cx="320" cy="384" rx="36" ry="10" />
    </Cadre>
  );
}
