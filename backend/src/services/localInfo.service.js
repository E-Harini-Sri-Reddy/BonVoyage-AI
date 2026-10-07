import {
  getEmergencyInfo,
  PLUG_BY_COUNTRY,
  LANGUAGE_BY_COUNTRY,
  CURRENCY_BY_COUNTRY,
} from '../config/emergencyInfo.js';

export function buildLocalInfo(destination, currency) {
  const countryCode = destination?.countryCode?.toUpperCase();
  const emergencyNumbers = getEmergencyInfo(countryCode);

  return {
    emergencyNumbers,
    country: destination?.country || '',
    countryCode: countryCode || '',
    currency: currency || CURRENCY_BY_COUNTRY[countryCode] || 'USD',
    localCurrency: CURRENCY_BY_COUNTRY[countryCode]
      ? `${CURRENCY_BY_COUNTRY[countryCode]} (${destination?.country || 'local'})`
      : `Check local currency for ${destination?.country || 'destination'}`,
    language: LANGUAGE_BY_COUNTRY[countryCode] || `Local language(s) in ${destination?.country || 'destination'}`,
    timeZone: destination?.timezone || 'Check local time zone before travel',
    powerPlug: PLUG_BY_COUNTRY[countryCode] || 'Type C (230V) — verify before travel',
    transportTips: [
      'Download offline maps and transit apps before arrival',
      'Keep small change for local buses and metro tickets',
      'Validate transport passes where required to avoid fines',
      'Use registered taxis or reputable ride-share apps',
    ],
    safetyTips: [
      'Save emergency numbers offline — see numbers below',
      'Keep digital and paper copies of passport and insurance',
      'Stay aware of surroundings in crowded tourist areas',
      'Share your itinerary with someone you trust',
    ],
  };
}
