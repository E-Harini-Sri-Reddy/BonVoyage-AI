import { useCallback, useState } from 'react';
import { useTrip } from '../context/TripContext';
import { validateTripForm } from '../utils/validation';

export function useTripForm() {
  const { input, setInput } = useTrip();
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const updateField = useCallback(
    (field, value) => {
      setInput({ [field]: value });
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    [setInput]
  );

  const touchField = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const toggleInterest = useCallback(
    (interest) => {
      const current = input.interests || [];
      const updated = current.includes(interest)
        ? current.filter((i) => i !== interest)
        : [...current, interest];
      setInput({ interests: updated });
      setTouched((prev) => ({ ...prev, interests: true }));
    },
    [input.interests, setInput]
  );

  const validate = useCallback(() => {
    const result = validateTripForm(input);
    setErrors(result.errors);
    setTouched({
      origin: true,
      destination: true,
      fromDate: true,
      toDate: true,
      travellers: true,
      budget: true,
      tripType: true,
      interests: true,
    });
    return result.isValid;
  }, [input]);

  const resetForm = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const { isValid } = validateTripForm(input);

  return {
    form: input,
    errors,
    touched,
    isValid,
    updateField,
    toggleInterest,
    touchField,
    validate,
    resetForm,
  };
}
