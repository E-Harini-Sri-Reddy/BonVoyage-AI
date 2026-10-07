import Card from '../common/Card';

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4 py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}

function EmergencyRow({ label, number }) {
  if (!number) return null;
  const tel = number.replace(/[^\d+]/g, '');

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
      <a
        href={`tel:${tel}`}
        className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline"
      >
        {number}
      </a>
    </div>
  );
}

export default function LocalInfoSection({ localInfo }) {
  if (!localInfo) return null;

  const emergency = localInfo.emergencyNumbers;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Essentials</h3>
        <InfoRow label="Country" value={localInfo.country || '—'} />
        <InfoRow label="Currency" value={localInfo.localCurrency || localInfo.currency} />
        <InfoRow label="Time Zone" value={localInfo.timeZone} />
        <InfoRow label="Power Plug" value={localInfo.powerPlug} />
        <InfoRow label="Language" value={localInfo.language} />
      </Card>
      <Card>
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Emergency Numbers</h3>
        <EmergencyRow label="Police" number={emergency?.police} />
        <EmergencyRow label="Ambulance" number={emergency?.ambulance} />
        <EmergencyRow label="Fire" number={emergency?.fire} />
        {emergency?.general && <EmergencyRow label="General" number={emergency.general} />}
        {emergency?.embassyNote && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{emergency.embassyNote}</p>
        )}
      </Card>
      <Card className="sm:col-span-2">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Transport Tips</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {localInfo.transportTips?.map((tip, i) => <li key={`transport-${i}`}>{tip}</li>)}
        </ul>
      </Card>
      <Card className="sm:col-span-2">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Safety Tips</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {localInfo.safetyTips?.map((tip, i) => <li key={`safety-${i}`}>{tip}</li>)}
        </ul>
      </Card>
    </div>
  );
}
