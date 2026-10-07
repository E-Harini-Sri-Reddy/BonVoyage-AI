import { env } from '../config/env.js';

const cache = new Map();

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function hasCached(key) {
  const entry = cache.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return false;
  }
  return true;
}

export function setCache(key, value, ttlSeconds = env.cacheTtlSeconds) {
  cache.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}

export function clearCache() {
  cache.clear();
}
