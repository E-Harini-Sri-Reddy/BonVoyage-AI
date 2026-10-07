import rateLimit from 'express-rate-limit';
import { API_LIMITS } from '../config/constants.js';

export const apiLimiter = rateLimit({
  windowMs: API_LIMITS.windowMs,
  max: API_LIMITS.max,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

export const tripPlanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many trip planning requests. Please wait a moment and try again.',
  },
});
