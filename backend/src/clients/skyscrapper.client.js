import axios from 'axios';
import { env } from '../config/env.js';

const client = axios.create({
  baseURL: `https://${env.rapidApiHost}`,
  timeout: 30000,
  headers: {
    'X-RapidAPI-Key': env.rapidApiKey,
    'X-RapidAPI-Host': env.rapidApiHost,
  },
});

export async function searchAirport(query) {
  const { data } = await client.get('/api/v1/flights/searchAirport', {
    params: { query },
  });
  return data;
}

export async function searchFlights(params) {
  const { data } = await client.get('/api/v1/flights/searchFlights', {
    params,
  });
  return data;
}

export async function searchHotels(params) {
  const { data } = await client.get('/api/v1/hotels/searchHotels', {
    params,
  });
  return data;
}

export async function getConfig() {
  const { data } = await client.get('/api/v1/getConfig');
  return data;
}
