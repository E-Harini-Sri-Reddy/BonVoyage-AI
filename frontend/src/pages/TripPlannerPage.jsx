import PageContainer from '../components/layout/PageContainer';
import TripForm from '../components/trip/TripForm';

export default function TripPlannerPage() {
  return (
    <PageContainer className="animate-fade-in">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Plan Your Trip
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Tell us about your dream destination — we&apos;ll handle the rest.
          </p>
        </div>

        <TripForm />
      </div>
    </PageContainer>
  );
}
