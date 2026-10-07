import { resolveLocation } from './geocoding.service.js';
import { fetchWeatherSafe } from './weather.service.js';
import { mergeFlightRecommendations, searchFlightsForTrip } from './flights.service.js';
import { searchHotelsForTrip } from './hotels.service.js';
import { searchPlacesForTrip, attachPlacePhotos } from './places.service.js';
import { buildLocalInfo } from './localInfo.service.js';
import { generateAIContent, mergeLocalInfoTips } from './groq.service.js';
import { assessBudget, resolveBudgetAllocation } from './budget.service.js';
import { AppError } from '../middleware/errorHandler.js';
import { dedupe, getPlanCache, setPlanCache, buildPlanCacheKey } from '../utils/requestDedup.js';
import { expandItineraryToFullTrip, tripDayCount } from '../utils/itinerary.js';

function ensureFullItinerary(result, tripInput) {
  if (!result) return result;
  const expected = tripDayCount(tripInput.fromDate, tripInput.toDate);
  const current = result.itinerary?.length || 0;
  if (current >= expected) return result;

  return {
    ...result,
    itinerary: expandItineraryToFullTrip(result.itinerary || [], tripInput, {
      places: result.places,
      restaurants: result.restaurants,
      hotels: result.hotels,
      destinationCity: result.geocoding?.destination?.city || tripInput.destination,
    }),
  };
}

function ensureBudget(result, tripInput) {
  if (!result) return result;
  return {
    ...result,
    budget: resolveBudgetAllocation(result.budget, tripInput, {
      flights: result.flights,
      hotels: result.hotels,
      activities: result.activities,
    }),
  };
}

function finalizePlan(result, tripInput) {
  return ensureBudget(ensureFullItinerary(result, tripInput), tripInput);
}

export async function aggregateTripPlan(tripInput, options = {}) {
  const { regenerateAIOnly = false } = options;
  const cacheKey = buildPlanCacheKey(tripInput);

  if (regenerateAIOnly) {
    const cached = getPlanCache(cacheKey);
    if (cached) {
      const budgetWarning = cached.budgetWarning || assessBudget(tripInput);
      const aiResult = await generateAIContent(tripInput, cached.geocoding, {
        weather: cached.weather,
        flights: cached.flights,
        hotels: cached.hotels,
        places: cached.places,
        restaurants: cached.restaurants,
        budgetWarning,
      }, { skipCache: false });

      const flights = mergeFlightRecommendations(cached.flights, aiResult.flightRecommendations);
      const result = {
        ...cached,
        budgetWarning,
        weather: aiResult.weather,
        activities: aiResult.activities,
        optimizer: aiResult.optimizer,
        itinerary: aiResult.itinerary,
        budget: resolveBudgetAllocation(aiResult.budget, tripInput, {
          flights,
          hotels: cached.hotels,
          activities: aiResult.activities,
        }),
        packing: aiResult.packing,
        summary: aiResult.summary,
        restaurants: aiResult.restaurants,
        flights,
        localInfo: mergeLocalInfoTips(cached.localInfo, aiResult),
        errors: [...(cached.errors || []).filter((e) => !e.source?.startsWith('ai')), ...(aiResult.aiErrors || [])],
        regenerated: true,
      };
      const full = finalizePlan(result, tripInput);
      setPlanCache(cacheKey, full);
      return full;
    }
  }

  if (!regenerateAIOnly) {
    const cached = getPlanCache(cacheKey);
    if (cached) return finalizePlan(cached, tripInput);
  }

  return dedupe(cacheKey, () => buildFullPlan(tripInput, cacheKey));
}

