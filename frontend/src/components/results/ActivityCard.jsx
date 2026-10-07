import Card from '../common/Card';
import FavoritesButton from '../common/FavoritesButton';
import { formatCurrency } from '../../utils/formatters';
import { useFavorites } from '../../hooks/useFavorites';

function ActivityCard({ activity, currency, onFavorite, isFavorited }) {
  return (
    <Card hover className="flex flex-col gap-2 relative">
      {onFavorite && (
        <div className="absolute top-3 right-3">
          <FavoritesButton active={isFavorited} onClick={onFavorite} size="sm" />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-slate-900 dark:text-white">{activity.title}</p>
        {activity.indoor != null && (
          <span className="shrink-0 rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px]">
            {activity.indoor ? '🏠 Indoor' : '🌳 Outdoor'}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{activity.description}</p>
      <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-auto pt-2">
        {activity.duration && <span>⏱ {activity.duration}</span>}
        {activity.location && <span>📍 {activity.location}</span>}
        {activity.estimatedCost != null && (
          <span>💰 {formatCurrency(activity.estimatedCost, currency)}</span>
        )}
      </div>
    </Card>
  );
}

export function ActivitiesGrid({ activities, currency }) {
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!activities?.length) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activities.map((a, i) => (
        <ActivityCard
          key={`${a.title}-${i}`}
          activity={a}
          currency={currency}
          isFavorited={isFavorite('activity', a)}
          onFavorite={() => toggleFavorite('activity', a, { title: a.title, subtitle: a.location })}
        />
      ))}
    </div>
  );
}
