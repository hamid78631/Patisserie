/*
 * Panier : stocké dans le navigateur (localStorage « patisserie-cart »).
 * Le navigateur ne garde que des identifiants, des quantités et un aperçu pour l'affichage ;
 * les prix affichés viennent du serveur, qui revalide le panier à chaque changement
 * (POST /api/cart/quote). Un article devenu indisponible est retiré et le client prévenu.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api.js';
import { localize } from '../lib/format.js';
import { useToast } from '../components/Toasts.jsx';

const CLE = 'patisserie-cart';
export const QUANTITE_MAX = 50;
export const MESSAGE_MAX = 200;

const CartContext = createContext(null);

const cleArticle = (productId, variantId, message = '') => `${productId}|${variantId}|${message.trim()}`;

function lirePanier() {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) || '[]');
    if (!Array.isArray(brut)) return [];
    // On ne garde que des articles bien formés (le stockage peut avoir été modifié)
    return brut
      .filter((i) => i && typeof i.productId === 'string' && typeof i.variantId === 'string')
      .map((i) => ({
        ...i,
        quantity: Math.min(QUANTITE_MAX, Math.max(1, Number.parseInt(i.quantity, 10) || 1)),
        message: typeof i.message === 'string' ? i.message.slice(0, MESSAGE_MAX) : '',
        key: cleArticle(i.productId, i.variantId, i.message || ''),
      }));
  } catch {
    return [];
  }
}

function ecrirePanier(items) {
  try {
    localStorage.setItem(CLE, JSON.stringify(items));
  } catch {
    /* stockage indisponible : le panier reste en mémoire le temps de la visite */
  }
}

export function CartProvider({ children }) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [items, setItems] = useState(lirePanier);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lang = i18n.resolvedLanguage === 'en' ? 'en' : 'fr';

  useEffect(() => ecrirePanier(items), [items]);

  // Synchronise les onglets ouverts en même temps
  useEffect(() => {
    const surStockage = (e) => {
      if (e.key === CLE) setItems(lirePanier());
    };
    window.addEventListener('storage', surStockage);
    return () => window.removeEventListener('storage', surStockage);
  }, []);

  // --- Revalidation par le serveur ------------------------------------------
  const payload = items.map(({ productId, variantId, quantity, message }) => ({
    productId,
    variantId,
    quantity,
    ...(message ? { message } : {}),
  }));
  const quote = useQuery({
    queryKey: ['quote', lang, payload],
    queryFn: ({ signal }) => api('/cart/quote', { method: 'POST', body: { locale: lang, items: payload }, signal }),
    enabled: items.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  // Associe chaque article du panier à sa ligne recalculée par le serveur
  const lignes = useMemo(() => {
    const serveur = quote.data && !quote.isPlaceholderData ? [...quote.data.items] : null;
    return items.map((item) => {
      if (!serveur) return { ...item, line: null, unavailable: false };
      const index = serveur.findIndex((l) => String(l.product) === item.productId && String(l.variantId) === item.variantId);
      if (index === -1) return { ...item, line: null, unavailable: true };
      const [line] = serveur.splice(index, 1);
      return { ...item, line, unavailable: false };
    });
  }, [items, quote.data, quote.isPlaceholderData]);

  // Retire les articles devenus indisponibles et prévient le client
  useEffect(() => {
    const indisponibles = lignes.filter((l) => l.unavailable);
    if (indisponibles.length === 0) return;
    setItems((list) => list.filter((i) => !indisponibles.some((x) => x.key === i.key)));
    indisponibles.forEach((i) => toast.show(t('cart.removed', { name: localize(i.snapshot?.name, lang) }), { type: 'error' }));
  }, [lignes, toast, t, lang]);

  // --- Actions -----------------------------------------------------------------
  const addItem = useCallback(({ product, variant, quantity = 1, message = '' }) => {
    const texte = product.allowsMessage ? message.trim().slice(0, MESSAGE_MAX) : '';
    const key = cleArticle(product._id, variant._id, texte);
    setItems((list) => {
      const existant = list.find((i) => i.key === key);
      if (existant) {
        return list.map((i) => (i.key === key ? { ...i, quantity: Math.min(QUANTITE_MAX, i.quantity + quantity) } : i));
      }
      return [
        ...list,
        {
          key,
          productId: product._id,
          variantId: variant._id,
          quantity: Math.min(QUANTITE_MAX, quantity),
          message: texte,
          // Aperçu pour l'affichage seulement : le prix réel est toujours recalculé par le serveur
          snapshot: {
            name: product.name,
            variantLabel: variant.label,
            slug: product.slug,
            image: product.images?.[0]?.url || '',
            categorySlug: product.category?.slug || '',
            isGiftCard: Boolean(product.isGiftCard),
            price: variant.price,
          },
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((key, quantity) => {
    const q = Math.min(QUANTITE_MAX, Math.max(1, quantity));
    setItems((list) => list.map((i) => (i.key === key ? { ...i, quantity: q } : i)));
  }, []);

  const removeItem = useCallback((key) => setItems((list) => list.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  // --- Totaux ----------------------------------------------------------------------
  const serveurAJour = Boolean(quote.data) && !quote.isPlaceholderData && items.length > 0;
  const prixLigne = (l) => (l.line ? l.line.lineTotal : (l.snapshot?.price || 0) * l.quantity);
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = serveurAJour ? quote.data.pricing.subtotal : lignes.reduce((n, l) => n + prixLigne(l), 0);
  // Le minimum de commande ne compte pas les cartes-cadeaux
  const minimumBase = lignes.filter((l) => !l.snapshot?.isGiftCard).reduce((n, l) => n + prixLigne(l), 0);
  const onlyGiftCards = items.length > 0 && items.every((i) => i.snapshot?.isGiftCard);

  const value = {
    items: lignes,
    count,
    subtotal,
    minimumBase,
    onlyGiftCards,
    pricesConfirmed: serveurAJour,
    isQuoting: quote.isFetching,
    lineTotal: prixLigne,
    addItem,
    setQuantity,
    removeItem,
    clear,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
