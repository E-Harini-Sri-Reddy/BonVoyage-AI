import { haversineKm } from '../utils/dateHelpers.js';

function extractRating(properties) {
  const raw = properties?.datasource?.raw || properties?.details || {};
  return (
    raw.stars ||
    raw.star_rating ||
    raw.rating ||
    properties?.rank?.confidence ||
    null
  );
}

function estimateNightlyPrice(rating, budget, nights, currency) {
  const baseShare = budget * 0.35 / Math.max(nights, 1);
  const multiplier = rating ? Math.min(rating / 3, 2) : 1;
  return Math.round(baseShare * multiplier);
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return Object.values(value).flat();
  return [String(value)];
}

export function normalizeHotelFeature(feature, { destLat, destLon, budget, nights, currency, tripType, travellingWithPets, travellingWithDisabilities }) {
  try {
    const { properties } = feature;
    if (!properties) return null;

    const lat = feature.geometry?.coordinates?.[1] ?? properties.lat;
    const lon = feature.geometry?.coordinates?.[0] ?? properties.lon;
    const distanceToCentre = lat && lon && destLat && destLon
      ? Math.round(haversineKm(destLat, destLon, lat, lon) * 10) / 10
      : null;

    const rating = extractRating(properties);
    const numericRating = typeof rating === 'number' ? rating : parseFloat(rating) || 3.5;
    const price = estimateNightlyPrice(numericRating, budget, nights, currency);

    const amenities = [];
    amenities.push(...toArray(properties.facilities).slice(0, 5));
    if (properties.wheelchair) amenities.push('Wheelchair accessible');
    if (tripType === 'family' || tripType === 'kids') amenities.push('Family friendly');
    if (travellingWithPets) amenities.push('Pet friendly');
    if (travellingWithDisabilities) amenities.push('Accessible');

    return {
      name: properties.name || properties.address_line1,
      price,
      priceLabel: `${price}/night`,
      currency,
      rating: numericRating,
      address: properties.formatted || properties.address_line2 || properties.address_line1 || '',
      amenities: [...new Set(amenities)].slice(0, 6),
      bookUrl: properties.website || `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(properties.name || '')}`,
      distanceToCentre,
      lat,
      lon,
      familyFriendly: tripType === 'family' || tripType === 'kids',
      petFriendly: travellingWithPets && (properties.dog || properties.dog_allowed || properties.pets),
      accessible: travellingWithDisabilities && (properties.wheelchair || properties.accessible),
    };
  } catch {
    return null;
  }
}

export function rankHotels(hotels, { budget, nights, tripType, travellingWithPets, travellingWithDisabilities }) {
  const nightlyBudget = (budget * 0.4) / Math.max(nights, 1);

  return [...hotels]
    .map((hotel) => {
      const budgetFit = hotel.price <= nightlyBudget
        ? 1
        : Math.max(0, 1 - (hotel.price - nightlyBudget) / nightlyBudget);
      const ratingScore = (hotel.rating || 3) / 5;
      const centreScore = hotel.distanceToCentre != null
        ? Math.max(0, 1 - hotel.distanceToCentre / 15)
        : 0.5;
      const familyScore = tripType === 'family' || tripType === 'kids'
        ? (hotel.familyFriendly ? 1 : 0.3)
        : 0.5;
      const petScore = travellingWithPets ? (hotel.petFriendly ? 1 : 0.2) : 0.5;
      const accessScore = travellingWithDisabilities ? (hotel.accessible ? 1 : 0.2) : 0.5;

      const score =
        budgetFit * 0.3 +
        ratingScore * 0.2 +
        centreScore * 0.15 +
        familyScore * 0.1 +
        petScore * 0.125 +
        accessScore * 0.125;

      return { ...hotel, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

export function normalizeHotels(data, context) {
  const features = data?.features || [];
  const hotels = features
    .map((f) => normalizeHotelFeature(f, context))
    .filter(Boolean);

  return rankHotels(hotels, context);
}
