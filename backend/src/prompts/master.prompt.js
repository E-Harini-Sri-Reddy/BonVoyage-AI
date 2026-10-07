import { buildAccessibilityNotes } from './context.js';

function slimWeather(weather = []) {
  return weather.slice(0, 4).map((d) => ({
    date: d.date,
    summary: d.periods?.map((p) => `${p.period}:${p.condition || p.temp || ''}`).join('|'),
  }));
}

/**
 * Compact master Groq prompt — smaller context + shorter output = faster + valid JSON.
 */
export function masterTripPrompt(ctx) {
  const accessibility = buildAccessibilityNotes(ctx).join(' ');
  const dayCount = Math.max(
    1,
    Math.ceil(
      (new Date(ctx.toDate) - new Date(ctx.fromDate)) / (1000 * 60 * 60 * 24)
    ) + 1
  );
  // Ask the model for a seed plan only; code expands to the full trip length.
  const seedDays = Math.min(dayCount, 7);

  return {
    system: `You are BonVoyage AI. Reply with ONE valid JSON object only — no markdown, no comments, no trailing commas.
Keep every string short (under 100 chars). Use only place names from CONTEXT.
CRITICAL: This trip is ${dayCount} days (${ctx.fromDate} to ${ctx.toDate}). Day 1 = arrival. ONLY the last seed day may say pack/checkout/return flight. Never end the trip early.
${accessibility}
${ctx.budgetWarning && !ctx.budgetWarning.sufficient ? `Budget ${ctx.budget} ${ctx.currency} is too low (min ~${ctx.budgetWarning.minimumRecommended}). Say so in summary.budgetNote and prefer free activities.` : ''}`,
    user: `Trip: ${ctx.destinationCity}, ${ctx.destinationCountry || ''} | ${ctx.fromDate}→${ctx.toDate} (${dayCount} days) | ${ctx.travellers} pax | ${ctx.budget} ${ctx.currency} | ${ctx.tripType}
Interests: ${ctx.interests?.join(', ') || 'general'} | From: ${ctx.originCity || ctx.origin}

CONTEXT:
W:${JSON.stringify(slimWeather(ctx.weather))}
F:${JSON.stringify((ctx.flights || []).slice(0, 2).map((f) => ({ airline: f.airline, price: f.price, route: f.route })))}
H:${JSON.stringify((ctx.hotels || []).slice(0, 2).map((h) => ({ name: h.name, price: h.price })))}
P:${JSON.stringify((ctx.places || []).slice(0, 8).map((p) => p.name))}
R:${JSON.stringify((ctx.restaurants || []).slice(0, 4).map((r) => r.name))}

Return exactly this shape (fill real values; budget amounts must sum to ${ctx.budget}):
{
  "weatherInsights": [{"date":"${ctx.fromDate}","period":"Morning","insight":"short"}],
  "activities": [{"title":"","description":"","duration":"2h","estimatedCost":0,"indoor":false,"location":""}],
  "optimizedItinerary": {
    "highlights": ["unique highlight"],
    "decisions": [{"category":"Weather","choice":"","reason":""}],
    "days": [{"day":1,"date":"${ctx.fromDate}","morning":"","afternoon":"","evening":"","notes":""}]
  },
  "flightRecommendations": [{"label":"Best Value","airline":"","route":"","duration":"","stops":0,"reason":""}],
  "budget": {"flights":0,"hotels":0,"food":0,"activities":0,"emergencyBuffer":0,"total":${Number(ctx.budget) || 0}},
  "packing": [{"item":"","reason":"","category":""}],
  "summary": {"text":"","highlights":[],"pace":"Moderate","weatherNote":"","budgetNote":""},
  "restaurants": [{"name":"","description":"one sentence","cuisine":"","rating":null,"distance":"","priceRange":"$$","mealTime":"Dinner"}],
  "travelTips": ["tip"],
  "safetyTips": ["tip"]
}

Limits: 3 weatherInsights, 4 activities, exactly ${seedDays} itinerary seed days (day 1 arrival … day ${seedDays} ${dayCount > seedDays ? 'sample mid-trip day — DO NOT pack/checkout yet' : 'departure'}), 2 flightRecommendations, 2 decisions, 6 packing items, 3 restaurants, 2 travelTips, 2 safetyTips. highlights must be unique. summary.text must mention the full ${dayCount}-day dates.`,
  };
}

/** Smaller repair prompt when Groq rejects JSON */
export function repairTripPrompt(failedRaw, ctx) {
  return {
    system: 'Fix the broken JSON. Return ONE valid JSON object only matching the schema. No markdown.',
    user: `Destination: ${ctx.destinationCity}. Budget total must be ${ctx.budget}.
Broken output:
${String(failedRaw || '').slice(0, 2500)}

Return valid JSON with keys: weatherInsights, activities, optimizedItinerary, flightRecommendations, budget, packing, summary, restaurants, travelTips, safetyTips.`,
  };
}
