import { useAuth } from '../../context/AuthContext';

export default function GuestBanner() {
  const { isGuest } = useAuth();

  if (!isGuest) return null;

  return (
    <div className="border-b border-amber-200/60 dark:border-amber-900/40 bg-amber-50/90 dark:bg-amber-950/30 px-4 py-2 text-center text-sm text-amber-800 dark:text-amber-200">
      Your travel plans will not be saved while using Guest Mode.
    </div>
  );
}
