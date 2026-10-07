import { useEffect, useState } from 'react';
import GlassPanel from '../layout/GlassPanel';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { getSavedTrips, deleteTrip } from '../../services/authApi';
import { useTrip } from '../../context/TripContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { saveCachedPlan } from '../../utils/planCache';

export default function SavedTripsPanel() {
  const { canSave } = useAuth();
  const [trips, setTrips] = useState([]);
  const { setInput, setPlan } = useTrip();
  const navigate = useNavigate();

  useEffect(() => {
    if (!canSave) return;
    getSavedTrips()
      .then(({ data }) => setTrips(data.trips || []))
      .catch(() => {});
  }, [canSave]);

  if (!canSave || !trips.length) return null;

  const handleOpen = (trip) => {
    if (trip.input) setInput(trip.input);
    if (trip.plan) {
      setPlan(trip.plan);
      saveCachedPlan(trip.input, trip.plan);
    }
    navigate(ROUTES.RESULTS);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTrip(id);
      setTrips((prev) => prev.filter((t) => (t.id || t._id) !== id));
    } catch {
      // ignore
    }
  };

  return (
    <GlassPanel className="p-5 animate-slide-up">
      <h3 className="font-display font-semibold text-slate-900 dark:text-white mb-4">
        Saved Trips
      </h3>
      <ul className="space-y-2">
        {trips.map((trip) => {
          const tripId = trip.id || trip._id;
          return (
          <li
            key={tripId}
            className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="text-lg" aria-hidden="true">🗺️</span>
            <button
              type="button"
              onClick={() => handleOpen(trip)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate">
                {trip.title || `${trip.input?.origin} → ${trip.input?.destination}`}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {trip.input?.fromDate} · {trip.input?.budget} {trip.input?.currency}
              </p>
            </button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(tripId)}>
              Delete
            </Button>
          </li>
        );
        })}
      </ul>
    </GlassPanel>
  );
}
