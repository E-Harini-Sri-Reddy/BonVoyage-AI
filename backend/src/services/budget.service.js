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

/** Share of total trip budget when AI allocation is missing */
const BUDGET_SHARES = {
  flights: 0.4,
  hotels: 0.3,
  food: 0.15,
  activities: 0.1,
  emergencyBuffer: 0.05,
};

function tripDays(fromDate, toDate) {
  if (!fromDate || !toDate) return 3;
  const ms = new Date(toDate) - new Date(fromDate);
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1);
}

function avgPrice(items) {
  const prices = (items || []).map((i) => Number(i?.price)).filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) return null;
  return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
}

export function isBudgetEmpty(budget) {
  if (!budget || typeof budget !== 'object') return true;
  const keys = ['flights', 'hotels', 'food', 'activities', 'emergencyBuffer', 'total'];
  return keys.every((k) => !Number(budget[k]));
}

/**
 * Build a real budget allocation from the user's total + live prices when available.
 * Always returns non-zero values when budget > 0.
 */
export function allocateBudget(tripInput, apiData = {}) {
  const totalBudget = Math.max(0, Number(tripInput.budget) || 0);
  const travellers = Number(tripInput.travellers) || 1;
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

  const flightAvg = avgPrice(apiData.flights);
  const hotelNightly = avgPrice(apiData.hotels);

  let flights = flightAvg != null
    ? Math.round(flightAvg * travellers)
    : Math.round(totalBudget * BUDGET_SHARES.flights);

  let hotels = hotelNightly != null
    ? Math.round(hotelNightly * nights)
    : Math.round(totalBudget * BUDGET_SHARES.hotels);

  let food = Math.round(totalBudget * BUDGET_SHARES.food);
  let activities = Math.round(totalBudget * BUDGET_SHARES.activities);
  let emergencyBuffer = Math.round(totalBudget * BUDGET_SHARES.emergencyBuffer);

  let allocated = flights + hotels + food + activities + emergencyBuffer;

  // Scale proportionally into the user's total when live prices overshoot / undershoot
  if (allocated > 0 && allocated !== totalBudget) {
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

export function resolveBudgetAllocation(aiBudget, tripInput, apiData = {}) {
  if (!isBudgetEmpty(aiBudget)) {
    const total = Number(aiBudget.total) || Object.values(aiBudget).reduce((s, v) => s + (Number(v) || 0), 0);
    return { ...aiBudget, total: total || Number(tripInput.budget) || 0 };
  }
  return allocateBudget(tripInput, apiData);
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
