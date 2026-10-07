export function buildTripContext(tripInput, geo, apiData) {
  return {
    origin: tripInput.origin,
    originCity: geo?.origin?.city || tripInput.origin,
    destination: tripInput.destination,
    destinationCity: geo?.destination?.city || tripInput.destination,
    destinationCountry: geo?.destination?.country || '',
    fromDate: tripInput.fromDate,
    toDate: tripInput.toDate,
    travellers: tripInput.travellers,
    budget: tripInput.budget,
    currency: tripInput.currency,
    tripType: tripInput.tripType,
    interests: tripInput.interests,
    travellingWithPets: tripInput.travellingWithPets ?? false,
    travellingWithDisabilities: tripInput.travellingWithDisabilities ?? false,
    weather: apiData.weather,
    flights: apiData.flights,
    hotels: apiData.hotels,
    places: apiData.places,
    restaurants: apiData.restaurants,
    budgetWarning: apiData.budgetWarning,
  };
}

export function buildAccessibilityNotes(ctx) {
  const notes = [];
  if (ctx.travellingWithPets) {
    notes.push('Travelling with pets — prefer pet-friendly hotels, parks, and outdoor venues with pet policies.');
  }
  if (ctx.travellingWithDisabilities) {
    notes.push('Travelling with disabilities — prioritize accessible transport, step-free venues, rest breaks, and wheelchair-friendly routes.');
  }
  return notes;
}
