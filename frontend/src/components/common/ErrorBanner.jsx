export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 sm:flex-row sm:items-center sm:justify-between" role="alert">
      <div className="flex items-start gap-3">
        <span className="text-xl" aria-hidden="true">⚠️</span>
        <div>
          <p className="font-medium text-red-800 dark:text-red-200">Something went wrong</p>
          <p className="text-sm text-red-600 dark:text-red-300">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary shrink-0 text-sm py-2 px-4">
          Try again
        </button>
      )}
    </div>
  );
}
