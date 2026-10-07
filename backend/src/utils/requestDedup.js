const inFlight = new Map();
const planCache = new Map();

export function dedupe(key, fn) {
  if (inFlight.has(key)) return inFlight.get(key);
  const promise = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

export function getPlanCache(key) {
  const entry = planCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    planCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setPlanCache(key, data, ttlMs = 1800000) {
  planCache.set(key, { data, expires: Date.now() + ttlMs });
}

export function buildPlanCacheKey(input) {
  return [
    input.origin, input.destination, input.fromDate, input.toDate,
    input.budget, input.currency, input.travellers, input.tripType,
    input.travellingWithPets, input.travellingWithDisabilities,
    (input.interests || []).join(','),
  ].join('|');
}
