import GlassPanel from '../layout/GlassPanel';
import SectionHeader from '../common/SectionHeader';
import { SkeletonCard } from '../common/Skeleton';

export default function ResultsSection({
  icon,
  title,
  subtitle,
  badge,
  children,
  isLoading,
  isEmpty,
  emptyMessage = 'No data found.',
  loadingMessage = 'Data is being fetched...',
}) {
  return (
    <GlassPanel className="p-6 sm:p-8 animate-fade-in">
      <SectionHeader icon={icon} title={title} subtitle={subtitle} badge={badge} />
      {isLoading && (
        <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30 p-8 text-center">
          <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            <span>{loadingMessage}</span>
          </div>
        </div>
      )}
      {!isLoading && !isEmpty && children}
      {!isLoading && isEmpty && (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-8 text-center">
          <p className="text-slate-400 dark:text-slate-500">{emptyMessage}</p>
        </div>
      )}
    </GlassPanel>
  );
}

export function ResultsSectionSkeleton({ icon, title, subtitle, badge, count = 3 }) {
  return (
    <GlassPanel className="p-6 sm:p-8">
      <SectionHeader icon={icon} title={title} subtitle={subtitle} badge={badge} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </GlassPanel>
  );
}
