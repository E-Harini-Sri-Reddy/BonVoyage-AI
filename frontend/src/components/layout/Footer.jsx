export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} BonVoyage AI. Crafted with AI-powered precision.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Portfolio project — authentication coming soon
        </p>
      </div>
    </footer>
  );
}
