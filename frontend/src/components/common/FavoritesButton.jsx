export default function FavoritesButton({ active, onClick, size = 'md', label = 'Save' }) {
  const sizeClass = size === 'sm' ? 'p-1.5 text-sm' : 'p-2 text-base';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-lg transition-all ${sizeClass} ${
        active
          ? 'text-red-500 bg-red-50 dark:bg-red-950/30'
          : 'text-slate-400 hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
      aria-label={active ? 'Remove from favorites' : `Add to favorites`}
      aria-pressed={active}
      title={active ? 'Remove from favorites' : label}
    >
      {active ? '♥' : '♡'}
    </button>
  );
}
