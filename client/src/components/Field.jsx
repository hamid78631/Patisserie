/*
 * Champ de formulaire (STYLE.md §7.3) : libellé au-dessus, aide et erreur en dessous.
 */
import { AlertTriangle } from 'lucide-react';

export default function Field({ id, label, help, error, as = 'input', className, ...props }) {
  const Composant = as;
  const decrit = [help && `${id}-aide`, error && `${id}-erreur`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field ${className || ''}`}>
      <label htmlFor={id}>{label}</label>
      <Composant id={id} className="input" aria-invalid={error ? true : undefined} aria-describedby={decrit} {...props} />
      {help && (
        <p id={`${id}-aide`} className="help">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-erreur`} className="field-error">
          <AlertTriangle size={16} strokeWidth={1.5} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
