export default function Badge({ children, active = false, onClick, className = '', ...props }) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 cursor-pointer select-none';
  const state = active
    ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-400/50 scale-[1.02]'
    : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950/30';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${state} ${className}`} aria-pressed={active} {...props}>
        {children}
      </button>
    );
  }

  return (
    <span className={`${base} ${state} ${className}`} {...props}>
      {children}
    </span>
  );
}
