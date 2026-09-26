/*
 * Accès à l'API. En développement, VITE_API_URL est vide : les appels passent
 * par le proxy de Vite (/api → http://localhost:4000).
 */
const BASE = `${import.meta.env.VITE_API_URL || ''}/api`;

/** Erreur renvoyée par l'API : { error: 'code', message, details? } */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include', // cookie de session
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'network_error', err.message);
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status, data?.error || 'server_error', data?.message, data?.details);
  }
  return data;
}
