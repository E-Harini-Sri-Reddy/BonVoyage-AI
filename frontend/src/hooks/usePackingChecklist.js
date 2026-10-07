import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPackingState, savePackingState } from '../services/authApi';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { buildTripKey } from '../utils/tripHelpers';

const packingCache = new Map();
const packingRequests = new Map();
const packingSaveTimers = new Map();

async function loadServerPacking(tripKey) {
  if (packingCache.has(tripKey)) return packingCache.get(tripKey);
  if (!packingRequests.has(tripKey)) {
    const request = getPackingState(tripKey)
      .then(({ data }) => {
        const checked = data.checked || {};
        packingCache.set(tripKey, checked);
        return checked;
      })
      .catch(() => {
        const checked = {};
        packingCache.set(tripKey, checked);
        return checked;
      })
      .finally(() => {
        packingRequests.delete(tripKey);
      });
    packingRequests.set(tripKey, request);
  }
  return packingRequests.get(tripKey);
}

function saveServerPackingDebounced(tripKey, checked) {
  packingCache.set(tripKey, checked);
  clearTimeout(packingSaveTimers.get(tripKey));
  packingSaveTimers.set(
    tripKey,
    setTimeout(() => {
      savePackingState(tripKey, checked).catch(() => {});
      packingSaveTimers.delete(tripKey);
    }, 500)
  );
}

export function usePackingChecklist(tripKey, packingItems = []) {
  const { canSave } = useAuth();
  const storageKey = `${STORAGE_KEYS.PACKING_CHECKED}_${tripKey}`;
  const validItems = useMemo(
    () => new Set(packingItems.map((p) => p.item).filter(Boolean)),
    [packingItems]
  );

  const pruneChecked = useCallback(
    (stored) => {
      const pruned = {};
      for (const [key, val] of Object.entries(stored || {})) {
        if (validItems.size === 0 || validItems.has(key)) pruned[key] = val;
      }
      return pruned;
    },
    [validItems]
  );

  const [checked, setChecked] = useState(() => pruneChecked(storage.get(storageKey, {})));

  useEffect(() => {
    if (!canSave || !tripKey) return;
    let cancelled = false;
    loadServerPacking(tripKey).then((serverChecked) => {
      if (!cancelled) setChecked(pruneChecked(serverChecked));
    });
    return () => {
      cancelled = true;
    };
  }, [canSave, tripKey, pruneChecked]);

  const persist = useCallback(
    (updated) => {
      if (canSave) {
        saveServerPackingDebounced(tripKey, updated);
      } else {
        storage.set(storageKey, updated);
      }
    },
    [canSave, tripKey, storageKey]
  );

  const toggleItem = useCallback(
    (itemName) => {
      setChecked((prev) => {
        const updated = { ...prev, [itemName]: !prev[itemName] };
        if (!updated[itemName]) delete updated[itemName];
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const isChecked = useCallback((itemName) => Boolean(checked[itemName]), [checked]);

  const checkedCount = useMemo(() => {
    if (!packingItems.length) return 0;
    return packingItems.filter((p) => checked[p.item]).length;
  }, [packingItems, checked]);

  const total = packingItems.length;
  const progress = total ? Math.min(100, Math.round((checkedCount / total) * 100)) : 0;

  const resetChecklist = useCallback(() => {
    persist({});
    setChecked({});
  }, [persist]);

  return { toggleItem, isChecked, checkedCount, total, progress, resetChecklist };
}

export function usePackingChecklistForTrip(input, packingItems = []) {
  const tripKey = buildTripKey(input);
  return usePackingChecklist(tripKey, packingItems);
}
