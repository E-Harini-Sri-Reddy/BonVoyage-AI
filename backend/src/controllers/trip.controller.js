import { AppError } from '../middleware/errorHandler.js';
import { aggregateTripPlan } from '../services/trip.service.js';
import { searchLocations } from '../services/geocoding.service.js';

export async function planTrip(req, res, next) {
  try {
    const { regenerateAIOnly, ...tripInput } = req.body;
    const result = await aggregateTripPlan(tripInput, { regenerateAIOnly: Boolean(regenerateAIOnly) });
    res.json(result);
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(error.message));
  }
}

export async function geocodeLocation(req, res, next) {
  try {
    const { query } = req.body;
    const results = await searchLocations(query);
    res.json({ success: true, query, results });
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(error.message));
  }
}
