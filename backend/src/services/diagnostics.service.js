import axios from 'axios';
import { env } from '../config/env.js';

async function test(name, fn) {
  try {
    const result = await fn();
    return { service: name, ok: true, ...result };
  } catch (error) {
    return {
      service: name,
      ok: false,
      error: error.response?.data?.message || error.response?.data?.error?.message || error.message,
    };
  }
}

export async function runApiDiagnostics() {
  return Promise.all([
    test('geoapify', async () => {
      const { data } = await axios.get('https://api.geoapify.com/v1/geocode/search', {
        params: { text: 'Paris', apiKey: env.geoapifyApiKey, limit: 1 },
        timeout: 15000,
      });
      if (!data?.features?.length) throw new Error('No geocoding results');
      return { message: 'Geocoding OK' };
    }),
    test('openweather', async () => {
      const { status, data } = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
        params: { lat: 48.85, lon: 2.35, units: 'metric', appid: env.openweatherApiKey },
        timeout: 15000,
        validateStatus: () => true,
      });
      if (status !== 200) throw new Error(data?.message || `HTTP ${status}`);
      return { message: 'Forecast 2.5 OK (free tier)' };
    }),
    test('rapidapi-flights', async () => {
      const { status, data } = await axios.get('https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport', {
        params: { query: 'JFK' },
        headers: { 'X-RapidAPI-Key': env.rapidApiKey, 'X-RapidAPI-Host': env.rapidApiHost },
        timeout: 20000,
        validateStatus: () => true,
      });
      if (status === 403) throw new Error('Not subscribed to Sky Scrapper — subscribe at rapidapi.com/apiheya/api/sky-scrapper');
      if (status !== 200) throw new Error(data?.message || `HTTP ${status}`);
      return { message: 'Flight search OK' };
    }),
    test('groq', async () => {
      const { status, data } = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        { model: env.groqModel, messages: [{ role: 'user', content: 'OK' }], max_tokens: 5 },
        { headers: { Authorization: `Bearer ${env.groqApiKey}` }, timeout: 20000, validateStatus: () => true }
      );
      if (status === 401) throw new Error('Invalid Groq API key');
      if (status !== 200) throw new Error(data?.error?.message || `HTTP ${status}`);
      return { message: 'Groq AI OK' };
    }),
  ]);
}
