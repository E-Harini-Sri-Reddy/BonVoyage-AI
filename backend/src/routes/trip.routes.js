import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { tripPlanLimiter } from '../middleware/rateLimiter.js';
import { tripPlanSchema, geocodeSchema } from '../validators/trip.validator.js';
import { planTrip, geocodeLocation } from '../controllers/trip.controller.js';

const router = Router();

router.post('/plan', tripPlanLimiter, validate(tripPlanSchema), planTrip);
router.post('/geocode', validate(geocodeSchema), geocodeLocation);

export default router;
