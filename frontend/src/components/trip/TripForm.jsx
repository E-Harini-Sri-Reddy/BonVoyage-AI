import { useNavigate } from 'react-router-dom';
import { TRIP_TYPES } from '../../constants/tripTypes';
import { CURRENCIES } from '../../constants/currencies';
import { ROUTES } from '../../constants/routes';
import { getTodayString } from '../../utils/validation';
import { useTripForm } from '../../hooks/useTripForm';
import { useDetectCurrency } from '../../hooks/useDetectCurrency';
import { useTrip } from '../../context/TripContext';
import GlassPanel from '../layout/GlassPanel';
import Input from '../common/Input';
import LocationAutocomplete from './LocationAutocomplete';
import Select from '../common/Select';
import InterestPicker from './InterestPicker';
import Button from '../common/Button';
import Toggle from '../common/Toggle';

export default function TripForm() {
  const navigate = useNavigate();
  const { clearPlan } = useTrip();
  const { form, errors, isValid, updateField, toggleInterest, validate, touchField, touched } = useTripForm();
  useDetectCurrency();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    clearPlan();
    navigate(ROUTES.RESULTS);
  };

  const showError = (field) => (touched[field] || errors[field]) && errors[field];

  return (
    <GlassPanel as="form" onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8 animate-slide-up" noValidate>
      {/* Trip Details */}
      <fieldset className="space-y-5">
        <legend className="font-display text-lg font-bold text-slate-900 dark:text-white mb-1">Trip Details</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <LocationAutocomplete
            label="Flying From"
            name="origin"
            placeholder="e.g. JFK, London, India"
            value={form.origin}
            onChange={(val) => updateField('origin', val)}
            onBlur={() => touchField('origin')}
            error={showError('origin')}
            hint="Airport code, city, or country"
          />
          <LocationAutocomplete
            label="Flying To"
            name="destination"
            placeholder="e.g. Paris, Tokyo, BKK"
            value={form.destination}
            onChange={(val) => updateField('destination', val)}
            onBlur={() => touchField('destination')}
            error={showError('destination')}
            hint="Airport code, city, or country"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="From Date"
            name="fromDate"
            type="date"
            min={getTodayString()}
            value={form.fromDate}
            onChange={(e) => updateField('fromDate', e.target.value)}
            onBlur={() => touchField('fromDate')}
            error={showError('fromDate')}
          />
          <Input
            label="To Date"
            name="toDate"
            type="date"
            min={form.fromDate || getTodayString()}
            value={form.toDate}
            onChange={(e) => updateField('toDate', e.target.value)}
            onBlur={() => touchField('toDate')}
            error={showError('toDate')}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Number of Travellers"
            name="travellers"
            type="number"
            min={1}
            max={20}
            value={form.travellers}
            onChange={(e) => updateField('travellers', e.target.value)}
            onBlur={() => touchField('travellers')}
            error={showError('travellers')}
          />
          <Input
            label="Total Trip Budget"
            name="budget"
            type="number"
            min={1}
            step={100}
            placeholder="5000"
            value={form.budget}
            onChange={(e) => updateField('budget', e.target.value)}
            onBlur={() => touchField('budget')}
            error={showError('budget')}
          />
          <Select
            label="Currency"
            name="currency"
            value={form.currency}
            onChange={(e) => updateField('currency', e.target.value)}
            onBlur={() => touchField('currency')}
            error={showError('currency')}
            options={CURRENCIES}
          />
          <Select
            label="Trip Type"
            name="tripType"
            value={form.tripType}
            onChange={(e) => updateField('tripType', e.target.value)}
            onBlur={() => touchField('tripType')}
            error={showError('tripType')}
            options={TRIP_TYPES}
          />
        </div>
      </fieldset>

      {/* Interests */}
      <fieldset>
        <InterestPicker
          selected={form.interests}
          onToggle={toggleInterest}
          error={showError('interests')}
        />
      </fieldset>

      {/* Accessibility & Pets */}
      <fieldset className="space-y-3">
        <legend className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">
          Additional Preferences
          <span className="ml-2 text-xs font-normal text-slate-400">(optional)</span>
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Travelling with pets"
            description="We'll prioritize pet-friendly hotels and activities"
            checked={Boolean(form.travellingWithPets)}
            onChange={(val) => updateField('travellingWithPets', val)}
          />
          <Toggle
            label="Travelling with disabilities"
            description="We'll prioritize accessible venues and rest-friendly pacing"
            checked={Boolean(form.travellingWithDisabilities)}
            onChange={(val) => updateField('travellingWithDisabilities', val)}
          />
        </div>
      </fieldset>

      {/* Submit */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {isValid ? '✓ All fields look good — ready to plan!' : 'Fill in all required fields to continue.'}
        </p>
        <Button type="submit" disabled={!isValid} className="w-full sm:w-auto">
          Plan My Trip
          <span aria-hidden="true">→</span>
        </Button>
      </div>
    </GlassPanel>
  );
}
