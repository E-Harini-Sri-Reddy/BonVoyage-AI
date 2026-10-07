export const TRIP_TYPES = ['solo', 'couple', 'family', 'friends', 'kids', 'elderly'];

export const INTERESTS = [
  'adventure',
  'nature',
  'food',
  'shopping',
  'museums',
  'nightlife',
  'relaxation',
  'beaches',
  'hiking',
  'photography',
  'history',
];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'AED', 'SGD', 'CHF'];

export const API_LIMITS = {
  windowMs: 15 * 60 * 1000,
  max: 300,
};

export const WEATHER_PERIODS = {
  morning: { start: 6, end: 12, label: 'Morning' },
  afternoon: { start: 12, end: 18, label: 'Afternoon' },
  evening: { start: 18, end: 22, label: 'Evening' },
};

export const PLACE_CATEGORIES = {
  attractions: 'tourism.sights,entertainment.museum,leisure.park,natural.forest',
  restaurants: 'catering.restaurant,catering.cafe,catering.fast_food',
  hotels: 'accommodation.hotel,accommodation.hostel,accommodation.apartment',
};

export const MARKET_BY_CURRENCY = {
  USD: { market: 'en-US', countryCode: 'US' },
  EUR: { market: 'en-GB', countryCode: 'DE' },
  GBP: { market: 'en-GB', countryCode: 'GB' },
  INR: { market: 'en-GB', countryCode: 'IN' },
  AUD: { market: 'en-AU', countryCode: 'AU' },
  CAD: { market: 'en-CA', countryCode: 'CA' },
  JPY: { market: 'en-GB', countryCode: 'JP' },
  AED: { market: 'en-GB', countryCode: 'AE' },
  SGD: { market: 'en-GB', countryCode: 'SG' },
  CHF: { market: 'de-DE', countryCode: 'CH' },
};
