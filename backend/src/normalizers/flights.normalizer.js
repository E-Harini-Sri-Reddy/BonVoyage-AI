function parseDurationMinutes(itinerary) {
  if (itinerary?.durationInMinutes) return itinerary.durationInMinutes;
  if (itinerary?.legs?.length) {
    return itinerary.legs.reduce((sum, leg) => sum + (leg.durationInMinutes || 0), 0);
  }
  return null;
}

function formatDuration(minutes) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function getStops(itinerary) {
  const legs = itinerary?.legs || [];
  if (!legs.length) return itinerary?.stopCount ?? 0;
  return Math.max(legs.reduce((sum, leg) => sum + (leg.stopCount ?? 0), 0), legs.length - 1);
}

function getAirline(itinerary) {
  const leg = itinerary?.legs?.[0];
  return (
    leg?.carriers?.marketing?.[0]?.name ||
    leg?.carriers?.operating?.[0]?.name ||
    itinerary?.carriers?.marketing?.[0]?.name ||
    'Unknown Airline'
  );
}

function getRoute(itinerary, origin, destination) {
  const legs = itinerary?.legs || [];
  if (legs.length) {
    const from = legs[0]?.origin?.displayCode || legs[0]?.origin?.name || origin;
    const to = legs[legs.length - 1]?.destination?.displayCode || legs[legs.length - 1]?.destination?.name || destination;
    return `${from} → ${to}`;
  }
  return `${origin} → ${destination}`;
}

function buildFlightLinks(origin, destination, fromDate, returnDate) {
  const googleFlights = `https://www.google.com/travel/flights?q=Flights%20from%20${encodeURIComponent(origin)}%20to%20${encodeURIComponent(destination)}%20on%20${fromDate}${returnDate ? `%20returning%20${returnDate}` : ''}`;
  const skyscanner = `https://www.skyscanner.com/transport/flights/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}/${fromDate.replace(/-/g, '')}/${returnDate ? returnDate.replace(/-/g, '') : ''}/`;
  return { googleFlights, skyscanner };
}

export function normalizeFlights(data, { origin, destination, fromDate, toDate, currency }) {
  const itineraries =
    data?.data?.itineraries ||
    data?.itineraries ||
    data?.data?.flights ||
    [];

  return itineraries
    .map((itinerary) => {
      const priceRaw =
        itinerary?.price?.raw ??
        itinerary?.price?.amount ??
        (parseFloat(String(itinerary?.price?.formatted || '').replace(/[^\d.]/g, '')) || null);

      const durationMin = parseDurationMinutes(itinerary);

      return {
        airline: getAirline(itinerary),
        route: getRoute(itinerary, origin, destination),
        duration: formatDuration(durationMin),
        durationMinutes: durationMin,
        stops: getStops(itinerary),
        price: priceRaw,
        currency,
        links: buildFlightLinks(origin, destination, fromDate, toDate),
      };
    })
    .sort((a, b) => {
      if (a.price == null && b.price == null) return 0;
      if (a.price == null) return 1;
      if (b.price == null) return -1;
      return a.price - b.price;
    })
    .slice(0, 3);
}

export function normalizeAirport(data) {
  const airports =
    data?.data?.airports ||
    data?.data ||
    data?.airports ||
    [];

  const list = Array.isArray(airports) ? airports : [airports].filter(Boolean);
  const airport = list[0];

  if (!airport) return null;

  return {
    skyId: airport.skyId || airport.id,
    entityId: airport.entityId || airport.navigation?.entityId,
    name: airport.name || airport.title,
    code: airport.code || airport.skyId,
  };
}
