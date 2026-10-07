export default function Toggle({ label, description, checked, onChange, id }) {
  const toggleId = id || label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <label
      htmlFor={toggleId}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/40 p-4 transition-colors hover:border-primary-300 dark:hover:border-primary-700"
    >
      <input
        id={toggleId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
      />
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}
