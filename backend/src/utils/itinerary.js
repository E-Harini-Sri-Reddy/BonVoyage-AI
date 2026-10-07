/** Inclusive trip length in calendar days (local date strings YYYY-MM-DD). */
export function tripDayCount(fromDate, toDate) {
  if (!fromDate || !toDate) return 1;
  const from = parseLocalDate(fromDate);
  const to = parseLocalDate(toDate);
  if (Number.isNaN(from) || Number.isNaN(to) || to < from) return 1;
  return Math.round((to - from) / 86400000) + 1;
}

function parseLocalDate(value) {
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

function formatLocalDate(fromDate, offsetDays) {
  const [y, m, d] = String(fromDate).slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d + offsetDays);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

const END_TRIP_RE = /\b(pack(\s+up)?|check-?\s*out|return flight|end trip|depart(ure)?|fly home|airport transfer home)\b/i;

function looksLikeEndDay(day = {}) {
  return END_TRIP_RE.test(
    [day.morning, day.afternoon, day.evening, day.notes].filter(Boolean).join(' ')
  );
}

function pick(list, index, fallback) {
  if (!list?.length) return fallback;
  return list[index % list.length];
}

function buildMidDay(index, total, tripInput, apiData, template) {
  const places = apiData.places || [];
  const restaurants = apiData.restaurants || [];
  const hotel = apiData.hotels?.[0]?.name || 'your hotel';
  const a = pick(places, index, null);
  const b = pick(places, index + 1, null);
  const r = pick(restaurants, index, null);

  const themes = [
    { notes: 'Sightseeing day', morning: a && `Visit ${a.name}`, afternoon: b && `Explore ${b.name}`, evening: r ? `Dinner at ${r.name}` : 'Local dinner' },
    { notes: 'Food & culture', morning: 'Local market stroll', afternoon: r ? `Lunch at ${r.name}` : 'Try local cuisine', evening: a && `Evening near ${a.name}` },
    { notes: 'Relaxation day', morning: `Morning at ${hotel}`, afternoon: a ? `Easy visit to ${a.name}` : 'Spa or pool time', evening: 'Sunset and light dinner' },
    { notes: 'Active day', morning: a && `Morning at ${a.name}`, afternoon: b && `${b.name} + nearby walk`, evening: 'Casual dinner and rest' },
  ];

  const theme = themes[index % themes.length];
  const useTemplate = template && !looksLikeEndDay(template);

  return {
    morning: (useTemplate && template.morning) || theme.morning || 'Explore the area',
    afternoon: (useTemplate && template.afternoon) || theme.afternoon || 'Free time / local lunch',
    evening: (useTemplate && template.evening) || theme.evening || 'Dinner and rest',
    notes: (useTemplate && template.notes) || theme.notes,
  };
}

/**
 * Ensure itinerary covers EVERY calendar day from fromDate through toDate.
 * AI often returns only ~5 days; this expands/fills the rest without ending early.
 */
export function expandItineraryToFullTrip(partialDays = [], tripInput = {}, apiData = {}) {
  const total = tripDayCount(tripInput.fromDate, tripInput.toDate);
  const hotel = apiData.hotels?.[0]?.name || 'your hotel';
  const places = apiData.places || [];
  const origin = tripInput.origin || 'origin';
  const dest = apiData.destinationCity || tripInput.destination || 'destination';

  const sorted = [...(partialDays || [])].sort(
    (a, b) => (Number(a.day) || 0) - (Number(b.day) || 0)
  );

  // Seed content: AI middle days (not arrival/departure-looking)
  const midTemplates = sorted.filter((d, i) => i > 0 && i < sorted.length - 1 && !looksLikeEndDay(d));
  const aiArrival = sorted[0] && !looksLikeEndDay(sorted[0]) ? sorted[0] : null;
  const aiDeparture = sorted.length > 1 && looksLikeEndDay(sorted[sorted.length - 1])
    ? sorted[sorted.length - 1]
    : sorted.length === total
      ? sorted[sorted.length - 1]
      : null;

  const days = [];

  for (let i = 0; i < total; i += 1) {
    const date = formatLocalDate(tripInput.fromDate, i);
    const dayNum = i + 1;

    if (i === 0) {
      days.push({
        day: dayNum,
        date,
        morning: aiArrival?.morning || `Arrive from ${origin} → ${dest}`,
        afternoon: aiArrival?.afternoon || `Check-in at ${hotel}`,
        evening: aiArrival?.evening || (places[0] ? `Light evening near ${places[0].name}` : 'Settle in and rest'),
        notes: aiArrival?.notes || 'Arrival day — keep plans light.',
      });
      continue;
    }

    if (i === total - 1) {
      days.push({
        day: dayNum,
        date,
        morning: aiDeparture?.morning || 'Pack up and final breakfast',
        afternoon: aiDeparture?.afternoon || `Check-out from ${hotel}`,
        evening: aiDeparture?.evening || `Depart ${dest} → ${origin}`,
        notes: aiDeparture?.notes || 'Departure day.',
      });
      continue;
    }

    // Prefer AI day with matching date/day if it's a real mid-day plan
    const byDate = sorted.find((d) => d.date === date && !looksLikeEndDay(d));
    const byIndex = sorted[i] && !looksLikeEndDay(sorted[i]) && i < sorted.length - 1 ? sorted[i] : null;
    const template = byDate || byIndex || midTemplates[(i - 1) % Math.max(midTemplates.length, 1)] || null;
    const mid = buildMidDay(i - 1, total, tripInput, apiData, template);

    days.push({
      day: dayNum,
      date,
      morning: mid.morning,
      afternoon: mid.afternoon,
      evening: mid.evening,
      notes: mid.notes,
    });
  }

  return days;
}
