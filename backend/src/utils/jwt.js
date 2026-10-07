import jwt from 'jsonwebtoken';
import { env, isProd } from '../config/env.js';

export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

/**
 * Cookie settings for Render:
 * - Same-origin (API serves the SPA): SameSite=Lax works.
 * - Split frontend/API hosts: set COOKIE_SAMESITE=none (and use HTTPS).
 */
function cookieOptions() {
  const sameSite = (env.cookieSameSite || 'lax').toLowerCase();
  return {
    httpOnly: true,
    secure: isProd || sameSite === 'none',
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

export function setAuthCookie(res, token) {
  res.cookie('bonvoyage_token', token, cookieOptions());
}

export function clearAuthCookie(res) {
  res.clearCookie('bonvoyage_token', cookieOptions());
}
