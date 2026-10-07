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
  return Math.max(1, Math.round((to - from) / 86400000) + 1);
}

function pickPrice(items) {
  const prices = (items || [])
    .map((i) => Number(i?.price ?? i?.estimatedCost))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) return null;
  return Math.min(...prices);
}

function avgPrice(items) {
  const prices = (items || [])
    .map((i) => Number(i?.price ?? i?.estimatedCost))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) return null;
  return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
}

export function isBudgetCategoriesEmpty(budget) {
  if (!budget || typeof budget !== 'object') return true;
  return CATEGORY_KEYS.every((k) => !Number(budget[k]));
}

/**
 * Flexible allocation from trip length, travellers, live flight/hotel quotes,
 * and activity costs — then scaled into the user's total budget.
 */
export function allocateFromEstimates({
  totalBudget,
  currency = 'USD',
  travellers = 1,
  fromDate,
  toDate,
  flights = [],
  hotels = [],
  activities = [],
}) {
  const total = Math.max(0, Number(totalBudget) || 0);
  if (!total) return null;

  const costs = MIN_COSTS[currency] || MIN_COSTS.USD;
  const days = tripDays(fromDate, toDate);
  const nights = Math.max(1, days - 1);
  const pax = Math.max(1, Number(travellers) || 1);

  const flightUnit = pickPrice(flights) ?? avgPrice(flights) ?? costs.flight;
  const hotelNightly = avgPrice(hotels) ?? costs.hotelNight;
  const activitySum = activities.reduce((s, a) => s + (Number(a?.estimatedCost) || 0), 0);

  let estFlights = Math.round(flightUnit * pax);
  let estHotels = Math.round(hotelNightly * nights);
  let estFood = Math.round(costs.foodDay * days * pax);
  let estActivities =
    activitySum > 0
      ? Math.round(activitySum)
      : Math.round(costs.activityDay * days * pax);
  estActivities = Math.max(
    estActivities,
    Math.round(costs.activityDay * Math.min(days, 3) * pax * 0.5)
  );

  const core = estFlights + estHotels + estFood + estActivities;
  let estBuffer = Math.max(Math.round(core * 0.08), Math.round(total * 0.03));
  let allocated = estFlights + estHotels + estFood + estActivities + estBuffer;

  if (allocated > 0) {
    const scale = total / allocated;
    estFlights = Math.round(estFlights * scale);
    estHotels = Math.round(estHotels * scale);
    estFood = Math.round(estFood * scale);
    estActivities = Math.round(estActivities * scale);
    estBuffer = Math.max(0, total - estFlights - estHotels - estFood - estActivities);
  }

  return {
    flights: estFlights,
    hotels: estHotels,
    food: estFood,
    activities: estActivities,
    emergencyBuffer: estBuffer,
    total,
  };
}

export function resolveDisplayBudget(budget, context = {}) {
  if (!isBudgetCategoriesEmpty(budget)) {
    const total = Math.max(
      0,
      Number(context.totalBudget) || Number(budget.total) || CATEGORY_KEYS.reduce((s, k) => s + (Number(budget[k]) || 0), 0)
    );
    if (!total) return budget;

    let flights = Number(budget.flights) || 0;
    let hotels = Number(budget.hotels) || 0;
    let food = Number(budget.food) || 0;
    let activities = Number(budget.activities) || 0;
    let emergencyBuffer = Number(budget.emergencyBuffer) || 0;
    let sum = flights + hotels + food + activities + emergencyBuffer;

    if (sum > 0 && sum !== total) {
      const scale = total / sum;
      flights = Math.round(flights * scale);
      hotels = Math.round(hotels * scale);
      food = Math.round(food * scale);
      activities = Math.round(activities * scale);
      emergencyBuffer = Math.max(0, total - flights - hotels - food - activities);
    }

    return { flights, hotels, food, activities, emergencyBuffer, total };
  }

  return allocateFromEstimates(context);
}
