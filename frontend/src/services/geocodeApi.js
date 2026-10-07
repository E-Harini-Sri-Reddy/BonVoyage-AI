import { useCallback, useEffect, useRef, useState } from 'react';
import apiClient from './apiClient';

let debounceTimer;
const pending = new Map();

export function geocodeSearch(query, signal) {
  const key = query.toLowerCase();
  if (pending.has(key)) return pending.get(key);

  const promise = apiClient
    .post('/trip/geocode', { query }, { signal })
    .then((res) => res.data.results || [])
    .finally(() => pending.delete(key));

  pending.set(key, promise);
  return promise;
}

export function useLocationAutocomplete(query, enabled = true) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  const search = useCallback(
    (q) => {
      if (!enabled || !q || q.length < 2) {
        setResults([]);
        return;
      }

      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        setLoading(true);
        try {
          const data = await geocodeSearch(q, controller.signal);
          if (!controller.signal.aborted) setResults(data);
        } catch {
          if (!controller.signal.aborted) setResults([]);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      }, 300);
    },
    [enabled]
  );

  useEffect(() => () => {
    if (abortRef.current) abortRef.current.abort();
    clearTimeout(debounceTimer);
  }, []);

  return { results, loading, search, clear: () => setResults([]) };
}
