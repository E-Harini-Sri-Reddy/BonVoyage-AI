import { formatCurrency } from '../../utils/formatters';
import Card from '../common/Card';
import FavoritesButton from '../common/FavoritesButton';

export default function FlightCard({ flight, currency, onFavorite, isFavorited }) {
  return (
    <Card hover className="min-w-[280px] max-w-sm snap-start flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-white">{flight.airline}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{flight.route}</p>
          {flight.recommendation && (
            <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 line-clamp-2">
              {flight.recommendation}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className="text-lg font-bold text-primary-600 dark:text-primary-400 whitespace-nowrap">
            {flight.price != null
              ? formatCurrency(flight.price, currency || flight.currency)
              : 'See price'}
          </p>
          {onFavorite && (
            <FavoritesButton active={isFavorited} onClick={onFavorite} size="sm" />
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-lg bg-slate-100 dark:bg-slate-700 px-2.5 py-1">⏱ {flight.duration}</span>
        <span className="rounded-lg bg-slate-100 dark:bg-slate-700 px-2.5 py-1">
          {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
        </span>
        {flight.label && (
          <span className="rounded-lg bg-primary-100 dark:bg-primary-900/40 px-2.5 py-1 text-primary-700 dark:text-primary-300">
            {flight.label}
          </span>
        )}
      </div>
      <div className="flex gap-2 mt-auto pt-2">
        <a
          href={flight.links?.googleFlights}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary flex-1 text-xs py-2 px-3 text-center"
        >
          Google Flights
        </a>
        <a
          href={flight.links?.skyscanner}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex-1 text-xs py-2 px-3 text-center"
        >
          Skyscanner
        </a>
      </div>
    </Card>
  );
}