async function buildFullPlan(tripInput, cacheKey) {
  const errors = [];

  let originGeo;
  let destGeo;

  try {
    [originGeo, destGeo] = await Promise.all([
      resolveLocation(tripInput.origin),
      resolveLocation(tripInput.destination),
    ]);
  } catch (error) {
    throw error instanceof AppError ? error : new AppError(error.message, 400);
  }

  const { lat: destLat, lon: destLon } = destGeo;

  const [weatherResult, flightsResult, hotelsResult, placesResult] = await Promise.all([
    fetchWeatherSafe({ lat: destLat, lon: destLon, fromDate: tripInput.fromDate, toDate: tripInput.toDate }),
    searchFlightsForTrip({
      origin: tripInput.origin,
      destination: tripInput.destination,
      fromDate: tripInput.fromDate,
      toDate: tripInput.toDate,
      travellers: tripInput.travellers,
      currency: tripInput.currency,
      originGeo,
      destGeo,
    }),
    searchHotelsForTrip({
      lat: destLat,
      lon: destLon,
      budget: tripInput.budget,
      fromDate: tripInput.fromDate,
      toDate: tripInput.toDate,
      currency: tripInput.currency,
      tripType: tripInput.tripType,
      travellingWithPets: tripInput.travellingWithPets,
      travellingWithDisabilities: tripInput.travellingWithDisabilities,
      destinationName: destGeo.city || tripInput.destination,
    }),
    searchPlacesForTrip({
      lat: destLat,
      lon: destLon,
      interests: tripInput.interests,
      city: destGeo.city || tripInput.destination,
    }),
  ]);

  if (weatherResult.error) errors.push({ source: 'weather', message: weatherResult.error, severity: 'warning' });
  if (flightsResult.error) {
    errors.push({
      source: 'flights',
      message: flightsResult.subscriptionRequired
        ? 'Flight search unavailable — subscribe to Sky Scrapper on RapidAPI, or use the booking links below.'
        : flightsResult.error,
      severity: 'warning',
    });
  }
  if (hotelsResult.error) errors.push({ source: 'hotels', message: hotelsResult.error, severity: 'warning' });
  if (placesResult.error) errors.push({ source: 'places', message: placesResult.error, severity: 'warning' });

  const apiData = {
    weather: weatherResult.weather,
    flights: flightsResult.flights,
    hotels: hotelsResult.hotels,
    places: placesResult.places,
    restaurants: placesResult.restaurants,
  };

  const geo = { origin: originGeo, destination: destGeo };
  const budgetWarning = assessBudget(tripInput);

  // AI + photo enrichment run in parallel (photos no longer block Groq)
  const [aiSettled, photoSettled] = await Promise.allSettled([
    generateAIContent(tripInput, geo, { ...apiData, budgetWarning }),
    attachPlacePhotos(placesResult),
  ]);

  let aiResult;
  if (aiSettled.status === 'fulfilled') {
    aiResult = aiSettled.value;
  } else {
    aiResult = {
      ...apiData,
      activities: [],
      optimizer: null,
      itinerary: [],
      budget: null,
      packing: [],
      summary: null,
      aiErrors: [{ source: 'ai', message: aiSettled.reason?.message || 'AI failed', severity: 'warning' }],
    };
  }

  const placesWithPhotos =
    photoSettled.status === 'fulfilled' ? photoSettled.value.places : placesResult.places;

  if (aiResult.aiErrors?.length) errors.push(...aiResult.aiErrors);

  const flights = mergeFlightRecommendations(flightsResult.flights, aiResult.flightRecommendations);
  const hotels = hotelsResult.hotels;

  const result = {
    success: true,
    meta: {
      origin: tripInput.origin,
      destination: tripInput.destination,
      fromDate: tripInput.fromDate,
      toDate: tripInput.toDate,
      travellers: tripInput.travellers,
      budget: tripInput.budget,
      currency: tripInput.currency,
      tripType: tripInput.tripType,
      interests: tripInput.interests,
      travellingWithPets: tripInput.travellingWithPets ?? false,
      travellingWithDisabilities: tripInput.travellingWithDisabilities ?? false,
    },
    geocoding: geo,
    weather: aiResult.weather,
    flights,
    hotels,
    activities: aiResult.activities,
    places: placesWithPhotos,
    optimizer: aiResult.optimizer,
    itinerary: aiResult.itinerary,
    budget: resolveBudgetAllocation(aiResult.budget, tripInput, {
      flights,
      hotels,
      activities: aiResult.activities,
    }),
    packing: aiResult.packing,
    summary: aiResult.summary,
    restaurants: aiResult.restaurants,
    localInfo: mergeLocalInfoTips(buildLocalInfo(destGeo, tripInput.currency), aiResult),
    budgetWarning,
    errors,
  };

  const full = finalizePlan(result, tripInput);
  setPlanCache(cacheKey, full);
  return full;
}
