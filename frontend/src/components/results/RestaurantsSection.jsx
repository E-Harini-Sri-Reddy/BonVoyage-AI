import Card from '../common/Card';
import FavoritesButton from '../common/FavoritesButton';
import { useFavorites } from '../../hooks/useFavorites';

import { buildGoogleMapsDirectionsUrl } from '../../utils/maps';

function RestaurantCard({ restaurant, onFavorite, isFavorited }) {
  const mapsUrl = buildGoogleMapsDirectionsUrl(restaurant);

  const openDirections = (e) => {
    if (e.target.closest('button')) return;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card
      hover
      className="flex flex-col gap-3 h-full cursor-pointer group"
      onClick={openDirections}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.open(mapsUrl, '_blank', 'noopener,noreferrer');
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-white">{restaurant.name}</p>
          {restaurant.cuisine && (
            <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">{restaurant.cuisine}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {restaurant.rating != null && (
            <span className="text-xs font-semibold text-amber-600 whitespace-nowrap">
              ★ {restaurant.rating}
            </span>
          )}
          {onFavorite && (
            <div onClick={(e) => e.stopPropagation()}>
              <FavoritesButton active={isFavorited} onClick={onFavorite} size="sm" />
            </div>
          )}
        </div>
      </div>

      {restaurant.description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 flex-1">
          {restaurant.description}
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-auto pt-1 border-t border-slate-100 dark:border-slate-800">
        {restaurant.priceRange && <span>{restaurant.priceRange}</span>}
        {restaurant.distance && <span>📍 {restaurant.distance}</span>}
        {restaurant.mealTime && <span>🍽 {restaurant.mealTime}</span>}
        <span className="ml-auto font-medium text-primary-600 dark:text-primary-400 group-hover:underline">
          Get directions →
        </span>
      </div>
    </Card>
  );
}

export default function RestaurantsSection({ restaurants }) {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!restaurants?.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {restaurants.map((restaurant, i) => (
        <RestaurantCard
          key={`${restaurant.name}-${i}`}
          restaurant={restaurant}
          isFavorited={isFavorite('place', restaurant)}
          onFavorite={() =>
            toggleFavorite('place', restaurant, {
              title: restaurant.name,
              subtitle: restaurant.cuisine || 'Restaurant',
            })
          }
        />
      ))}
    </div>
  );
}
