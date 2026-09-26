import Cadre from './Cadre.jsx';
import Cerise from './Cerise.jsx';

/** Illustration par défaut (catégorie inconnue) : la cerise de la marque — cadrage 4:5. */
export default function CeriseSeule(props) {
  return (
    <Cadre viewBox="0 0 400 500" {...props}>
      <Cerise cx={196} cy={282} taille={3.4} />
    </Cadre>
  );
}
