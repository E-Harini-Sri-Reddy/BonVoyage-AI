/**
 * API diagnostics — run: node scripts/diagnose-apis.js
 * Tests each external API using keys from backend/.env
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const keys = {
  GEOAPIFY_API_KEY: process.env.GEOAPIFY_API_KEY,
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY,
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
};

function mask(key) {
  if (!key) return '(not set)';
  if (key.length < 8) return '(too short)';
  return `${key.slice(0, 4)}...${key.slice(-4)} (${key.length} chars)`;
}

async function testGeoapify() {
  if (!keys.GEOAPIFY_API_KEY) return { ok: false, error: 'GEOAPIFY_API_KEY not set in .env' };
  try {
    const { data } = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: { text: 'Paris', apiKey: keys.GEOAPIFY_API_KEY, limit: 1 },
      timeout: 15000,
    });
    return { ok: data?.features?.length > 0, error: data?.features?.length ? null : 'No results returned' };
  } catch (e) {
    return { ok: false, error: e.response?.data?.message || e.response?.data?.error || e.message };
  }
}

async function testOpenWeather() {
  if (!keys.OPENWEATHER_API_KEY) return { ok: false, error: 'OPENWEATHER_API_KEY not set in .env' };
  try {
    const { data, status } = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: { lat: 48.85, lon: 2.35, units: 'metric', appid: keys.OPENWEATHER_API_KEY },
      timeout: 15000,
      validateStatus: () => true,
    });
    if (status === 401) return { ok: false, error: data?.message || 'Invalid OpenWeather API key' };
    if (status !== 200) return { ok: false, error: data?.message || `HTTP ${status}` };
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e.response?.data?.message || e.message };
  }
}

async function testRapidApi() {
  if (!keys.RAPIDAPI_KEY) return { ok: false, error: 'RAPIDAPI_KEY not set in .env' };
  try {
    const { data, status } = await axios.get('https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport', {
      params: { query: 'JFK' },
      headers: { 'X-RapidAPI-Key': keys.RAPIDAPI_KEY, 'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com' },
      timeout: 20000,
      validateStatus: () => true,
    });
    if (status === 403 || status === 401) return { ok: false, error: data?.message || 'Unauthorized — subscribe to Sky Scrapper on RapidAPI' };
    if (status !== 200) return { ok: false, error: data?.message || `HTTP ${status}` };
    return { ok: Boolean(data?.data), error: data?.data ? null : 'Empty response' };
  } catch (e) {
    return { ok: false, error: e.response?.data?.message || e.message };
  }
}

async function testGroq() {
  if (!keys.GROQ_API_KEY) return { ok: false, error: 'GROQ_API_KEY not set in .env' };
  try {
    const { data, status } = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      { model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: 'Reply with OK' }], max_tokens: 5 },
      { headers: { Authorization: `Bearer ${keys.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 20000, validateStatus: () => true }
    );
    if (status === 401) return { ok: false, error: 'Invalid Groq API key' };
    if (status !== 200) return { ok: false, error: data?.error?.message || `HTTP ${status}` };
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: e.response?.data?.error?.message || e.message };
  }
}

console.log('\nBonVoyage AI — API Diagnostics\n');
console.log('Env file:', path.resolve(__dirname, '../.env'));
console.log('Keys loaded:');
for (const [name, val] of Object.entries(keys)) {
  console.log(`  ${name}: ${mask(val)}`);
}

const tests = [
  ['Geoapify (Geocoding + Places)', testGeoapify],
  ['OpenWeather (Forecast 2.5 free tier)', testOpenWeather],
  ['Sky Scrapper (RapidAPI Flights)', testRapidApi],
  ['Groq (AI)', testGroq],
];

console.log('\nResults:');
for (const [name, fn] of tests) {
  const result = await fn();
  console.log(`  ${result.ok ? '✓' : '✗'} ${name}${result.error ? ` — ${result.error}` : ''}`);
}
console.log('');
