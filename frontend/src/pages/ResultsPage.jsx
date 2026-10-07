import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import TripSummaryBar from '../components/trip/TripSummaryBar';
import ErrorBanner from '../components/common/ErrorBanner';
import Button from '../components/common/Button';
import ResultsSection, { ResultsSectionSkeleton } from '../components/results/ResultsSection';
import WeatherSection from '../components/results/WeatherSection';
import FlightsSection from '../components/results/FlightsSection';
import HotelsSection from '../components/results/HotelsSection';
import { PlacesGrid } from '../components/results/PlaceCard';
import RestaurantsSection from '../components/results/RestaurantsSection';
import LocalInfoSection from '../components/results/LocalInfoSection';
import EmergencyQuickBar from '../components/results/EmergencyQuickBar';
import TripActionsBar from '../components/trip/TripActionsBar';
import BudgetWarningBanner from '../components/results/BudgetWarningBanner';
import { ActivitiesGrid } from '../components/results/ActivityCard';
import {
  OptimizerItinerarySection,
  BudgetSection,
  PackingSection,
  SummarySection,
} from '../components/results/AISections';
import { useTrip } from '../context/TripContext';
import { useTripPlan } from '../hooks/useTripPlan';
import { planMatchesInput } from '../utils/planCache';
import { ROUTES } from '../constants/routes';

/** Keep "Data is being fetched..." briefly for empty sections before showing no-data */
const EMPTY_GRACE_MS = 45000; // 45 seconds — real fetches should finish much sooner now

const AI_SECTION_KEYS = new Set([
  'activities',
  'optimizer',
  'budget',
  'packing',
  'summary',
  'restaurants',
]);

function hasData(plan, key) {
  if (!plan) return false;
  const value = plan[key];
  if (Array.isArray(value)) return value.length > 0;
  if (key === 'budget' && value && typeof value === 'object') {
    return ['flights', 'hotels', 'food', 'activities', 'emergencyBuffer', 'total'].some(
      (k) => Number(value[k]) > 0
    );
  }
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return !!value;
}

function hasOptimizerItinerary(plan) {
  return hasData(plan, 'optimizer') || hasData(plan, 'itinerary');
}

function getSectionError(plan, source) {
  const err = plan?.errors?.find((e) => e.source === source);
  return err?.message;
}

