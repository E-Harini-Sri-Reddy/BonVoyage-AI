import * as geoapifyClient from '../clients/geoapify.client.js';
import { pickBestGeocodeMatch, normalizeGeocodeResults } from '../normalizers/geocoding.normalizer.js';
import { getCached, setCache } from '../utils/cache.js';
import { withRetry, extractErrorMessage } from '../utils/retry.js';
import { AppError } from '../middleware/errorHandler.js';

export async function resolveLocation(query) {
  const cacheKey = `geocode:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const data = await withRetry(() => geoapifyClient.geocodeSearch(query));
    const match = pickBestGeocodeMatch(data, query);

    if (!match) {
      throw new AppError(`Could not find location: "${query}"`, 400);
    }

    setCache(cacheKey, match, 86400);
    return match;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(extractErrorMessage(error, `Geocoding failed for "${query}"`), 502);
  }
}

export async function searchLocations(query) {
  const cacheKey = `geocode-search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const data = await withRetry(() => geoapifyClient.geocodeAutocomplete(query));
    const results = normalizeGeocodeResults(data);
    setCache(cacheKey, results, 3600);
    return results;
  } catch (error) {
    throw new AppError(extractErrorMessage(error, 'Location search failed'), 502);
  }
}
