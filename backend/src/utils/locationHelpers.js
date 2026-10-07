/**
 * Extract likely airport search queries from free-text location input.
 * e.g. "John F. Kennedy International Airport, JFK..." → ["JFK", "John F. Kennedy..."]
 */
export function extractAirportCandidates(query) {
  if (!query?.trim()) return [];

  const candidates = [];
  const text = query.trim();

  const parenCode = text.match(/\(([A-Z]{3})\)/);
  if (parenCode) candidates.push(parenCode[1]);

  const iataMatches = text.match(/\b([A-Z]{3})\b/g);
  if (iataMatches) candidates.push(...iataMatches);

  const commaParts = text.split(',').map((p) => p.trim()).filter(Boolean);
  if (commaParts[0]) candidates.push(commaParts[0]);
  if (commaParts[1] && commaParts[1].length <= 20) candidates.push(commaParts[1]);

  const airportKeyword = text.match(/([\w\s]+Airport)/i);
  if (airportKeyword) candidates.push(airportKeyword[1].trim());

  candidates.push(text);

  return [...new Set(candidates.filter(Boolean))];
}

export function buildGoogleMapsDirectionsUrl(place) {
  if (!place) return 'https://www.google.com/maps';
  const destination =
    place.lat != null && place.lon != null
      ? `${place.lat},${place.lon}`
      : encodeURIComponent(place.address || place.name);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=transit`;
}
