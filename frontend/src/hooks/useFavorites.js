import { useCallback, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getFavorites,
  saveFavorite,
  removeFavorite as apiRemoveFavorite,
} from '../services/authApi';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { buildFavoriteId } from '../utils/tripHelpers';

const MAX_FAVORITES = 20;
let favoritesCache = null;
let favoritesPromise = null;

async function loadServerFavorites() {
  if (favoritesCache) return favoritesCache;
  if (!favoritesPromise) {
    favoritesPromise = getFavorites()
      .then(({ data }) => {
        favoritesCache = data.favorites || [];
        return favoritesCache;
      })
      .catch(() => {
        favoritesCache = [];
        return favoritesCache;
      })
      .finally(() => {
        favoritesPromise = null;
      });
  }
  return favoritesPromise;
}

export function useFavorites() {
  const { canSave } = useAuth();
  const [favorites, setFavorites] = useState(() =>
    canSave ? [] : storage.get(STORAGE_KEYS.FAVORITES, [])
  );

  useEffect(() => {
    if (canSave) {
      let cancelled = false;
      loadServerFavorites().then((items) => {
        if (!cancelled) setFavorites(items);
      });
      return () => {
        cancelled = true;
      };
    } else {
      setFavorites(storage.get(STORAGE_KEYS.FAVORITES, []));
    }
  }, [canSave]);

  useEffect(() => {
    if (canSave) return undefined;
    const sync = (e) => {
      if (e.detail === STORAGE_KEYS.FAVORITES) {
        setFavorites(storage.get(STORAGE_KEYS.FAVORITES, []));
      }
    };
    window.addEventListener('bonvoyage-storage', sync);
    return () => window.removeEventListener('bonvoyage-storage', sync);
  }, [canSave]);

  const persistLocal = useCallback((updated) => {
    storage.set(STORAGE_KEYS.FAVORITES, updated);
    setFavorites(updated);
  }, []);

  const toggleFavorite = useCallback(
    (type, data, meta = {}) => {
      if (!canSave) return;

      const itemId = buildFavoriteId(type, data);
      const exists = favorites.find((f) => f.itemId === itemId || f.id === itemId);

      if (exists) {
        apiRemoveFavorite(itemId).catch(() => {});
        setFavorites((prev) => {
          const updated = prev.filter((f) => (f.itemId || f.id) !== itemId);
          favoritesCache = updated;
          return updated;
        });
        return;
      }

      const item = {
        itemId,
        type,
        title: meta.title || data.name || data.title || `${data.origin} → ${data.destination}`,
        subtitle: meta.subtitle || '',
        data,
      };

      saveFavorite(item).catch(() => {});
      setFavorites((prev) => {
        const updated = [item, ...prev.filter((f) => (f.itemId || f.id) !== itemId)].slice(0, MAX_FAVORITES);
        favoritesCache = updated;
        return updated;
      });
    },
    [canSave, favorites]
  );

  const removeFavorite = useCallback(
    (id) => {
      if (canSave) {
        apiRemoveFavorite(id).catch(() => {});
        setFavorites((prev) => {
          const updated = prev.filter((f) => (f.itemId || f.id) !== id);
          favoritesCache = updated;
          return updated;
        });
        return;
      }
      persistLocal(favorites.filter((f) => f.id !== id));
    },
    [canSave, favorites, persistLocal]
  );

  const isFavorite = useCallback(
    (type, data) => {
      const id = buildFavoriteId(type, data);
      return favorites.some((f) => (f.itemId || f.id) === id);
    },
    [favorites]
  );

  const clearFavorites = useCallback(() => {
    if (canSave) {
      favorites.forEach((f) => apiRemoveFavorite(f.itemId || f.id).catch(() => {}));
      favoritesCache = [];
      setFavorites([]);
      return;
    }
    persistLocal([]);
  }, [canSave, favorites, persistLocal]);

  return { favorites, toggleFavorite, removeFavorite, isFavorite, clearFavorites, canSave };
}
