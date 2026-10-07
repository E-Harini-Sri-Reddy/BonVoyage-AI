import axios from 'axios';
import { env } from '../config/env.js';

const client = axios.create({
  baseURL: 'https://api.geoapify.com/v2',
  timeout: 15000,
});

export async function searchPlaces({ lat, lon, categories, radius = 8000, limit = 20 }) {
  const { data } = await client.get('/places', {
    params: {
      categories,
      filter: `circle:${lon},${lat},${radius}`,
      bias: `proximity:${lon},${lat}`,
      limit,
      apiKey: env.geoapifyApiKey,
      lang: 'en',
    },
  });
  return data;
}
