import * as geoapifyPlacesClient from '../clients/geoapifyPlaces.client.js';
import { normalizePlaces } from '../normalizers/places.normalizer.js';
import { enrichPlacesWithPhotos } from './placePhotos.service.js';
import { PLACE_CATEGORIES } from '../config/constants.js';
import { getCached, setCache } from '../utils/cache.js';
import { withRetry, extractErrorMessage } from '../utils/retry.js';

/**
 * Fast places fetch — no Wikipedia photos (those run in parallel with AI).
 */
export async function searchPlacesForTrip({ lat, lon, interests = [], city = '' }) {
  try {
    const cacheKey = `places-raw:${lat},${lon}:${interests.join(',')}`;
    const cached = getCached(cacheKey);
    if (cached) return { ...cached };

    const [attractionsData, restaurantsData] = await Promise.all([
      withRetry(() =>
        geoapifyPlacesClient.searchPlaces({
          lat,
          lon,
          categories: PLACE_CATEGORIES.attractions,
          radius: 12000,
          limit: 20,
        })
      ),
      withRetry(() =>
        geoapifyPlacesClient.searchPlaces({
          lat,
          lon,
          categories: PLACE_CATEGORIES.restaurants,
          radius: 8000,
          limit: 12,
        })
      ),
    ]);

    const attractions = normalizePlaces(attractionsData, lat, lon, 12);
    const restaurants = normalizePlaces(restaurantsData, lat, lon, 8).map((r) => ({
      ...r,
      category: 'Restaurant',
      cuisine: r.description?.split(',')[0] || 'Local cuisine',
      priceRange: '$$',
      mealTime: 'Any',
    }));

    const result = { places: attractions, restaurants, error: null, city };
    setCache(cacheKey, result, 3600);
    return result;
  } catch (error) {
    return {
      places: [],
      restaurants: [],
      error: extractErrorMessage(error, 'Places search failed.'),
      city,
    };
  }
}

export async function attachPlacePhotos(placesResult) {
  if (!placesResult?.places?.length) return placesResult;
  const city = placesResult.city || '';
  try {
    const places = await enrichPlacesWithPhotos(placesResult.places, city, {
      limit: 6,
      concurrency: 3,
    });
    return { ...placesResult, places };
  } catch {
    return placesResult;
  }
}
