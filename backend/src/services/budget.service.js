const MIN_COSTS = {
  USD: { flight: 350, hotelNight: 70, foodDay: 30, activityDay: 20 },
  EUR: { flight: 320, hotelNight: 65, foodDay: 28, activityDay: 18 },
  GBP: { flight: 280, hotelNight: 60, foodDay: 25, activityDay: 16 },
  INR: { flight: 28000, hotelNight: 2500, foodDay: 800, activityDay: 500 },
  AUD: { flight: 500, hotelNight: 90, foodDay: 35, activityDay: 22 },
  CAD: { flight: 450, hotelNight: 85, foodDay: 32, activityDay: 20 },
  JPY: { flight: 45000, hotelNight: 8000, foodDay: 3000, activityDay: 2000 },
  AED: { flight: 1200, hotelNight: 250, foodDay: 100, activityDay: 60 },
  SGD: { flight: 450, hotelNight: 100, foodDay: 35, activityDay: 22 },
  CHF: { flight: 350, hotelNight: 120, foodDay: 40, activityDay: 25 },
};

const CATEGORY_KEYS = ['flights', 'hotels', 'food', 'activities', 'emergencyBuffer'];

function tripDays(fromDate, toDate) {
  if (!fromDate || !toDate) return 3;
  const from = new Date(`${String(fromDate).slice(0, 10)}T12:00:00`);
  const to = new Date(`${String(toDate).slice(0, 10)}T12:00:00`);
  const ms = to - from;
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

function avgPrice(items) {
  const prices = (items || [])
    .map((i) => Number(i?.price ?? i?.estimatedCost))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) return null;
  return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
}

function minPrice(items) {
  const prices = (items || [])
    .map((i) => Number(i?.price ?? i?.estimatedCost))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) return null;
  return Math.min(...prices);
}

function sumActivityCosts(activities = []) {
  const sum = activities.reduce((s, a) => s + (Number(a?.estimatedCost) || 0), 0);
  return sum > 0 ? Math.round(sum) : null;
}

/** True when category line-items are missing or all zero (ignore total). */
export function isBudgetEmpty(budget) {
  if (!budget || typeof budget !== 'object') return true;
  return CATEGORY_KEYS.every((k) => !Number(budget[k]));
}

/**
 * Estimate category costs from THIS trip's data:
 * - Flights: cheapest/avg live price × travellers, else regional baseline
 * - Hotels: nightly × nights, else regional baseline
 * - Food / activities: per-day estimates × days × travellers (activities prefer AI costs)
 * - Buffer: ~8% of the sum of the above estimates
 *
 * Then scale those relative estimates into the user's total budget so splits
 * flex with trip length, travellers, and live prices — not fixed % templates.
 */
export function allocateBudget(tripInput, apiData = {}) {
  const totalBudget = Math.max(0, Number(tripInput.budget) || 0);
  const travellers = Math.max(1, Number(tripInput.travellers) || 1);
  const currency = tripInput.currency || 'USD';
  const costs = MIN_COSTS[currency] || MIN_COSTS.USD;
  const days = tripDays(tripInput.fromDate, tripInput.toDate);
  const nights = Math.max(1, days - 1);

  if (totalBudget <= 0) {
    return {
      flights: 0,
      hotels: 0,
      food: 0,
      activities: 0,
      emergencyBuffer: 0,
      total: 0,
    };
  }

  const flightUnit = minPrice(apiData.flights) ?? avgPrice(apiData.flights) ?? costs.flight;
  const hotelNightly = avgPrice(apiData.hotels) ?? costs.hotelNight;
  const activityHint = sumActivityCosts(apiData.activities);

  // Raw estimates in trip currency (flexible with duration / party size / live quotes)
  let flights = Math.round(flightUnit * travellers);
  let hotels = Math.round(hotelNightly * nights);
  let food = Math.round(costs.foodDay * days * travellers);
  let activities = activityHint != null
    ? Math.round(activityHint)
    : Math.round(costs.activityDay * days * travellers);

  // Soft floor so short free-activity lists don't collapse the slice to ~0
  activities = Math.max(activities, Math.round(costs.activityDay * Math.min(days, 3) * travellers * 0.5));

  let core = flights + hotels + food + activities;
  let emergencyBuffer = Math.max(Math.round(core * 0.08), Math.round(totalBudget * 0.03));

  let allocated = flights + hotels + food + activities + emergencyBuffer;

  // Fit into the user's stated budget while keeping relative weights
  if (allocated > 0) {
    const scale = totalBudget / allocated;
    flights = Math.round(flights * scale);
    hotels = Math.round(hotels * scale);
    food = Math.round(food * scale);
    activities = Math.round(activities * scale);
    emergencyBuffer = Math.max(0, totalBudget - flights - hotels - food - activities);
  }

  return {
    flights,
    hotels,
    food,
    activities,
    emergencyBuffer,
    total: totalBudget,
  };
}

