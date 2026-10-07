import { formatDateRange } from '../../utils/formatters';
import { shortLocation } from '../../utils/formatLocation';
import GlassPanel from '../layout/GlassPanel';

export default function RecentSearches({ searches, onClear, onRemove, onSelect }) {
  if (!searches?.length) return null;

  return (
    <GlassPanel className="p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-slate-900 dark:text-white">Recent Searches</h3>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          Clear all
        </button>
      </div>
      <ul className="space-y-2">
        {searches.map((search, index) => (
          <li
            key={search.id || `${search.origin}-${search.destination}-${search.fromDate}-${index}`}
            className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <button
              type="button"
              onClick={() => onSelect(search)}
              className="flex flex-1 min-w-0 flex-col gap-0.5 px-2 py-2 text-sm text-left"
            >
              <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                {shortLocation(search.origin)} → {shortLocation(search.destination)}
              </span>
              <span className="text-xs text-slate-400">
                {search.fromDate && search.toDate
                  ? formatDateRange(search.fromDate, search.toDate)
                  : `${search.travellers} traveller${search.travellers !== 1 ? 's' : ''}`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onRemove(search)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              aria-label={`Remove ${search.origin} to ${search.destination}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}
