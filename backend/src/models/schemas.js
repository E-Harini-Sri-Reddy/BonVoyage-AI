import mongoose from 'mongoose';

/** Shared trip search / form input shape */
export const tripInputSchema = new mongoose.Schema(
  {
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    fromDate: { type: String, required: true },
    toDate: { type: String, default: '' },
    travellers: { type: Number, default: 1, min: 1 },
    budget: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    tripType: { type: String, default: 'solo' },
    interests: { type: [String], default: [] },
    travellingWithPets: { type: Boolean, default: false },
    travellingWithDisabilities: { type: Boolean, default: false },
  },
  { _id: false }
);

/** Trimmed travel plan snapshot stored with saved trips */
export const tripPlanSchema = new mongoose.Schema(
  {
    meta: mongoose.Schema.Types.Mixed,
    geocoding: mongoose.Schema.Types.Mixed,
    weather: { type: Array, default: [] },
    flights: { type: Array, default: [] },
    hotels: { type: Array, default: [] },
    activities: { type: Array, default: [] },
    places: { type: Array, default: [] },
    optimizer: mongoose.Schema.Types.Mixed,
    itinerary: { type: Array, default: [] },
    budget: mongoose.Schema.Types.Mixed,
    budgetWarning: mongoose.Schema.Types.Mixed,
    packing: { type: Array, default: [] },
    summary: mongoose.Schema.Types.Mixed,
    restaurants: { type: Array, default: [] },
    localInfo: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

export const FAVORITE_TYPES = ['trip', 'place', 'restaurant', 'activity', 'hotel', 'flight'];

export function buildTripKey(input = {}) {
  return [
    input.origin,
    input.destination,
    input.fromDate,
    input.toDate,
    input.budget,
    input.currency,
  ]
    .filter(Boolean)
    .join('|');
}
