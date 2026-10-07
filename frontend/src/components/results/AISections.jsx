import Card from '../common/Card';
import { formatCurrency } from '../../utils/formatters';
import { formatDate } from '../../utils/formatters';
import FavoritesButton from '../common/FavoritesButton';
import { usePackingChecklistForTrip } from '../../hooks/usePackingChecklist';
import { useTrip } from '../../context/TripContext';
import { resolveDisplayBudget } from '../../utils/budgetAllocation';

export function OptimizerItinerarySection({ optimizer, itinerary }) {
  if (!optimizer && !itinerary?.length) return null;

  return (
    <div className="space-y-6">
      {optimizer?.highlights?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {optimizer.highlights.map((h, i) => (
            <span
              key={`opt-hl-${i}-${h}`}
              className="rounded-full bg-primary-100 dark:bg-primary-900/40 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300"
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {optimizer?.decisions?.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {optimizer.decisions.map((d, i) => (
            <Card key={`${d.category}-${i}`} className="border-l-4 border-l-primary-500">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
                {d.category}
              </p>
              <p className="font-semibold text-slate-900 dark:text-white mt-1">{d.choice}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{d.reason}</p>
            </Card>
          ))}
        </div>
      )}

      {itinerary?.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Day-by-day plan
          </h3>
          {itinerary.map((day) => (
            <Card key={day.day || day.date}>
              <h4 className="font-display font-bold text-slate-900 dark:text-white mb-1">
                Day {day.day} — {day.date ? formatDate(day.date) : ''}
              </h4>
              {day.notes && (
                <p className="text-xs text-primary-600 dark:text-primary-400 mb-3 italic">{day.notes}</p>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                {['morning', 'afternoon', 'evening'].map((period) => (
                  <div key={period} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                    <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400 mb-1">
                      {period}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{day[period]}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function OptimizerSection({ optimizer }) {
  if (!optimizer) return null;

  return (
    <div className="space-y-4">
      {optimizer.highlights?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {optimizer.highlights.map((h, i) => (
            <span key={`hl-${i}-${h}`} className="rounded-full bg-primary-100 dark:bg-primary-900/40 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300">
              {h}
            </span>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {optimizer.decisions?.map((d, i) => (
          <Card key={`${d.category}-${i}`} className="border-l-4 border-l-primary-500">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">{d.category}</p>
            <p className="font-semibold text-slate-900 dark:text-white mt-1">{d.choice}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{d.reason}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ItinerarySection({ itinerary }) {
  if (!itinerary?.length) return null;

  return (
    <div className="space-y-4">
      {itinerary.map((day) => (
        <Card key={day.day || day.date}>
          <h3 className="font-display font-bold text-slate-900 dark:text-white mb-3">
            Day {day.day} — {day.date ? formatDate(day.date) : ''}
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {['morning', 'afternoon', 'evening'].map((period) => (
              <div key={period} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                <p className="text-xs font-semibold uppercase text-primary-600 dark:text-primary-400 mb-1">{period}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{day[period]}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

export function BudgetSection({
  budget,
  currency,
  totalBudget,
  flights,
  hotels,
  activities,
  travellers,
  fromDate,
  toDate,
}) {
  const resolved = resolveDisplayBudget(budget, {
    totalBudget,
    currency,
    travellers,
    fromDate,
    toDate,
    flights,
    hotels,
    activities,
  });
  if (!resolved) return null;

  const items = [
    { label: 'Flights', value: resolved.flights },
    { label: 'Hotels', value: resolved.hotels },
    { label: 'Food', value: resolved.food },
    { label: 'Activities', value: resolved.activities },
    { label: 'Emergency Buffer', value: resolved.emergencyBuffer },
  ].filter((i) => i.value != null);

  const total = resolved.total || items.reduce((s, i) => s + (i.value || 0), 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ label, value }) => (
        <Card key={label}>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(value, currency)}</p>
          {total > 0 && (
            <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-primary-500"
                style={{ width: `${Math.min((value / total) * 100, 100)}%` }}
              />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

export function PackingSection({ packing }) {
  const { input } = useTrip();
  const { toggleItem, isChecked, checkedCount, total, progress, resetChecklist } =
    usePackingChecklistForTrip(input, packing);

  if (!packing?.length) return null;

  const grouped = packing.reduce((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{checkedCount} of {total} packed</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-300 max-w-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {checkedCount > 0 && (
          <button
            type="button"
            onClick={resetChecklist}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">{category}</h3>
            <ul className="space-y-2">
              {items.map((item) => {
                const checked = isChecked(item.item);
                return (
                  <li key={`${category}-${item.item}`}>
                    <label className="flex items-start gap-2 text-sm cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(item.item)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className={checked ? 'opacity-50 line-through' : ''}>
                        <span className="text-slate-800 dark:text-slate-200 group-hover:text-primary-600">
                          {item.item}
                        </span>
                        {item.reason && (
                          <p className="text-xs text-slate-400 no-underline">{item.reason}</p>
                        )}
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SummarySection({ summary }) {
  if (!summary) return null;

  return (
    <Card className="bg-gradient-to-br from-primary-50 to-cyan-50 dark:from-primary-950/30 dark:to-cyan-950/20 border-primary-200/50 dark:border-primary-800/30">
      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{summary.text}</p>
      {summary.highlights?.length > 0 && (
        <ul className="mt-4 space-y-1">
          {summary.highlights.map((h, i) => (
            <li key={`sum-hl-${i}-${h}`} className="text-sm text-primary-700 dark:text-primary-300">• {h}</li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
        {summary.pace && <span>Pace: {summary.pace}</span>}
        {summary.weatherNote && <span>Weather: {summary.weatherNote}</span>}
        {summary.budgetNote && <span>Budget: {summary.budgetNote}</span>}
      </div>
    </Card>
  );
}
