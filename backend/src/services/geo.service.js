import axios from 'axios';
import { getCached, setCache } from '../utils/cache.js';

const COUNTRY_CURRENCY = {
  US: 'USD',
  IN: 'INR',
  GB: 'GBP',
  IE: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  PT: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
  AU: 'AUD',
  CA: 'CAD',
  JP: 'JPY',
  AE: 'AED',
  SG: 'SGD',
  CH: 'CHF',
  NZ: 'AUD',
};

const SUPPORTED = new Set(Object.values(COUNTRY_CURRENCY));

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
}

function isLocalIp(ip = '') {
  return (
    !ip ||
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('::ffff:127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.')
  );
}

async function lookupCountry(ip) {
  const cacheKey = `geo-ip:${ip}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // ipapi.co free tier — no key required for light usage
  const { data } = await axios.get(`https://ipapi.co/${ip}/json/`, {
    timeout: 5000,
    headers: { Accept: 'application/json' },
  });

  const result = {
    countryCode: data?.country_code || null,
    country: data?.country_name || null,
    city: data?.city || null,
  };
  setCache(cacheKey, result, 86400);
  return result;
}

export async function detectCurrencyFromRequest(req) {
  const ip = clientIp(req);

  if (isLocalIp(ip)) {
    // Dev / localhost — default to INR (common for this project) unless Accept-Language hints otherwise
    const lang = String(req.headers['accept-language'] || '').toLowerCase();
    if (lang.includes('en-in') || lang.includes('hi')) {
      return { currency: 'INR', countryCode: 'IN', source: 'locale', ip: 'local' };
    }
    if (lang.includes('en-gb')) {
      return { currency: 'GBP', countryCode: 'GB', source: 'locale', ip: 'local' };
    }
    if (lang.includes('en-us')) {
      return { currency: 'USD', countryCode: 'US', source: 'locale', ip: 'local' };
    }
    return { currency: 'INR', countryCode: 'IN', source: 'local-default', ip: 'local' };
  }

  try {
    const geo = await lookupCountry(ip);
    const currency = COUNTRY_CURRENCY[geo.countryCode] || 'USD';
    return {
      currency: SUPPORTED.has(currency) ? currency : 'USD',
      countryCode: geo.countryCode,
      country: geo.country,
      city: geo.city,
      source: 'ip',
      ip,
    };
  } catch {
    return { currency: 'USD', countryCode: null, source: 'fallback', ip };
  }
}
