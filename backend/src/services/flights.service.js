import * as skyscrapperClient from '../clients/skyscrapper.client.js';
import * as geoapifyClient from '../clients/geoapify.client.js';
import { normalizeFlights, normalizeAirport } from '../normalizers/flights.normalizer.js';
import { pickBestGeocodeMatch } from '../normalizers/geocoding.normalizer.js';
import { MARKET_BY_CURRENCY } from '../config/constants.js';
import { getCached, setCache } from '../utils/cache.js';
import { extractErrorMessage } from '../utils/retry.js';
import { extractAirportCandidates } from '../utils/locationHelpers.js';
import { lookupIataCode } from '../data/airportCodes.js';

const SKY_QUOTA_CACHE_KEY = 'sky-scrapper:quota-exceeded';

function isSkyQuotaError(error) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || '';
  return status === 429 || /quota|too many requests/i.test(message);
}

function resolveAirportLocal(query) {
  const code = lookupIataCode(query);
  if (!code) return null;
  return { code, skyId: code, entityId: null, name: code, isLocal: true };
}

async function resolveAirportViaSky(query) {
  if (getCached(SKY_QUOTA_CACHE_KEY)) return null;
  try {
    const data = await skyscrapperClient.searchAirport(query);
    return normalizeAirport(data);
  } catch (error) {
    if (isSkyQuotaError(error)) {
      setCache(SKY_QUOTA_CACHE_KEY, true, 7 * 86400);
    }
    return null;
  }
}

async function resolveAirportViaGeoapify(query) {
  try {
    const data = await geoapifyClient.geocodeSearch(query, { limit: 3 });
    const match = pickBestGeocodeMatch(data, query);
    if (!match) return null;
    return resolveAirportViaSky(match.city || match.name || query);
  } catch {
    return null;
  }
}

async function resolveAirport(query) {
  const cacheKey = `airport:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const candidates = extractAirportCandidates(query);

  for (const candidate of candidates) {
    let airport = await resolveAirportViaSky(candidate);
    if (!airport?.skyId) {
      airport = await resolveAirportViaGeoapify(candidate);
    }
    if (!airport?.skyId) {
      airport = resolveAirportLocal(candidate);
    }
    if (airport?.skyId) {
      setCache(cacheKey, airport, 86400);
      return airport;
    }
  }

  return resolveAirportLocal(query);
}

function buildFlightLinks(origin, destination, fromDate, toDate) {
  const googleFlights = `https://www.google.com/travel/flights?q=Flights%20from%20${encodeURIComponent(origin)}%20to%20${encodeURIComponent(destination)}%20on%20${fromDate}`;
  const skyscanner = `https://www.skyscanner.com/transport/flights/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}/${fromDate.replace(/-/g, '')}/${toDate.replace(/-/g, '')}/`;
  return { googleFlights, skyscanner };
}

function buildFallbackFlights(origin, destination, fromDate, toDate, currency, originCode, destCode) {
  const links = buildFlightLinks(originCode || origin, destCode || destination, fromDate, toDate);
  const route = `${originCode || origin} → ${destCode || destination}`;

  return [
    {
      label: 'Best Value',
      airline: 'Economy — fewest stops',
      route,
      duration: 'Varies',
      stops: 0,
      price: null,
      currency,
      recommendation: 'AI pick: compare morning departures for lower fares on this route.',
      isFallback: true,
      links,
    },
    {
      label: 'Fastest',
      airline: 'Shortest travel time',
      route,
      duration: 'Varies',
      stops: 1,
      price: null,
      currency,
      recommendation: 'AI pick: one-stop flights often save 3–5 hours vs. cheapest options.',
      isFallback: true,
      links,
    },
    {
      label: 'Most Convenient',
      airline: 'Best schedule fit',
      route,
      duration: 'Varies',
      stops: 1,
      price: null,
      currency,
      recommendation: 'AI pick: afternoon arrivals let you check in and start exploring the same day.',
      isFallback: true,
      links,
    },
  ];
}

