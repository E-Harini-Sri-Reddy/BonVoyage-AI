export function normalizeGeocodeResult(feature) {
  if (!feature?.properties) return null;

  const { properties } = feature;
  return {
    name: properties.formatted || properties.name || properties.city,
    city: properties.city || properties.name,
    country: properties.country,
    countryCode: properties.country_code,
    lat: properties.lat,
    lon: properties.lon,
    timezone: properties.timezone?.name || null,
    type: properties.result_type,
  };
}

export function normalizeGeocodeResults(data) {
  return (data?.features || [])
    .map((feature) => {
      const base = normalizeGeocodeResult(feature);
      if (!base) return null;
      return {
        ...base,
        label: base.name,
        subtitle: [base.city, base.country].filter(Boolean).join(', '),
        placeId: feature.properties?.place_id,
      };
    })
    .filter(Boolean);
}

export function pickBestGeocodeMatch(data, query) {
  const results = normalizeGeocodeResults(data);
  if (!results.length) return null;

  const q = query.trim().toLowerCase();
  const exact = results.find(
    (r) =>
      r.name?.toLowerCase().includes(q) ||
      r.city?.toLowerCase() === q ||
      r.country?.toLowerCase() === q
  );

  return exact || results[0];
}
