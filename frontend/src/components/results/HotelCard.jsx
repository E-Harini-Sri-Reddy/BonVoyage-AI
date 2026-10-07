import { formatCurrency } from '../../utils/formatters';
import Card from '../common/Card';
import FavoritesButton from '../common/FavoritesButton';

export default function HotelCard({ hotel, currency, onFavorite, isFavorited }) {
  return (
    <Card hover className="min-w-[280px] snap-start flex flex-col gap-3 relative">
      {onFavorite && (
        <div className="absolute top-3 right-3">
          <FavoritesButton active={isFavorited} onClick={onFavorite} size="sm" />
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate">{hotel.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{hotel.address}</p>
        </div>
        {hotel.rating && (
          <span className="shrink-0 rounded-lg bg-amber-100 dark:bg-amber-900/30 px-2 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            ★ {hotel.rating.toFixed(1)}
          </span>
        )}
      </div>
      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
        {formatCurrency(hotel.price, currency || hotel.currency)}
        <span className="text-xs font-normal text-slate-400"> /night</span>
      </p>
      {hotel.distanceToCentre != null && (
        <p className="text-xs text-slate-500">{hotel.distanceToCentre} km from city centre</p>
      )}
      {hotel.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hotel.amenities.slice(0, 4).map((a) => (
            <span key={a} className="rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300">
              {a}
            </span>
          ))}
        </div>
      )}
      <a href={hotel.bookUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-2 mt-auto">
        Book Now
      </a>
    </Card>
  );
}