export function mergeFlightRecommendations(apiFlights, aiFlights = []) {
  if (apiFlights?.length >= 3) return apiFlights.slice(0, 3);

  const merged = [...(apiFlights || [])];

  for (const ai of aiFlights) {
    if (merged.length >= 3) break;
    const exists = merged.some(
      (f) => f.airline === ai.airline && f.route === ai.route
    );
    if (!exists) {
      merged.push({
        label: ai.label || 'AI Recommended',
        airline: ai.airline || 'Recommended flight',
        route: ai.route,
        duration: ai.duration || '—',
        stops: ai.stops ?? 1,
        price: ai.price ?? null,
        currency: ai.currency,
        recommendation: ai.reason || ai.recommendation,
        links: ai.links,
        isFallback: !ai.price,
      });
    }
  }

  return merged.slice(0, 3);
}

export async function searchFlightsForTrip({
  origin,
  destination,
  fromDate,
  toDate,
  travellers,
  currency = 'USD',
  originGeo,
  destGeo,
}) {
  try {
    const [originAirport, destAirport] = await Promise.all([
      resolveAirport(origin),
      resolveAirport(destination),
    ]);

    const originCode = originAirport?.code || lookupIataCode(origin) || originGeo?.city || origin;
    const destCode = destAirport?.code || lookupIataCode(destination) || destGeo?.city || destination;

    const quotaExceeded = Boolean(getCached(SKY_QUOTA_CACHE_KEY));
    const canSearchLive =
      originAirport?.entityId &&
      destAirport?.entityId &&
      !originAirport?.isLocal &&
      !destAirport?.isLocal &&
      !quotaExceeded;

    if (!canSearchLive) {
      return {
        flights: buildFallbackFlights(origin, destination, fromDate, toDate, currency, originCode, destCode),
        error: quotaExceeded
          ? 'RapidAPI Sky Scrapper monthly quota reached on the free tier. Booking links below use the best airport match — live prices return when your quota resets or you upgrade.'
          : 'Live flight prices unavailable. Use the booking links to compare options.',
        isFallback: true,
        quotaExceeded,
      };
    }

    const market = MARKET_BY_CURRENCY[currency] || MARKET_BY_CURRENCY.USD;
    const cacheKey = `flights:${originAirport.skyId}:${destAirport.skyId}:${fromDate}:${toDate}:${travellers}:${currency}`;
    const cached = getCached(cacheKey);
    if (cached) return { flights: cached, error: null };

    const data = await skyscrapperClient.searchFlights({
      originSkyId: originAirport.skyId,
      destinationSkyId: destAirport.skyId,
      originEntityId: originAirport.entityId,
      destinationEntityId: destAirport.entityId,
      date: fromDate,
      returnDate: toDate,
      adults: travellers,
      currency,
      sortBy: 'cheapest',
      limit: 10,
      market: market.market,
      countryCode: market.countryCode,
    });

    const flights = normalizeFlights(data, {
      origin: originAirport.code || originCode,
      destination: destAirport.code || destCode,
      fromDate,
      toDate,
      currency,
    });

    if (!flights.length) {
      return {
        flights: buildFallbackFlights(origin, destination, fromDate, toDate, currency, originCode, destCode),
        error: 'No live flights found. Use booking links to search.',
        isFallback: true,
      };
    }

    setCache(cacheKey, flights, 1800);
    return { flights, error: null };
  } catch (error) {
    if (isSkyQuotaError(error)) {
      setCache(SKY_QUOTA_CACHE_KEY, true, 7 * 86400);
    }
    const subscriptionRequired = error.response?.status === 403;
    const originCode = lookupIataCode(origin) || origin;
    const destCode = lookupIataCode(destination) || destination;
    return {
      flights: buildFallbackFlights(origin, destination, fromDate, toDate, currency, originCode, destCode),
      error: isSkyQuotaError(error)
        ? 'RapidAPI Sky Scrapper monthly quota reached on the free tier. Use the booking links below.'
        : subscriptionRequired
          ? 'Sky Scrapper not subscribed — showing booking links instead.'
          : extractErrorMessage(error, 'Flight search unavailable.'),
      subscriptionRequired,
      isFallback: true,
      quotaExceeded: isSkyQuotaError(error),
    };
  }
}
