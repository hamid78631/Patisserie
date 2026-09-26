import Cadre from './Cadre.jsx';

function Macaron({ cx, y, coques, garniture }) {
  return (
    <g>
      <rect className={coques} x={cx - 88} y={y - 26} width="176" height="26" rx="13" />
      <rect className={garniture} x={cx - 82} y={y - 38} width="164" height="14" rx="7" />
      <path className={coques} d={`M${cx - 90} ${y - 36} C ${cx - 90} ${y - 78}, ${cx + 90} ${y - 78}, ${cx + 90} ${y - 36} Z`} />
    </g>
  );
}

/** Trois macarons empilés (Macarons et mignardises) — cadrage 4:5. */
export default function Macarons(props) {
  return (
    <Cadre viewBox="0 0 400 500" {...props}>
      <ellipse className="blanc" cx="200" cy="388" rx="150" ry="20" />
      <Macaron cx={200} y={386} coques="rouge" garniture="blanc" />
      <Macaron cx={192} y={320} coques="blanc" garniture="rouge" />
      <Macaron cx={206} y={254} coques="rouge" garniture="blanc" />
    </Cadre>
  );
}
