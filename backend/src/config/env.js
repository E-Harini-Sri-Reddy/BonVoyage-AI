import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');

// Local .env only — on Render, vars come from the dashboard (process.env).
// Never load .env.example in production (it would overwrite real secrets with placeholders).
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (process.env.NODE_ENV !== 'production') {
  console.warn('\n⚠️  backend/.env NOT FOUND — using process.env / defaults for local dev.\n');
}

const REQUIRED_KEYS = [
  'GROQ_API_KEY',
  'OPENWEATHER_API_KEY',
  'GEOAPIFY_API_KEY',
  'RAPIDAPI_KEY',
];

function requireEnv(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (!value || value.includes('your_') || value.includes('_here')) {
    console.warn(`[env] Warning: ${name} is not configured`);
  }
  return value ?? fallback;
}

function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  /** Comma-separated list of allowed frontend origins */
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN || 'http://localhost:5173'),
  /** Public site URL (used for cookies / links). Defaults to first CORS origin. */
  clientUrl: process.env.CLIENT_URL || process.env.CORS_ORIGIN?.split(',')[0]?.trim() || 'http://localhost:5173',
  groqApiKey: requireEnv('GROQ_API_KEY', ''),
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  openweatherApiKey: requireEnv('OPENWEATHER_API_KEY', ''),
  geoapifyApiKey: requireEnv('GEOAPIFY_API_KEY', ''),
  rapidApiKey: requireEnv('RAPIDAPI_KEY', ''),
  rapidApiHost: process.env.RAPIDAPI_HOST || 'sky-scrapper.p.rapidapi.com',
  cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10),
  mongodbUri: (process.env.MONGODB_URI || '').trim(),
  mongodbDbName: process.env.MONGODB_DB_NAME || 'bonvoyage',
  jwtSecret: process.env.JWT_SECRET || 'bonvoyage-dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  /** Override cookie SameSite: lax | none | strict */
  cookieSameSite: process.env.COOKIE_SAMESITE || '',
};

export const isDev = env.nodeEnv === 'development';
export const isProd = env.nodeEnv === 'production';

export function getEnvStatus() {
  return REQUIRED_KEYS.map((key) => ({
    key,
    configured: Boolean(process.env[key] && !process.env[key].includes('your_')),
  }));
}

export function hasRequiredKeys() {
  return getEnvStatus().every((k) => k.configured);
}
