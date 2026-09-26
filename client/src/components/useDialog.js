/*
 * Comportement commun des panneaux (menu mobile, tiroir panier, recherche mobile) :
 * Échap ferme, le focus va dans le panneau puis revient au bouton d'origine,
 * la page derrière ne défile plus.
 */
import { useEffect, useRef } from 'react';

export function useDialog(open, onClose) {
  const panneau = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const precedent = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const cible = panneau.current?.querySelector('[data-autofocus]') || panneau.current?.querySelector('button, a, input');
    cible?.focus();

    const surTouche = (e) => {
      if (e.key === 'Escape') onClose();
      // Garde le focus dans le panneau (Tab / Maj+Tab)
      if (e.key === 'Tab' && panneau.current) {
        const focusables = panneau.current.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0) return;
        const premier = focusables[0];
        const dernier = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === premier) {
          e.preventDefault();
          dernier.focus();
        } else if (!e.shiftKey && document.activeElement === dernier) {
          e.preventDefault();
          premier.focus();
        }
      }
    };
    document.addEventListener('keydown', surTouche);
    return () => {
      document.removeEventListener('keydown', surTouche);
      document.body.style.overflow = overflow;
      if (precedent instanceof HTMLElement) precedent.focus();
    };
  }, [open, onClose]);
  return panneau;
}
