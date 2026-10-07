export function buildGoogleMapsDirectionsUrl(place) {
  if (!place) return 'https://www.google.com/maps';
  if (place.mapsUrl) return place.mapsUrl;

  const destination =
    place.lat != null && place.lon != null
      ? `${place.lat},${place.lon}`
      : encodeURIComponent(place.address || place.name);

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=transit`;
}
