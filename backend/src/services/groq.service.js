import { chatCompletion, parseJsonResponse, isGroqRateLimited } from '../clients/groq.client.js';
import { env } from '../config/env.js';
import { buildTripContext } from '../prompts/context.js';
import { masterTripPrompt, repairTripPrompt } from '../prompts/master.prompt.js';
import { getCached, setCache } from '../utils/cache.js';
import { expandItineraryToFullTrip, tripDayCount } from '../utils/itinerary.js';
import crypto from 'crypto';

function isGroqConfigured() {
  return Boolean(env.groqApiKey && env.groqApiKey !== 'your_groq_api_key_here');
}

function buildAICacheKey(tripInput, geo) {
  const raw = JSON.stringify({
    o: tripInput.origin,
    d: tripInput.destination,
    from: tripInput.fromDate,
    to: tripInput.toDate,
    budget: tripInput.budget,
    type: tripInput.tripType,
    interests: tripInput.interests,
    pets: tripInput.travellingWithPets,
    disabilities: tripInput.travellingWithDisabilities,
    dest: geo?.destination?.lat,
    v: 3,
  });
  return `ai-master:${crypto.createHash('md5').update(raw).digest('hex')}`;
}

function finalizeItinerary(itinerary, tripInput, apiData, geo) {
  const enrichedApi = {
    ...apiData,
    destinationCity: geo?.destination?.city || tripInput.destination,
  };
  return expandItineraryToFullTrip(itinerary || [], tripInput, enrichedApi);
}

function mergeWeatherInsights(weather, insights) {
  if (!weather?.length || !insights?.length) return weather;
  const map = new Map(
    insights.map((i) => [`${i.date}-${i.period?.toLowerCase()}`, i.insight])
  );
  return weather.map((day) => ({
    ...day,
    periods: day.periods.map((p) => ({
      ...p,
      aiInsight: map.get(`${day.date}-${p.period.toLowerCase()}`) || p.aiInsight,
    })),
  }));
}

function mergeLocalInfoTips(localInfo, aiResult) {
  if (!localInfo) return localInfo;
  return {
    ...localInfo,
    transportTips: [
      ...(localInfo.transportTips || []),
      ...(aiResult.travelTips || []).slice(0, 3),
    ].slice(0, 6),
    safetyTips: [
      ...(localInfo.safetyTips || []),
      ...(aiResult.safetyTips || []).slice(0, 3),
    ].slice(0, 6),
  };
}

function mergeRestaurantDescriptions(apiRestaurants, aiRestaurants) {
  if (!aiRestaurants?.length) {
    return (apiRestaurants || []).map((r) => ({
      ...r,
      description: r.description || `Popular ${r.cuisine || 'local'} dining spot near your itinerary.`,
    }));
  }

  const apiByName = new Map((apiRestaurants || []).map((r) => [r.name?.toLowerCase(), r]));

  return aiRestaurants.map((ai) => {
    const match = apiByName.get(ai.name?.toLowerCase());
    return {
      ...(match || {}),
      ...ai,
      description: ai.description || match?.description || `Recommended ${ai.cuisine || 'local'} restaurant.`,
      category: 'Restaurant',
      rating: ai.rating ?? match?.rating ?? null,
    };
  });
}

function uniqueStrings(list = []) {
  return [...new Set(list.filter(Boolean))];
}

function buildFallbackFromPlaces(tripInput, apiData, geo) {
  const places = apiData.places || [];
  const activities = places.slice(0, 4).map((p) => ({
    title: `Visit ${p.name}`,
    description: p.description || `Explore ${p.name}, a popular ${p.category || 'attraction'}.`,
    duration: '2h',
    estimatedCost: 0,
    indoor: /museum|indoor/i.test(p.category || ''),
    location: p.name,
  }));

  const total = tripDayCount(tripInput.fromDate, tripInput.toDate);

  return {
    activities,
    optimizer: {
      highlights: uniqueStrings(places.slice(0, 4).map((p) => p.name)),
      decisions: [
        {
          category: 'Pacing',
          choice: `${total}-day balanced plan`,
          reason: 'Full trip dates covered with arrival, sightseeing, and departure days.',
        },
      ],
    },
    itinerary: finalizeItinerary([], tripInput, apiData, geo),
  };
}

async function callGroqForTrip(ctx) {
  const prompt = masterTripPrompt(ctx);
  try {
    const raw = await chatCompletion({
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: 0.3,
      maxTokens: 4096,
    });
    return parseJsonResponse(raw);
  } catch (error) {
    // Salvage truncated JSON from Groq's failed_generation, then one repair retry
    if (error.failedGeneration) {
      try {
        return parseJsonResponse(error.failedGeneration);
      } catch {
        // continue to repair
      }

      try {
        const repair = repairTripPrompt(error.failedGeneration, ctx);
        const repaired = await chatCompletion({
          messages: [
            { role: 'system', content: repair.system },
            { role: 'user', content: repair.user },
          ],
          temperature: 0.1,
          maxTokens: 4096,
        });
        return parseJsonResponse(repaired);
      } catch {
        // fall through
      }
    }
    throw error;
  }
}

