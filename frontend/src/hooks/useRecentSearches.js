import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearchesApi,
  removeRecentSearch as removeRecentSearchApi,
} from '../services/authApi';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { useTrip } from '../context/TripContext';
import { ROUTES } from '../constants/routes';
import { loadCachedPlan } from '../utils/planCache';

const MAX_RECENT = 5;

function searchKey(search) {
  return `${search.origin}|${search.destination}|${search.fromDate}`;
}

export function useRecentSearches() {
  const { canSave } = useAuth();
  const [recentSearches, setRecentSearches] = useState(() =>
    canSave ? [] : storage.get(STORAGE_KEYS.RECENT_SEARCHES, [])
  );
  const { setInput, setPlan, clearPlan } = useTrip();
  const navigate = useNavigate();

  useEffect(() => {
    if (canSave) {
      getRecentSearches()
        .then(({ data }) => setRecentSearches(data.searches || []))
        .catch(() => {});
    } else {
      setRecentSearches(storage.get(STORAGE_KEYS.RECENT_SEARCHES, []));
    }
  }, [canSave]);

  useEffect(() => {
    if (canSave) return undefined;
    const sync = (e) => {
      if (e.detail === STORAGE_KEYS.RECENT_SEARCHES) {
        setRecentSearches(storage.get(STORAGE_KEYS.RECENT_SEARCHES, []));
      }
    };
    window.addEventListener('bonvoyage-storage', sync);
    return () => window.removeEventListener('bonvoyage-storage', sync);
  }, [canSave]);

  const addRecentSearch = useCallback(
    (search) => {
      if (canSave) {
        saveRecentSearch(search)
          .then(({ data }) => {
            if (data.search) {
              setRecentSearches((prev) => {
                const filtered = prev.filter((s) => searchKey(s) !== searchKey(search));
                return [data.search, ...filtered].slice(0, MAX_RECENT);
              });
            }
          })
          .catch(() => {});
        return;
      }

      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => searchKey(s) !== searchKey(search));
        const updated = [{ ...search, searchedAt: new Date().toISOString() }, ...filtered].slice(
          0,
          MAX_RECENT
        );
        storage.set(STORAGE_KEYS.RECENT_SEARCHES, updated);
        return updated;
      });
    },
    [canSave]
  );

  const removeRecentSearch = useCallback(
    async (search) => {
      if (canSave && search.id) {
        try {
          await removeRecentSearchApi(search.id);
        } catch {
          return;
        }
      }

      setRecentSearches((prev) => {
        const updated = prev.filter((s) => searchKey(s) !== searchKey(search));
        if (!canSave) {
          storage.set(STORAGE_KEYS.RECENT_SEARCHES, updated);
        }
        return updated;
      });
    },
    [canSave]
  );

  const clearRecentSearches = useCallback(async () => {
    if (canSave) {
      try {
        await clearRecentSearchesApi();
      } catch {
        return;
      }
    } else {
      storage.set(STORAGE_KEYS.RECENT_SEARCHES, []);
    }
    setRecentSearches([]);
  }, [canSave]);

  const loadRecentSearch = useCallback(
    (search) => {
      const inputData = {
        origin: search.origin,
        destination: search.destination,
        fromDate: search.fromDate,
        toDate: search.toDate,
        travellers: search.travellers ?? 1,
        budget: search.budget ?? '',
        currency: search.currency ?? 'USD',
        tripType: search.tripType ?? 'solo',
        interests: search.interests ?? [],
        travellingWithPets: search.travellingWithPets ?? false,
        travellingWithDisabilities: search.travellingWithDisabilities ?? false,
      };
      setInput(inputData);
      const cached = loadCachedPlan(inputData);
      if (cached) {
        setPlan(cached);
      } else {
        clearPlan();
      }
      navigate(ROUTES.RESULTS);
    },
    [setInput, setPlan, clearPlan, navigate]
  );

  return {
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    loadRecentSearch,
  };
}
