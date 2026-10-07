export function getTodayString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function validateTripForm(form) {
  const errors = {};
  const today = getTodayString();

  if (!form.origin?.trim()) {
    errors.origin = 'Please enter your departure location.';
  }

  if (!form.destination?.trim()) {
    errors.destination = 'Please enter your destination.';
  }

  if (form.origin?.trim() && form.destination?.trim()) {
    if (form.origin.trim().toLowerCase() === form.destination.trim().toLowerCase()) {
      errors.destination = 'Destination must be different from departure.';
    }
  }

  if (!form.fromDate) {
    errors.fromDate = 'Please select a departure date.';
  } else if (form.fromDate < today) {
    errors.fromDate = 'Departure date cannot be in the past.';
  }

  if (!form.toDate) {
    errors.toDate = 'Please select a return date.';
  } else if (form.fromDate && form.toDate < form.fromDate) {
    errors.toDate = 'Return date must be on or after departure date.';
  } else if (form.toDate < today) {
    errors.toDate = 'Return date cannot be in the past.';
  }

  const travellers = Number(form.travellers);
  if (!travellers || travellers < 1) {
    errors.travellers = 'At least 1 traveller is required.';
  }

  const budget = Number(form.budget);
  if (!budget || budget <= 0) {
    errors.budget = 'Budget must be greater than zero.';
  }

  if (!form.tripType) {
    errors.tripType = 'Please select a trip type.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
