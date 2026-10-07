import { formatCurrency, formatDateRange, getTripDuration } from '../../utils/formatters';
import { TRIP_TYPES } from '../../constants/tripTypes';
import GlassPanel from '../layout/GlassPanel';

function MetaItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40 text-base" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

export default function TripSummaryBar({ trip }) {
  if (!trip?.origin || !trip?.destination) return null;

  const tripTypeLabel = TRIP_TYPES.find((t) => t.value === trip.tripType)?.label || trip.tripType;
  const duration = trip.fromDate && trip.toDate ? getTripDuration(trip.fromDate, trip.toDate) : null;

  return (
    <GlassPanel className="p-5 sm:p-6 animate-slide-up">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetaItem icon="✈️" label="Route" value={`${trip.origin} → ${trip.destination}`} />
        <MetaItem
          icon="📅"
          label="Dates"
          value={trip.fromDate && trip.toDate ? formatDateRange(trip.fromDate, trip.toDate) : '—'}
        />
        <MetaItem
          icon="👥"
          label="Travellers"
          value={`${trip.travellers} ${trip.travellers === 1 ? 'person' : 'people'} · ${tripTypeLabel}`}
        />
        <MetaItem icon="💰" label="Budget" value={formatCurrency(Number(trip.budget), trip.currency)} />
        {duration && <MetaItem icon="🗓️" label="Duration" value={`${duration} day${duration !== 1 ? 's' : ''}`} />}
      </div>
      {(trip.interests?.length > 0 || trip.travellingWithPets || trip.travellingWithDisabilities) && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200/60 dark:border-slate-700/60 pt-4">
          {trip.interests?.map((interest) => (
            <span
              key={interest}
              className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium capitalize text-slate-600 dark:text-slate-300"
            >
              {interest}
            </span>
          ))}
          {trip.travellingWithPets && (
            <span className="rounded-full bg-teal-100 dark:bg-teal-900/30 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-300">
              🐾 Pets
            </span>
          )}
          {trip.travellingWithDisabilities && (
            <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
              ♿ Accessible
            </span>
          )}
        </div>
      )}
    </GlassPanel>
  );
}
