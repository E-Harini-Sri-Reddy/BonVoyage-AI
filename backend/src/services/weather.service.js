import * as openweatherClient from '../clients/openweather.client.js';
import { normalizeWeatherForTrip } from '../normalizers/weather.normalizer.js';
import { getCached, setCache } from '../utils/cache.js';

const WEATHER_FAIL_MESSAGE = 'No weather data available for this trip.';
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWeatherData(lat, lon) {
  // Try One Call 3.0 first (requires paid subscription)
  try {
    const data = await openweatherClient.getOneCallWeather(lat, lon);
    return { hourly: data.hourly, daily: data.daily };
  } catch (error) {
    const msg = error.response?.data?.message || '';
    const needsFallback =
      error.response?.status === 401 ||
      msg.includes('One Call 3.0') ||
      msg.includes('subscription');

    if (!needsFallback) throw error;
  }

  // Fallback: free-tier 5-day / 3-hour forecast
  const forecast = await openweatherClient.getForecast25(lat, lon);
  return { hourly: openweatherClient.forecast25ToHourly(forecast), daily: [] };
}

export async function fetchWeatherSafe({ lat, lon, fromDate, toDate }) {
  const cacheKey = `weather:${lat},${lon}:${fromDate}:${toDate}`;
  const failKey = `weather-fail:${cacheKey}`;

  const cached = getCached(cacheKey);
  if (cached) return { weather: cached, error: null };

  if (getCached(failKey)) {
    return { weather: [], error: WEATHER_FAIL_MESSAGE };
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const raw = await fetchWeatherData(lat, lon);
      const normalized = normalizeWeatherForTrip(raw, fromDate, toDate);

      if (!normalized.length || normalized.every((d) => !d.periods?.length)) {
        setCache(failKey, true, 600);
        return { weather: [], error: WEATHER_FAIL_MESSAGE };
      }

      setCache(cacheKey, normalized, 1800);
      return { weather: normalized, error: null };
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  setCache(failKey, true, 600);
  return { weather: [], error: WEATHER_FAIL_MESSAGE };
}

export async function getWeatherForTrip(params) {
  const result = await fetchWeatherSafe(params);
  return result.weather;
}
