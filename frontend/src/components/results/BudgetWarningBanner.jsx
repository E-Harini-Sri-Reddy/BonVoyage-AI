export default function BudgetWarningBanner({ budgetWarning, flights, activities, currency }) {
  if (!budgetWarning || budgetWarning.sufficient) return null;

  const cheapestFlights = (flights || [])
    .filter((f) => f.price != null)
    .sort((a, b) => (a.price || 0) - (b.price || 0))
    .slice(0, 3);

  const budgetActivities = (activities || [])
    .filter((a) => (a.estimatedCost ?? 0) <= 15)
    .slice(0, 5);

  const fmt = (n) => `${Number(n).toLocaleString()} ${currency || budgetWarning.currency}`;

  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-5 space-y-4">
      <p className="font-semibold text-red-800 dark:text-red-300">Budget may not be sufficient</p>
      <p className="text-sm text-red-700 dark:text-red-400">{budgetWarning.message}</p>

      {budgetWarning.breakdown && (
        <div className="text-sm text-red-700 dark:text-red-400 space-y-1">
          <p className="font-medium">Estimated minimum costs:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>Flights: from {fmt(budgetWarning.breakdown.flights)}</li>
            <li>Hotels: from {fmt(budgetWarning.breakdown.hotels)}</li>
            <li>Food: from {fmt(budgetWarning.breakdown.food)}</li>
            <li>Activities: from {fmt(budgetWarning.breakdown.activities)}</li>
            <li className="font-medium">Total minimum: {fmt(budgetWarning.minimumRecommended)}</li>
          </ul>
        </div>
      )}

      {cheapestFlights.length > 0 && (
        <div className="text-sm text-red-700 dark:text-red-400 space-y-1">
          <p className="font-medium">Cheapest flight options found:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {cheapestFlights.map((f, i) => (
              <li key={`bf-${i}-${f.airline}-${f.route}`}>
                {f.airline || f.label} — {f.route}
                {f.price != null ? ` (${fmt(f.price)})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {budgetActivities.length > 0 && (
        <div className="text-sm text-red-700 dark:text-red-400 space-y-1">
          <p className="font-medium">Lowest-cost activities:</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {budgetActivities.map((a, i) => (
              <li key={`ba-${i}-${a.title}`}>
                {a.title}
                {a.estimatedCost != null ? ` — ${fmt(a.estimatedCost)}` : ' — free'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {budgetWarning.cheapestTips?.length > 0 && (
        <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 list-disc pl-5">
          {budgetWarning.cheapestTips.map((tip, i) => (
            <li key={`bt-${i}`}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
