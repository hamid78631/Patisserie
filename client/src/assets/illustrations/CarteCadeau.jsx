import Cadre from './Cadre.jsx';

/** Carte-cadeau nouée d'un ruban (Cartes-cadeaux) — cadrage 4:5. */
export default function CarteCadeau(props) {
  return (
    <Cadre viewBox="0 0 400 500" {...props}>
      <rect className="blanc" x="60" y="176" width="280" height="184" rx="18" />
      {/* Lignes de texte de la carte */}
      <path className="trait" d="M90 210 L170 210" />
      <path className="trait" d="M90 228 L140 228" />
      {/* Ruban */}
      <rect className="rouge" x="242" y="176" width="22" height="184" />
      <rect className="rouge" x="60" y="264" width="280" height="22" />
      {/* Nœud */}
      <path className="rouge" d="M253 275 L230 318 L240 318 L253 296 Z" />
      <path className="rouge" d="M253 275 L276 318 L266 318 L253 296 Z" />
      <path className="rouge" d="M253 275 C 212 228, 188 268, 253 275 Z" />
      <path className="rouge" d="M253 275 C 294 228, 318 268, 253 275 Z" />
      <circle className="rouge" cx="253" cy="275" r="9" />
    </Cadre>
  );
}
