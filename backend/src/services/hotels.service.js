import * as geoapifyPlacesClient from '../clients/geoapifyPlaces.client.js';
import { normalizeHotels } from '../normalizers/hotels.normalizer.js';
import { PLACE_CATEGORIES } from '../config/constants.js';
import { getTripNights } from '../utils/dateHelpers.js';
import { getCached, setCache } from '../utils/cache.js';
import { extractErrorMessage } from '../utils/retry.js';

function buildFallbackHotels(destinationName, budget, nights, currency) {
  const nightly = Math.round((budget * 0.35) / Math.max(nights, 1));
  return [
    {
      name: `Hotels in ${destinationName}`,
      price: nightly,
      priceLabel: `from ${nightly}/night`,
      currency,
      rating: 4.0,
      address: destinationName,
      amenities: ['Search on Booking.com'],
      bookUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destinationName)}`,
      distanceToCentre: null,
      isFallback: true,
    },
    {
      name: `Budget stays near ${destinationName}`,
      price: Math.round(nightly * 0.7),
      priceLabel: `from ${Math.round(nightly * 0.7)}/night`,
      currency,
      rating: 3.5,
      address: destinationName,
      amenities: ['Budget friendly'],
      bookUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destinationName)}&nflt=price%3DUSD-min-${Math.round(nightly * 0.5)}-1`,
      distanceToCentre: null,
      isFallback: true,
    },
  ];
}

async function searchWithRadius(lat, lon, radius, limit) {
  return geoapifyPlacesClient.searchPlaces({
    lat,
    lon,
    categories: PLACE_CATEGORIES.hotels,
    radius,
    limit,
  });
}

export async function searchHotelsForTrip({
  lat,
  lon,
  budget,
  fromDate,
  toDate,
  currency,
  tripType,
  travellingWithPets = false,
  travellingWithDisabilities = false,
  destinationName = 'destination',
}) {
  if (!lat || !lon) {
    const nights = getTripNights(fromDate, toDate);
    return {
      hotels: buildFallbackHotels(destinationName, budget, nights, currency),
      error: 'Could not determine coordinates. Showing booking search links.',
      isFallback: true,
    };
  }

  try {
    const nights = getTripNights(fromDate, toDate);
    const cacheKey = `hotels:${lat},${lon}:${budget}:${nights}:${tripType}`;
    const cached = getCached(cacheKey);
    if (cached) return { hotels: cached, error: null };

    const context = {
      destLat: lat,
      destLon: lon,
      budget,
      nights,
      currency,
      tripType,
      travellingWithPets,
      travellingWithDisabilities,
    };

    let data = await searchWithRadius(lat, lon, 10000, 25);
    let hotels = normalizeHotels(data, context);

    // Expand search if few results
    if (hotels.length < 3) {
      data = await searchWithRadius(lat, lon, 25000, 30);
      hotels = normalizeHotels(data, context);
    }

    if (!hotels.length) {
      const fallback = buildFallbackHotels(destinationName, budget, nights, currency);
      setCache(cacheKey, fallback, 600);
      return {
        hotels: fallback,
        error: 'No hotels found nearby. Browse options via booking links.',
        isFallback: true,
      };
    }

    setCache(cacheKey, hotels, 3600);
    return { hotels, error: null };
  } catch (error) {
    const nights = getTripNights(fromDate, toDate);
    return {
      hotels: buildFallbackHotels(destinationName, budget, nights, currency),
      error: extractErrorMessage(error, 'Hotel search failed. Showing booking links.'),
      isFallback: true,
    };
  }
}
