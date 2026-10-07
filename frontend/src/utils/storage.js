const STORAGE_PREFIX = 'bonvoyage_';

export const storage = {
  get(key, fallback = null) {
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('bonvoyage-storage', { detail: key }));
    } catch {
      // localStorage full or unavailable
    }
  },

  remove(key) {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  },
};

export const STORAGE_KEYS = {
  FAVORITES: 'favorites',
  RECENT_SEARCHES: 'recent_searches',
  PACKING_CHECKED: 'packing_checked',
  THEME: 'theme',
};
