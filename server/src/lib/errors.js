export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message || code);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (code, message, details) => new HttpError(400, code, message, details);
export const unauthorized = (message = 'Non authentifié') => new HttpError(401, 'unauthorized', message);
export const forbidden = (message = 'Accès refusé') => new HttpError(403, 'forbidden', message);
export const notFound = (message = 'Introuvable') => new HttpError(404, 'not_found', message);
export const conflict = (code, message) => new HttpError(409, code, message);

/** Enveloppe un handler async pour transmettre les erreurs à Express. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function errorHandler(err, req, res, _next) {
  if (err?.name === 'ZodError') {
    return res.status(400).json({ error: 'validation_error', message: 'Données invalides', details: err.issues });
  }
  if (err?.name === 'CastError') {
    return res.status(404).json({ error: 'not_found', message: 'Introuvable' });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ error: 'duplicate', message: 'Cette valeur existe déjà', details: err.keyValue });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code, message: err.message, details: err.details });
  }
  console.error(err);
  res.status(500).json({ error: 'server_error', message: 'Erreur interne' });
}
