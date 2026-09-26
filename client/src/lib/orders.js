/*
 * Commandes récentes gardées dans le navigateur (numéro + lien de suivi),
 * pour qu'un client invité retrouve facilement sa commande.
 */
const CLE = 'patisserie-commandes';

export function saveRecentOrder(number, token) {
  try {
    const liste = JSON.parse(localStorage.getItem(CLE) || '[]').filter((c) => c.number !== number);
    liste.unshift({ number, token, at: new Date().toISOString() });
    localStorage.setItem(CLE, JSON.stringify(liste.slice(0, 10)));
  } catch {
    /* stockage indisponible */
  }
}

export function trackingPath(number, token) {
  return `/commande/${encodeURIComponent(number)}${token ? `?t=${encodeURIComponent(token)}` : ''}`;
}

/** Code postal canadien : « g1r1p7 » → « G1R 1P7 » ; null si invalide. */
export function normalizePostalCode(value) {
  const brut = String(value || '').toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(brut)) return null;
  return `${brut.slice(0, 3)} ${brut.slice(3)}`;
}