/**
 * Prefer AI numbers when they look real; otherwise use estimate-based allocation.
 * Always scale category totals to the user's budget.
 */
export function resolveBudgetAllocation(aiBudget, tripInput, apiData = {}) {
  const estimated = allocateBudget(tripInput, {
    ...apiData,
    activities: apiData.activities || aiBudget?.activities,
  });

  const totalBudget = Math.max(0, Number(tripInput.budget) || estimated.total || 0);
  if (totalBudget <= 0) return estimated;

  if (isBudgetEmpty(aiBudget)) {
    return { ...estimated, total: totalBudget };
  }

  // Merge: use AI value when > 0, else estimated
  let flights = Number(aiBudget.flights) > 0 ? Number(aiBudget.flights) : estimated.flights;
  let hotels = Number(aiBudget.hotels) > 0 ? Number(aiBudget.hotels) : estimated.hotels;
  let food = Number(aiBudget.food) > 0 ? Number(aiBudget.food) : estimated.food;
  let activities = Number(aiBudget.activities) > 0 ? Number(aiBudget.activities) : estimated.activities;
  let emergencyBuffer =
    Number(aiBudget.emergencyBuffer) > 0 ? Number(aiBudget.emergencyBuffer) : estimated.emergencyBuffer;

  let allocated = flights + hotels + food + activities + emergencyBuffer;
  if (allocated <= 0) return { ...estimated, total: totalBudget };

  if (allocated !== totalBudget) {
    const scale = totalBudget / allocated;
    flights = Math.round(flights * scale);
    hotels = Math.round(hotels * scale);
    food = Math.round(food * scale);
    activities = Math.round(activities * scale);
    emergencyBuffer = Math.max(0, totalBudget - flights - hotels - food - activities);
  }

  return {
    flights,
    hotels,
    food,
    activities,
    emergencyBuffer,
    total: totalBudget,
  };
}

export function assessBudget(tripInput) {
  const budget = Number(tripInput.budget);
  const travellers = Number(tripInput.travellers) || 1;
  const currency = tripInput.currency || 'USD';
  const costs = MIN_COSTS[currency] || MIN_COSTS.USD;
  const days = tripDays(tripInput.fromDate, tripInput.toDate);

  const minFlights = costs.flight * travellers;
  const minHotels = costs.hotelNight * Math.max(1, days - 1);
  const minFood = costs.foodDay * days * travellers;
  const minActivities = costs.activityDay * days * travellers;
  const minTotal = Math.round(minFlights + minHotels + minFood + minActivities);

  const sufficient = budget >= minTotal * 0.85;

  return {
    sufficient,
    budget,
    currency,
    minimumRecommended: minTotal,
    breakdown: {
      flights: minFlights,
      hotels: minHotels,
      food: minFood,
      activities: minActivities,
    },
    message: sufficient
      ? null
      : `Your budget of ${budget.toLocaleString()} ${currency} is below the estimated minimum of ${minTotal.toLocaleString()} ${currency} for this trip (${travellers} traveller${travellers > 1 ? 's' : ''}, ${days} days). International flights alone typically cost from ${minFlights.toLocaleString()} ${currency}.`,
    cheapestTips: sufficient
      ? []
      : [
          `Budget flights: search 2–3 months ahead; expect at least ${minFlights.toLocaleString()} ${currency} for flights.`,
          `Stay: hostels or budget hotels from ${costs.hotelNight.toLocaleString()} ${currency}/night.`,
          `Free activities: city walks, public parks, and free museum days.`,
          `Street food and local markets from ${costs.foodDay.toLocaleString()} ${currency}/person/day.`,
        ],
  };
}
