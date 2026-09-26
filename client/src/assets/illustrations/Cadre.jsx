import './illustrations.css';

/**
 * Cadre commun des illustrations.
 * - Sans « titre », l'illustration est décorative (masquée des lecteurs d'écran).
 * - « fond » dessine le fond rose poudré (désactivable pour les états vides).
 */
export default function Cadre({ viewBox, titre, fond = true, className, children }) {
  const [x, y, largeur, hauteur] = viewBox.split(' ');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      className={className ? `illustration ${className}` : 'illustration'}
      role={titre ? 'img' : undefined}
      aria-hidden={titre ? undefined : true}
      focusable="false"
    >
      {titre && <title>{titre}</title>}
      {fond && <rect className="fond" x={x} y={y} width={largeur} height={hauteur} />}
      {children}
    </svg>
  );
}
