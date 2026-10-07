import { z } from 'zod';
import { TRIP_TYPES, INTERESTS, CURRENCIES } from '../config/constants.js';

const today = () => new Date().toISOString().split('T')[0];

export const tripPlanSchema = z
  .object({
    origin: z.string().trim().min(1, 'Origin is required'),
    destination: z.string().trim().min(1, 'Destination is required'),
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid from date format'),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid to date format'),
    travellers: z.coerce.number().int().min(1, 'At least 1 traveller required'),
    budget: z.coerce.number().positive('Budget must be greater than zero'),
    currency: z.enum(CURRENCIES, { error: 'Invalid currency' }).default('USD'),
    tripType: z.enum(TRIP_TYPES, { error: 'Invalid trip type' }),
    interests: z.array(z.enum(INTERESTS, { error: 'Invalid interest' })).default([]),
    travellingWithPets: z.coerce.boolean().default(false),
    travellingWithDisabilities: z.coerce.boolean().default(false),
    regenerateAIOnly: z.coerce.boolean().optional().default(false),
  })
  .refine((data) => data.origin.toLowerCase() !== data.destination.toLowerCase(), {
    message: 'Origin and destination must be different',
    path: ['destination'],
  })
  .refine((data) => data.fromDate >= today(), {
    message: 'Departure date cannot be in the past',
    path: ['fromDate'],
  })
  .refine((data) => data.toDate >= data.fromDate, {
    message: 'Return date must be on or after departure date',
    path: ['toDate'],
  });

export const geocodeSchema = z.object({
  query: z.string().trim().min(1, 'Search query is required'),
});
