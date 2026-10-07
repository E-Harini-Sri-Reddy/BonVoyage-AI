import { useState } from 'react';
import Button from '../common/Button';
import FavoritesButton from '../common/FavoritesButton';
import { useFavorites } from '../../hooks/useFavorites';
import { useAuth } from '../../context/AuthContext';
import { saveTrip } from '../../services/authApi';
import { buildShareText } from '../../utils/tripHelpers';

export default function TripActionsBar({ input, plan }) {
  const { canSave } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [shareStatus, setShareStatus] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  const tripSaved = isFavorite('trip', input);

  const handleSaveTrip = async () => {
    if (!canSave) return;
    try {
      await saveTrip({
        title: `${input.origin} → ${input.destination}`,
        input,
        plan: {
          meta: plan?.meta,
          geocoding: plan?.geocoding,
          weather: plan?.weather,
          flights: plan?.flights,
          hotels: plan?.hotels,
          activities: plan?.activities,
          places: plan?.places,
          optimizer: plan?.optimizer,
          itinerary: plan?.itinerary,
          budget: plan?.budget,
          budgetWarning: plan?.budgetWarning,
          packing: plan?.packing,
          summary: plan?.summary,
          restaurants: plan?.restaurants,
          localInfo: plan?.localInfo,
        },
      });
      setSaveStatus('Trip saved!');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch (err) {
      setSaveStatus(err.message || 'Could not save trip');
      setTimeout(() => setSaveStatus(''), 4000);
    }
  };

  const handleShare = async () => {
    const text = buildShareText(input, plan);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Trip: ${input.origin} → ${input.destination}`,
          text,
        });
        setShareStatus('Shared!');
      } else {
        await navigator.clipboard.writeText(text);
        setShareStatus('Copied to clipboard!');
      }
    } catch {
      setShareStatus('Could not share');
    }

    setTimeout(() => setShareStatus(''), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-4">
      {canSave ? (
        <>
          <Button variant="secondary" size="sm" onClick={handleSaveTrip}>
            {saveStatus || '💾 Save Full Trip'}
          </Button>
          <div className="flex items-center gap-2">
            <FavoritesButton
              active={tripSaved}
              onClick={() =>
                toggleFavorite('trip', input, {
                  title: `${input.origin} → ${input.destination}`,
                  subtitle: `${input.fromDate} · ${input.budget} ${input.currency}`,
                })
              }
              label="Save to favorites"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {tripSaved ? 'In favorites' : 'Add to favorites'}
            </span>
          </div>
        </>
      ) : (
        <p className="text-sm text-amber-600 dark:text-amber-400 mr-auto">
          Sign in to save trips and favorites.
        </p>
      )}

      <div className="flex flex-wrap gap-2 ml-auto">
        <Button variant="secondary" size="sm" onClick={handleShare}>
          {shareStatus || '🔗 Share Trip'}
        </Button>
        <Button variant="ghost" size="sm" onClick={handlePrint}>
          🖨 Print
        </Button>
      </div>
    </div>
  );
}
