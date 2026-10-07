import { useCallback, useRef, useState } from 'react';
import { planTrip } from '../services/apiClient';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { saveRecentSearch } from '../services/authApi';
import { loadCachedPlan, saveCachedPlan, planMatchesInput } from '../utils/planCache';

let planInFlight = false;

export function useTripPlan() {
  const { input, setPlan, setLoading, setError, isLoading, plan, error } = useTrip();
  const { canSave } = useAuth();
  const [status, setStatus] = useState('idle');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const requestIdRef = useRef(0);
  const abortRef = useRef(null);

  const generatePlan = useCallback(async (options = {}) => {
    const { force = false, regenerateAIOnly = false } =
      typeof options === 'boolean' ? { force: options } : options;

    if (planInFlight && !force) return plan;

    const payload = {
      ...input,
      travellers: Number(input.travellers),
      budget: Number(input.budget),
      travellingWithPets: Boolean(input.travellingWithPets),
      travellingWithDisabilities: Boolean(input.travellingWithDisabilities),
      regenerateAIOnly,
    };

    if (!force && !regenerateAIOnly) {
      if (plan && planMatchesInput(plan, input)) {
        setStatus('success');
        return plan;
      }
      const cached = loadCachedPlan(input);
      if (cached && planMatchesInput(cached, input)) {
        setPlan(cached);
        setStatus('success');
        return cached;
      }
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    planInFlight = true;
    const requestId = ++requestIdRef.current;

    if (regenerateAIOnly && plan) {
      setIsRegenerating(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setStatus('loading');

    try {
      const { data } = await planTrip(payload);

      if (controller.signal.aborted || requestId !== requestIdRef.current) return data;

      setPlan(data);
      saveCachedPlan(input, data);
      setStatus('success');

      if (canSave && !regenerateAIOnly) {
        saveRecentSearch(input).catch(() => {});
      }

      return data;
    } catch (err) {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setError(err.message);
        setStatus('error');
      }
      throw err;
    } finally {
      if (requestId === requestIdRef.current) {
        planInFlight = false;
        setLoading(false);
        setIsRegenerating(false);
      }
    }
  }, [input, setPlan, setLoading, setError, canSave, plan]);

  return { generatePlan, isLoading, isRegenerating, plan, error, status };
}
