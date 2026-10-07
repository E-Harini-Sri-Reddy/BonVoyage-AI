/**
 * Quick trip plan test — run: node scripts/test-trip-plan.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { aggregateTripPlan } = await import('../src/services/trip.service.js');

const trip = {
  origin: 'JFK',
  destination: 'Paris',
  fromDate: '2026-07-12',
  toDate: '2026-07-16',
  travellers: 1,
  budget: 5000,
  currency: 'USD',
  tripType: 'solo',
  interests: ['nightlife', 'nature'],
  travellingWithPets: true,
  travellingWithDisabilities: false,
};

console.log('Testing trip plan: JFK → Paris...\n');

try {
  const result = await aggregateTripPlan(trip);
  console.log('Success:', result.success);
  console.log('Weather days:', result.weather?.length);
  console.log('Flights:', result.flights?.length);
  console.log('Hotels:', result.hotels?.length);
  console.log('Places:', result.places?.length);
  console.log('Activities:', result.activities?.length);
  console.log('Itinerary days:', result.itinerary?.length);
  console.log('Packing items:', result.packing?.length);
  console.log('Summary:', result.summary ? 'yes' : 'no');
  console.log('Optimizer:', result.optimizer ? 'yes' : 'no');
  console.log('Local info:', result.localInfo ? 'yes' : 'no');
  if (result.errors?.length) {
    console.log('\nWarnings:');
    result.errors.forEach((e) => console.log(`  [${e.source}] ${e.message}`));
  }
} catch (error) {
  console.error('FAILED:', error.message);
  process.exit(1);
}