export async function generateAIContent(tripInput, geo, apiData, { skipCache = false } = {}) {
  if (!isGroqConfigured()) {
    return buildEmptyAI(apiData, 'Groq API key not configured.');
  }

  const cacheKey = buildAICacheKey(tripInput, geo);
  if (!skipCache) {
    const cached = getCached(cacheKey);
    if (cached) {
      return {
        ...cached,
        itinerary: finalizeItinerary(cached.itinerary, tripInput, apiData, geo),
        weather: mergeWeatherInsights(apiData.weather, cached._weatherInsights),
        fromCache: true,
      };
    }
  }

  if (isGroqRateLimited()) {
    const cached = getCached(cacheKey);
    if (cached) {
      return {
        ...cached,
        itinerary: finalizeItinerary(cached.itinerary, tripInput, apiData, geo),
        weather: mergeWeatherInsights(apiData.weather, cached._weatherInsights),
        fromCache: true,
        aiErrors: [{ source: 'ai', message: 'Groq daily limit reached — showing cached AI results.', severity: 'warning' }],
      };
    }
    const fallback = buildFallbackFromPlaces(tripInput, apiData, geo);
    return {
      ...buildEmptyAI(apiData, 'Groq daily token limit reached — showing place-based itinerary.'),
      ...fallback,
      packing: buildFallbackPacking(tripInput, apiData.weather),
      summary: buildFallbackSummary(buildTripContext(tripInput, geo, apiData)),
    };
  }

  const ctx = buildTripContext(tripInput, geo, apiData);
  const aiErrors = [];

  try {
    const result = await callGroqForTrip(ctx);

    const optimized = result.optimizedItinerary || {};
    const optimizer = optimized.decisions?.length || optimized.highlights?.length
      ? {
          highlights: uniqueStrings(optimized.highlights || []),
          decisions: optimized.decisions || [],
        }
      : result.optimizer || null;
    const rawItinerary = optimized.days?.length ? optimized.days : result.itinerary || [];
    const itinerary = finalizeItinerary(rawItinerary, tripInput, apiData, geo);

    const output = {
      weather: mergeWeatherInsights(apiData.weather, result.weatherInsights),
      activities: result.activities || [],
      optimizer,
      itinerary,
      budget: result.budget || null,
      packing: result.packing || [],
      summary: result.summary
        ? { ...result.summary, highlights: uniqueStrings(result.summary.highlights || []) }
        : null,
      restaurants: mergeRestaurantDescriptions(apiData.restaurants, result.restaurants),
      flightRecommendations: result.flightRecommendations || [],
      travelTips: uniqueStrings(result.travelTips || []),
      safetyTips: uniqueStrings(result.safetyTips || []),
      aiErrors: [],
      _weatherInsights: result.weatherInsights,
    };

    if (!output.activities.length) {
      const fb = buildFallbackFromPlaces(tripInput, apiData, geo);
      output.activities = fb.activities;
      if (!output.optimizer) output.optimizer = fb.optimizer;
    }
    if (!output.packing.length) output.packing = buildFallbackPacking(tripInput, apiData.weather);
    if (!output.summary) output.summary = buildFallbackSummary(ctx);

    setCache(cacheKey, { ...output, weather: apiData.weather }, 3600);
    return output;
  } catch (error) {
    const message = /validate json|failed_generation/i.test(error.message)
      ? 'AI returned incomplete JSON — showing a place-based plan instead. Tap Regenerate to retry.'
      : error.message;

    aiErrors.push({ source: 'ai', message, severity: 'warning' });
    const fb = buildFallbackFromPlaces(tripInput, apiData, geo);
    return {
      weather: apiData.weather,
      activities: fb.activities,
      optimizer: fb.optimizer,
      itinerary: fb.itinerary,
      budget: null,
      packing: buildFallbackPacking(tripInput, apiData.weather),
      summary: buildFallbackSummary(buildTripContext(tripInput, geo, apiData)),
      restaurants: apiData.restaurants,
      travelTips: [],
      safetyTips: [],
      aiErrors,
    };
  }
}

function buildEmptyAI(apiData, message) {
  return {
    weather: apiData.weather,
    activities: [],
    optimizer: null,
    itinerary: [],
    budget: null,
    packing: [],
    summary: null,
    restaurants: apiData.restaurants,
    aiErrors: [{ source: 'ai', message, severity: 'warning' }],
  };
}

function buildFallbackPacking(tripInput, weather) {
  const items = [
    { item: 'Passport / ID', reason: 'Required for travel', category: 'Documents' },
    { item: 'Travel insurance documents', reason: 'Emergency coverage', category: 'Documents' },
    { item: 'Phone charger', reason: 'Stay connected', category: 'Electronics' },
    { item: 'Comfortable walking shoes', reason: 'Sightseeing', category: 'Clothing' },
  ];
  if (tripInput.travellingWithPets) {
    items.push({ item: 'Pet carrier & documents', reason: 'Pet travel requirements', category: 'Pets' });
  }
  if (weather?.some((d) => d.periods?.some((p) => p.rainProbability > 40))) {
    items.push({ item: 'Umbrella / rain jacket', reason: 'Rain expected', category: 'Weather' });
  }
  return items;
}

function buildFallbackSummary(ctx) {
  return {
    text: `Your ${ctx.tripType} trip to ${ctx.destinationCity} from ${ctx.fromDate} to ${ctx.toDate} is ready.`,
    highlights: uniqueStrings(ctx.places?.slice(0, 3).map((p) => p.name) || []),
    pace: 'Moderate',
    weatherNote: 'Check the weather section for daily forecasts.',
    budgetNote: `Budget: ${ctx.budget} ${ctx.currency}`,
  };
}

export { mergeLocalInfoTips };
