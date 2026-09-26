import Cadre from './Cadre.jsx';
import Cerise from './Cerise.jsx';

/** Assiette vide avec une cerise (états vides : panier, recherche sans résultat). Sans fond. */
export default function AssietteVide(props) {
  return (
    <Cadre viewBox="0 0 240 170" fond={false} {...props}>
      <ellipse className="blanc" cx="120" cy="124" rx="96" ry="26" />
      <ellipse className="trait" cx="120" cy="122" rx="60" ry="15" />
      <Cerise cx={138} cy={104} taille={1.6} />
    </Cadre>
  );
}
