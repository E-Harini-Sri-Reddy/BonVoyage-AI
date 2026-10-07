export default function SectionHeader({ icon, title, subtitle, badge }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40 text-xl">
            {icon}
          </span>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{title}</h2>
            {badge && (
              <span className="rounded-full bg-primary-100 dark:bg-primary-900/40 px-2.5 py-0.5 text-xs font-semibold text-primary-700 dark:text-primary-300">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
