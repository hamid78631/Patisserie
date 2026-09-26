import Cadre from './Cadre.jsx';
import Cerise from './Cerise.jsx';

const RX = 130;
const RY = 18;
const f = (n) => Math.round(n * 10) / 10;

// Nappage qui coule sur le bord avant : suit l'ellipse du dessus, avec des gouttes
const GOUTTES = [0.1, 0.23, 0.37, 0.52, 0.66, 0.8, 0.91];
function bordAvant(x) {
  const t = (x - 320) / RX;
  return 170 + RY * Math.sqrt(Math.max(0, 1 - t * t));
}
const nappage = (() => {
  let d = `M190 170 L190 ${f(bordAvant(190) + 8)}`;
  let xPrecedent = 190;
  GOUTTES.forEach((p, i) => {
    const x = 190 + p * 2 * RX;
    const longueur = i % 2 === 0 ? 26 : 16;
    // Remontée jusqu'au bord, puis goutte arrondie
    d += ` Q ${f((xPrecedent + x - 10) / 2)} ${f(bordAvant((xPrecedent + x) / 2) + 2)} ${f(x - 8)} ${f(bordAvant(x) + 6)}`;
    d += ` L ${f(x - 8)} ${f(bordAvant(x) + longueur)} A 8 8 0 0 0 ${f(x + 8)} ${f(bordAvant(x) + longueur)} L ${f(x + 8)} ${f(bordAvant(x) + 6)}`;
    xPrecedent = x + 8;
  });
  d += ` Q ${f((xPrecedent + 450) / 2)} ${f(bordAvant((xPrecedent + 450) / 2) + 2)} 450 ${f(bordAvant(450) + 8)} L450 170 Z`;
  return d;
})();

/** Gâteau entier sur présentoir, surmonté d'une cerise (bannière d'accueil) — cadrage 16:9. */
export default function Accueil(props) {
  return (
    <Cadre viewBox="0 0 640 360" {...props}>
      {/* Présentoir */}
      <ellipse className="blanc" cx="320" cy="334" rx="70" ry="9" />
      <rect className="blanc" x="306" y="300" width="28" height="34" />
      <ellipse className="blanc" cx="320" cy="300" rx="164" ry="20" />
      {/* Gâteau */}
      <path className="blanc" d={`M190 170 L190 286 A${RX} ${RY} 0 0 0 450 286 L450 170 Z`} />
      <path className="rouge" d={`M190 222 A${RX} ${RY} 0 0 0 450 222 L450 238 A${RX} ${RY} 0 0 1 190 238 Z`} />
      <path className="blanc" d={nappage} />
      <ellipse className="blanc" cx="320" cy="170" rx={RX} ry={RY} />
      <Cerise cx={320} cy={150} taille={2} />
    </Cadre>
  );
}
