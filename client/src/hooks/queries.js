/*
 * Données de l'API (TanStack Query) : mises en cache et partagées entre les pages.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';

const CINQ_MINUTES = 5 * 60 * 1000;

/** Réglages publics : ouverture des commandes, minimum, coordonnées, mode de paiement… */
export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => api('/settings'), staleTime: 60 * 1000 });
}

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: () => api('/categories'), staleTime: CINQ_MINUTES });
}

/**
 * Produits disponibles. Sans filtre, la liste complète sert aussi à la recherche
 * (le catalogue est petit : le filtrage se fait dans le navigateur).
 */
export function useProducts({ category, featured, seasonal } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (featured) params.set('featured', 'true');
  if (seasonal) params.set('seasonal', 'true');
  const qs = params.toString();
  return useQuery({
    queryKey: ['products', qs],
    queryFn: () => api(`/products${qs ? `?${qs}` : ''}`),
    staleTime: CINQ_MINUTES,
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => api(`/products/${encodeURIComponent(slug)}`),
    staleTime: CINQ_MINUTES,
    retry: (count, err) => err?.status !== 404 && count < 2,
  });
}

/** Utilisateur connecté (ou null pour un visiteur). */
export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => api('/auth/me'), staleTime: CINQ_MINUTES });
}