export default function ResultsPage() {
  const { input } = useTrip();
  const { generatePlan, isLoading, isRegenerating, plan, error } = useTripPlan();
  const fetchedForKeyRef = useRef(null);
  const fetchStartedAtRef = useRef(null);
  const [graceElapsed, setGraceElapsed] = useState(false);

  const tripKey = [
    input.origin,
    input.destination,
    input.fromDate,
    input.toDate,
    input.budget,
    input.currency,
    input.travellers,
    input.tripType,
    input.travellingWithPets,
    input.travellingWithDisabilities,
    input.interests?.join(','),
  ].join('|');

  useEffect(() => {
    if (!input.origin || !input.destination) return;
    if (fetchedForKeyRef.current === tripKey) return;

    if (plan && planMatchesInput(plan, input)) {
      fetchedForKeyRef.current = tripKey;
      return;
    }

    fetchedForKeyRef.current = tripKey;
    fetchStartedAtRef.current = Date.now();
    setGraceElapsed(false);
    generatePlan().catch(() => {});
  }, [tripKey, input, plan, generatePlan]);

  // Empty sections stay in "fetching" until grace period ends
  useEffect(() => {
    if (!fetchStartedAtRef.current) {
      if (plan) setGraceElapsed(true);
      return undefined;
    }
    const remaining = EMPTY_GRACE_MS - (Date.now() - fetchStartedAtRef.current);
    if (remaining <= 0) {
      setGraceElapsed(true);
      return undefined;
    }
    const timer = setTimeout(() => setGraceElapsed(true), remaining);
    return () => clearTimeout(timer);
  }, [tripKey, plan, isLoading]);

  const handleRegenerate = () => {
    fetchStartedAtRef.current = Date.now();
    setGraceElapsed(false);
    generatePlan({ force: true, regenerateAIOnly: true });
  };

  if (!input.origin || !input.destination) {
    return <Navigate to={ROUTES.PLAN} replace />;
  }

  const currency = input.currency || plan?.meta?.currency || 'USD';
  const isPageLoading = isLoading && !plan;

  const sectionLoading = (key, isEmpty) => {
    if (isPageLoading) return true;
    if (isRegenerating && AI_SECTION_KEYS.has(key)) return true;
    if (isLoading) return true;
    // Keep showing "Data is being fetched..." for empty sections during the grace window
    if (isEmpty && !graceElapsed) return true;
    return false;
  };

  const sections = [
    {
      key: 'weather',
      icon: '🌤️',
      title: 'Weather',
      subtitle: 'Daily forecasts with AI insights',
      isEmpty: !hasData(plan, 'weather'),
      emptyMessage: getSectionError(plan, 'weather') || 'No weather data found for this trip.',
      render: () => <WeatherSection weather={plan?.weather} />,
    },
    {
      key: 'flights',
      icon: '✈️',
      title: 'Flights',
      subtitle: 'Top 3 recommendations by price',
      isEmpty: !hasData(plan, 'flights'),
      emptyMessage: getSectionError(plan, 'flights') || 'No flights found for this trip.',
      render: () => <FlightsSection flights={plan?.flights} currency={currency} />,
    },
    {
      key: 'hotels',
      icon: '🏨',
      title: 'Hotels',
      subtitle: 'Best stays for your budget',
      isEmpty: !hasData(plan, 'hotels'),
      emptyMessage: getSectionError(plan, 'hotels') || 'No hotels found for this trip.',
      render: () => <HotelsSection hotels={plan?.hotels} currency={currency} />,
    },
    {
      key: 'activities',
      icon: '🎯',
      title: 'Activities',
      subtitle: '5 personalized AI suggestions',
      isEmpty: !hasData(plan, 'activities'),
      emptyMessage: 'No activity recommendations found.',
      render: () => <ActivitiesGrid activities={plan?.activities} currency={currency} />,
    },
    {
      key: 'places',
      icon: '📍',
      title: 'Places to Visit',
      subtitle: 'Landmarks, museums, parks & more',
      isEmpty: !hasData(plan, 'places'),
      emptyMessage: 'No places found for this destination.',
      render: () => <PlacesGrid places={plan?.places} />,
    },
    {
      key: 'optimizer',
      icon: '⭐',
      title: 'AI Trip Optimizer & Itinerary',
      subtitle: 'Optimized day-by-day plan balancing weather, budget & travel time',
      badge: 'Flagship',
      isEmpty: !hasOptimizerItinerary(plan),
      emptyMessage: 'No optimized itinerary generated yet.',
      render: () => (
        <OptimizerItinerarySection optimizer={plan?.optimizer} itinerary={plan?.itinerary} />
      ),
    },
    {
      key: 'budget',
      icon: '💰',
      title: 'Budget Allocation',
      subtitle: 'Smart distribution across categories',
      isEmpty: !hasData(plan, 'budget') && !Number(input.budget),
      emptyMessage: 'No budget breakdown available.',
      render: () => (
        <BudgetSection
          budget={plan?.budget}
          currency={currency}
          totalBudget={input.budget || plan?.meta?.budget}
        />
      ),
    },
    {
      key: 'packing',
      icon: '🎒',
      title: 'Packing Checklist',
      subtitle: 'Everything you need for the trip',
      isEmpty: !hasData(plan, 'packing'),
      emptyMessage: 'No packing list generated.',
      render: () => <PackingSection packing={plan?.packing} />,
    },
    {
      key: 'summary',
      icon: '📝',
      title: 'Trip Summary',
      subtitle: 'AI overview of your journey',
      isEmpty: !hasData(plan, 'summary'),
      emptyMessage: 'No trip summary available.',
      render: () => <SummarySection summary={plan?.summary} />,
    },
    {
      key: 'restaurants',
      icon: '🍽️',
      title: 'Restaurants',
      subtitle: 'Dining that fits your itinerary',
      isEmpty: !hasData(plan, 'restaurants'),
      emptyMessage: 'No restaurant recommendations found.',
      render: () => <RestaurantsSection restaurants={plan?.restaurants} />,
    },
    {
      key: 'localInfo',
      icon: 'ℹ️',
      title: 'Local Information',
      subtitle: 'Emergency numbers, currency & tips',
      isEmpty: !hasData(plan, 'localInfo'),
      emptyMessage: 'No local information available.',
      render: () => <LocalInfoSection localInfo={plan?.localInfo} />,
    },
  ];

  const apiWarnings = plan?.errors?.filter(
    (e) =>
      e.severity === 'warning' &&
      e.source !== 'weather' &&
      e.source !== 'flights' &&
      !(e.source === 'ai' && /rate limit|daily limit|cached/i.test(e.message || ''))
  );

  return (
    <PageContainer className="animate-fade-in space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Your AI Travel Plan
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {isPageLoading
              ? 'Fetching live data and generating AI recommendations...'
              : isRegenerating
                ? 'Regenerating AI recommendations...'
                : 'Powered by OpenWeather, Geoapify, Sky Scrapper & Groq AI.'}
          </p>
        </div>
        <Link to={ROUTES.PLAN} className="btn-secondary text-sm py-2.5 px-4 shrink-0">
          ← Edit Trip
        </Link>
      </div>

      <TripSummaryBar trip={input} />

      {!isPageLoading && plan?.budgetWarning && (
        <BudgetWarningBanner
          budgetWarning={plan.budgetWarning}
          flights={plan.flights}
          activities={plan.activities}
          currency={currency}
        />
      )}

      {!isPageLoading && plan && <TripActionsBar input={input} plan={plan} />}

      {!isPageLoading && plan?.localInfo && (
        <EmergencyQuickBar localInfo={plan.localInfo} />
      )}

      {error && <ErrorBanner message={error} onRetry={handleRegenerate} />}

      {apiWarnings?.length > 0 && !isPageLoading && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-1">
          {apiWarnings.map((e) => (
            <p key={e.source} className="text-sm text-amber-700 dark:text-amber-300">
              <span className="font-medium capitalize">{e.source}:</span> {e.message}
            </p>
          ))}
        </div>
      )}

      {isPageLoading ? (
        <div className="space-y-6">
          {sections.map(({ icon, title, subtitle, badge }) => (
            <ResultsSectionSkeleton key={title} icon={icon} title={title} subtitle={subtitle} badge={badge} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map(({ key, icon, title, subtitle, badge, isEmpty, emptyMessage, render }) => {
            const loading = sectionLoading(key, isEmpty);
            return (
              <ResultsSection
                key={key}
                icon={icon}
                title={title}
                subtitle={subtitle}
                badge={badge}
                isLoading={loading}
                isEmpty={!loading && isEmpty}
                emptyMessage={emptyMessage}
                loadingMessage="Data is being fetched..."
              >
                {!isEmpty ? render() : null}
              </ResultsSection>
            );
          })}

          <div className="flex justify-center pt-4">
            <Button variant="secondary" onClick={handleRegenerate} isLoading={isRegenerating}>
              Regenerate Plan
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
