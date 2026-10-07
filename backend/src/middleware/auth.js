import { verifyToken } from '../utils/jwt.js';
import { getUserById } from '../services/auth.service.js';
import { AppError } from './errorHandler.js';

export async function authenticate(req, res, next) {
  try {
    const token =
      req.cookies?.bonvoyage_token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    const user = await getUserById(decoded.id);

    if (!user) throw new AppError('Session expired. Please log in again.', 401);

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Session expired. Please log in again.', 401));
    }
    next(error);
  }
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  next();
}

export async function optionalAuth(req, res, next) {
  try {
    const token =
      req.cookies?.bonvoyage_token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    const user = await getUserById(decoded.id);
    req.user = user;
    next();
  } catch {
    req.user = null;
    next();
  }
}

export function rejectGuest(req, res, next) {
  if (!req.user) {
    return next(new AppError('Sign in to save data, or continue as guest without saving.', 403));
  }
  next();
}
