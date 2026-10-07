import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../.env');
const envExamplePath = path.resolve(__dirname, '../../.env.example');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('\n⚠️  backend/.env NOT FOUND');
  console.error('   Copy backend/.env.example to backend/.env and add your API keys.');
  console.error('   Example: cp backend/.env.example backend/.env\n');
  if (fs.existsSync(envExamplePath)) {
    dotenv.config({ path: envExamplePath });
    console.warn('   Loaded backend/.env.example as fallback — create backend/.env for production.\n');
  }
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

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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
};

export const isDev = env.nodeEnv === 'development';

export function getEnvStatus() {
  return REQUIRED_KEYS.map((key) => ({
    key,
    configured: Boolean(process.env[key] && !process.env[key].includes('your_')),
  }));
}

export function hasRequiredKeys() {
  return getEnvStatus().every((k) => k.configured);
}
