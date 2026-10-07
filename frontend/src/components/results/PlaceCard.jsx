import { useState } from 'react';
import Card from '../common/Card';
import FavoritesButton from '../common/FavoritesButton';
import { useFavorites } from '../../hooks/useFavorites';
import { buildGoogleMapsDirectionsUrl } from '../../utils/maps';

function PlaceImage({ place }) {
  const [failed, setFailed] = useState(false);

  if (!place.imageUrl || failed) {
    return (
      <div className="h-40 w-full rounded-xl bg-gradient-to-br from-primary-100 to-cyan-100 dark:from-primary-900/30 dark:to-cyan-900/20 flex items-center justify-center">
        <span className="text-3xl" aria-hidden="true">📍</span>
      </div>
    );
  }

  return (
    <img
      src={place.imageUrl}
      alt={place.name}
      className="h-40 w-full rounded-xl object-cover bg-slate-100 dark:bg-slate-800"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function PlaceCard({ place, onFavorite, isFavorited }) {
  const mapsUrl = buildGoogleMapsDirectionsUrl(place);

  const openDirections = () => {
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card
      hover
      className="flex flex-col gap-3 overflow-hidden cursor-pointer group"
      onClick={openDirections}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDirections();
        }
      }}
    >
      <div className="relative">
        <PlaceImage place={place} />
        {onFavorite && (
          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
            <FavoritesButton active={isFavorited} onClick={onFavorite} size="sm" />
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
            {place.name}
          </p>
          <span className="inline-block mt-1 rounded-md bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 text-[10px] font-medium text-primary-700 dark:text-primary-300">
            {place.category}
          </span>
        </div>
        {place.rating && (
          <span className="shrink-0 text-xs font-semibold text-amber-600">★ {place.rating}</span>
        )}
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{place.description}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-auto">
        {place.distanceLabel && <span>📍 {place.distanceLabel}</span>}
        {place.openingHours && <span className="truncate">🕐 {place.openingHours.split(';')[0]}</span>}
        <span className="ml-auto font-medium text-primary-600 dark:text-primary-400 group-hover:underline">
          Get directions →
        </span>
      </div>
    </Card>
  );
}

export function PlacesGrid({ places }) {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!places?.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((place, i) => (
        <PlaceCard
          key={place.id || place.placeId || `${place.name}-${place.lat}-${place.lon}-${i}`}
          place={place}
          isFavorited={isFavorite('place', place)}
          onFavorite={() => toggleFavorite('place', place, { title: place.name, subtitle: place.category })}
        />
      ))}
    </div>
  );
}
