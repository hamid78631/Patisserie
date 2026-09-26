import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/index.js';
import { forbidden, unauthorized } from '../lib/errors.js';

const COOKIE = 'session';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

export function setSession(res, user) {
  const token = jwt.sign({ sub: String(user._id), role: user.role, email: user.email }, config.jwtSecret, {
    expiresIn: '30d',
  });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: config.cookieSameSite,
    maxAge: MAX_AGE_MS,
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { httpOnly: true, secure: config.isProd, sameSite: config.cookieSameSite });
}

/** Lit la session si elle existe (ne bloque jamais). */
export function loadUser(req, _res, next) {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.user = { id: payload.sub, role: payload.role, email: payload.email };
    } catch {
      /* jeton expiré ou invalide : visiteur anonyme */
    }
  }
  next();
}

export function requireUser(req, _res, next) {
  if (!req.user) return next(unauthorized());
  next();
}

/**
 * Accès admin : le rôle est relu en base à chaque requête (et non dans le jeton),
 * pour qu'une administratrice retirée perde l'accès immédiatement.
 */
export async function requireAdmin(req, _res, next) {
  if (!req.user) return next(unauthorized());
  try {
    const user = await User.findById(req.user.id).select('role email').lean();
    if (!user) return next(unauthorized());
    if (user.role !== 'admin') return next(forbidden());
    req.user.role = user.role;
    req.user.email = user.email;
    next();
  } catch (err) {
    next(err);
  }
}
