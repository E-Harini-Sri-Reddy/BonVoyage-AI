import { storage } from './storage';

const CACHE_PREFIX = 'plan_cache_';
const MAX_CACHED = 10;

export function buildPlanCacheKey(input) {
  return [
    input.origin,
    input.destination,
    input.fromDate,
    input.toDate,
    input.budget,
    input.currency,
    input.travellers,
    input.tripType,
    input.travellingWithPets,
    input.travellingWithDisabilities,
    (input.interests || []).join(','),
  ].join('|');
}

function listCacheIndex() {
  return storage.get('plan_cache_index', []);
}

function saveCacheIndex(index) {
  storage.set('plan_cache_index', index.slice(0, MAX_CACHED));
}

export function loadCachedPlan(input) {
  const key = buildPlanCacheKey(input);
  return storage.get(`${CACHE_PREFIX}${key}`, null);
}

export function saveCachedPlan(input, plan) {
  if (!plan) return;
  const key = buildPlanCacheKey(input);
  storage.set(`${CACHE_PREFIX}${key}`, plan);
  const index = listCacheIndex().filter((k) => k !== key);
  saveCacheIndex([key, ...index]);
}

export function planMatchesInput(plan, input) {
  if (!plan?.meta) return false;
  return buildPlanCacheKey(input) === buildPlanCacheKey({
    origin: plan.meta.origin ?? input.origin,
    destination: plan.meta.destination ?? input.destination,
    fromDate: plan.meta.fromDate ?? input.fromDate,
    toDate: plan.meta.toDate ?? input.toDate,
    budget: plan.meta.budget ?? input.budget,
    currency: plan.meta.currency ?? input.currency,
    travellers: plan.meta.travellers ?? input.travellers,
    tripType: plan.meta.tripType ?? input.tripType,
    travellingWithPets: plan.meta.travellingWithPets ?? input.travellingWithPets,
    travellingWithDisabilities: plan.meta.travellingWithDisabilities ?? input.travellingWithDisabilities,
    interests: plan.meta.interests ?? input.interests,
  });
}
