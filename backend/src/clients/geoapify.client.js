import axios from 'axios';
import { env } from '../config/env.js';

const client = axios.create({
  baseURL: 'https://api.geoapify.com/v1',
  timeout: 15000,
});

export async function geocodeSearch(text, options = {}) {
  const { data } = await client.get('/geocode/search', {
    params: {
      text,
      apiKey: env.geoapifyApiKey,
      limit: options.limit ?? 5,
      type: options.type,
      lang: 'en',
    },
  });
  return data;
}

export async function geocodeAutocomplete(text) {
  const { data } = await client.get('/geocode/autocomplete', {
    params: {
      text,
      apiKey: env.geoapifyApiKey,
      limit: 5,
      lang: 'en',
    },
  });
  return data;
}

export async function reverseGeocode(lat, lon) {
  const { data } = await client.get('/geocode/reverse', {
    params: {
      lat,
      lon,
      apiKey: env.geoapifyApiKey,
      lang: 'en',
    },
  });
  return data;
}
