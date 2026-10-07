import { buildAccessibilityNotes } from './context.js';

export function weatherInsightsPrompt(ctx) {
  return {
    system: 'You are a travel weather advisor. Return valid JSON only.',
    user: `Given this trip weather data, write a concise 1-sentence insight for each period explaining how weather affects plans.
Consider trip type: ${ctx.tripType}, pets: ${ctx.travellingWithPets}, disabilities: ${ctx.travellingWithDisabilities}.

Return JSON: { "insights": [{ "date": "YYYY-MM-DD", "period": "Morning|Afternoon|Evening", "insight": "..." }] }

Weather: ${JSON.stringify(ctx.weather)}`,
  };
}

export function activitiesPrompt(ctx) {
  const accessibility = buildAccessibilityNotes(ctx).join(' ');

  return {
    system: `You are a travel planner. Only recommend real places from the provided list. Return valid JSON only.
${accessibility}`,
    user: `Generate exactly 5 personalized activities for a ${ctx.tripType} trip to ${ctx.destinationCity}.
Budget: ${ctx.budget} ${ctx.currency}, ${ctx.travellers} travellers.
Interests: ${ctx.interests.join(', ') || 'general sightseeing'}.
Pets: ${ctx.travellingWithPets}, Disabilities: ${ctx.travellingWithDisabilities}.

Use ONLY these real places as locations (do not invent names):
${JSON.stringify(ctx.places?.slice(0, 15).map((p) => p.name))}

Return JSON: { "activities": [{ "title": "", "description": "", "duration": "", "estimatedCost": 0, "indoor": true, "location": "" }] }`,
  };
}

export function optimizerPrompt(ctx) {
  const accessibility = buildAccessibilityNotes(ctx).join(' ');

  return {
    system: `You are an expert trip optimizer. Balance sightseeing and rest, stay within budget, prefer highly-rated attractions, avoid outdoor activities during rain, suggest indoor alternatives, minimize travel time. ${accessibility} Return valid JSON only.`,
    user: `Optimize this trip to ${ctx.destinationCity} (${ctx.fromDate} to ${ctx.toDate}).
Budget: ${ctx.budget} ${ctx.currency}, ${ctx.travellers} travellers, type: ${ctx.tripType}.
Pets: ${ctx.travellingWithPets}, Disabilities: ${ctx.travellingWithDisabilities}.
Interests: ${ctx.interests.join(', ')}.

Data:
Weather: ${JSON.stringify(ctx.weather?.slice(0, 3))}
Flights: ${JSON.stringify(ctx.flights)}
Hotels: ${JSON.stringify(ctx.hotels?.map((h) => ({ name: h.name, price: h.price, rating: h.rating })))}
Places: ${JSON.stringify(ctx.places?.slice(0, 10).map((p) => p.name))}
Restaurants: ${JSON.stringify(ctx.restaurants?.slice(0, 6).map((r) => r.name))}

Return JSON:
{
  "optimizer": { "decisions": [{ "category": "", "choice": "", "reason": "" }], "highlights": [] },
  "itinerary": [{ "day": 1, "date": "YYYY-MM-DD", "morning": "", "afternoon": "", "evening": "" }],
  "budget": { "flights": 0, "hotels": 0, "food": 0, "activities": 0, "emergencyBuffer": 0, "total": 0 },
  "restaurants": [{ "name": "", "cuisine": "", "rating": null, "distance": "", "priceRange": "", "mealTime": "" }]
}`,
  };
}

export function packingSummaryPrompt(ctx) {
  return {
    system: 'You are a travel packing and summary expert. Return valid JSON only.',
    user: `Create packing list and trip summary for ${ctx.destinationCity} (${ctx.fromDate} to ${ctx.toDate}).
Travellers: ${ctx.travellers}, type: ${ctx.tripType}, budget: ${ctx.budget} ${ctx.currency}.
Pets: ${ctx.travellingWithPets}, Disabilities: ${ctx.travellingWithDisabilities}.
Weather sample: ${JSON.stringify(ctx.weather?.slice(0, 2))}
Activities: ${JSON.stringify(ctx.activities?.map((a) => a.title))}

Return JSON:
{
  "packing": [{ "item": "", "reason": "", "category": "" }],
  "summary": { "text": "", "highlights": [], "pace": "", "weatherNote": "", "budgetNote": "" }
}`,
  };
}
