import { haversineKm } from '../utils/dateHelpers.js';
import { buildGoogleMapsDirectionsUrl } from '../utils/locationHelpers.js';

function extractRating(properties) {
  const raw = properties?.datasource?.raw || {};
  return raw.rating || raw.stars || raw.aggregate_rating || null;
}

function getCategoryLabel(categories = []) {
  if (categories.some((c) => c.includes('museum'))) return 'Museum';
  if (categories.some((c) => c.includes('park'))) return 'Park';
  if (categories.some((c) => c.includes('restaurant') || c.includes('cafe'))) return 'Restaurant';
  if (categories.some((c) => c.includes('sights') || c.includes('attraction'))) return 'Landmark';
  return 'Place';
}

function getOpeningHours(properties) {
  const hours = properties?.opening_hours || properties?.datasource?.raw?.opening_hours;
  if (!hours) return null;
  if (typeof hours === 'string') return hours;
  if (hours.weekday_text) return hours.weekday_text.join('; ');
  return null;
}

export function normalizePlaceFeature(feature, destLat, destLon) {
  const { properties } = feature;
  if (!properties?.name) return null;

  const lat = feature.geometry?.coordinates?.[1] ?? properties.lat;
  const lon = feature.geometry?.coordinates?.[0] ?? properties.lon;
  const distance = lat && lon && destLat && destLon
    ? Math.round(haversineKm(destLat, destLon, lat, lon) * 10) / 10
    : null;

  const categories = properties.categories || [];

  return {
    name: properties.name,
    category: getCategoryLabel(categories),
    rating: extractRating(properties) ? parseFloat(extractRating(properties)) : null,
    distance,
    distanceLabel: distance != null ? `${distance} km` : null,
    description: properties.description || properties.formatted || categories.join(', '),
    openingHours: getOpeningHours(properties),
    address: properties.formatted || properties.address_line2 || '',
    lat,
    lon,
    website: properties.website || null,
    imageUrl: properties.image || null,
    mapsUrl: buildGoogleMapsDirectionsUrl({ lat, lon, address: properties.formatted || properties.name, name: properties.name }),
  };
}

export function normalizePlaces(data, destLat, destLon, limit = 12) {
  return (data?.features || [])
    .map((f) => normalizePlaceFeature(f, destLat, destLon))
    .filter(Boolean)
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
    .slice(0, limit);
}

export function splitPlacesAndRestaurants(places) {
  const restaurants = places.filter((p) => p.category === 'Restaurant');
  const attractions = places.filter((p) => p.category !== 'Restaurant');
  return { places: attractions, restaurants: restaurants.slice(0, 6) };
}
