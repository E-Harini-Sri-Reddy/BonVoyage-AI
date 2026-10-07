import GlassPanel from '../layout/GlassPanel';
import FavoritesButton from '../common/FavoritesButton';
import { useFavorites } from '../../hooks/useFavorites';
import { useRecentSearches } from '../../hooks/useRecentSearches';

const TYPE_ICONS = {
  trip: '✈️',
  flight: '🛫',
  hotel: '🏨',
  place: '📍',
  activity: '🎯',
};

export default function FavoritesPanel() {
  const { favorites, removeFavorite, clearFavorites } = useFavorites();
  const { loadRecentSearch } = useRecentSearches();

  if (!favorites.length) return null;

  const handleOpen = (item) => {
    if (item.type === 'trip') {
      loadRecentSearch(item.data);
    }
  };

  return (
    <GlassPanel className="p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-slate-900 dark:text-white">
          Saved Favorites
        </h3>
        <button
          type="button"
          onClick={clearFavorites}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Clear all
        </button>
      </div>
      <ul className="space-y-2">
        {favorites.map((item) => (
          <li
            key={item.itemId || item.id || item._id}
            className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <span className="text-lg" aria-hidden="true">{TYPE_ICONS[item.type] || '⭐'}</span>
            <button
              type="button"
              onClick={() => handleOpen(item)}
              className="flex-1 min-w-0 text-left"
              disabled={item.type !== 'trip'}
            >
              <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                {item.title}
              </p>
              {item.subtitle && (
                <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
              )}
            </button>
            <FavoritesButton
              active
              size="sm"
              onClick={() => removeFavorite(item.itemId || item.id || item._id)}
            />
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}
