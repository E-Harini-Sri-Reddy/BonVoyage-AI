import GlassPanel from '../layout/GlassPanel';

function EmergencyDial({ label, number }) {
  if (!number) return null;
  const tel = number.replace(/[^\d+]/g, '');

  return (
    <a
      href={`tel:${tel}`}
      className="flex flex-col items-center gap-1 rounded-xl bg-red-50 dark:bg-red-950/30 px-4 py-3 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
    >
      <span className="text-xs font-medium text-red-600 dark:text-red-400">{label}</span>
      <span className="text-lg font-bold text-red-700 dark:text-red-300">{number}</span>
    </a>
  );
}

export default function EmergencyQuickBar({ localInfo }) {
  if (!localInfo?.emergencyNumbers) return null;

  const { police, ambulance, fire, general, embassyNote } = localInfo.emergencyNumbers;

  return (
    <GlassPanel className="p-5 border-red-200/50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-950/10">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl" aria-hidden="true">🚨</span>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">Emergency Numbers</h3>
          <p className="text-xs text-slate-500">
            {localInfo.country ? `${localInfo.country} — tap to dial` : 'Tap to dial on mobile'}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <EmergencyDial label="Police" number={police} />
        <EmergencyDial label="Ambulance" number={ambulance} />
        <EmergencyDial label="Fire" number={fire} />
        {general && general !== police && (
          <EmergencyDial label="General" number={general} />
        )}
      </div>
      {embassyNote && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{embassyNote}</p>
      )}
    </GlassPanel>
  );
}
