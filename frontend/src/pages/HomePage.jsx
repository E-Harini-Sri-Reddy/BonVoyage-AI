import { Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import LoginCard from '../components/auth/LoginCard';
import RecentSearches from '../components/trip/RecentSearches';
import FavoritesPanel from '../components/trip/FavoritesPanel';
import SavedTripsPanel from '../components/trip/SavedTripsPanel';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { ROUTES } from '../constants/routes';

const FEATURES = [
  { icon: '🌤️', title: 'Weather Insights', desc: 'Day-by-day forecasts with AI explanations' },
  { icon: '✈️', title: 'Smart Flights', desc: 'Best routes sorted by price and convenience' },
  { icon: '🏨', title: 'Curated Hotels', desc: 'Ranked by budget, rating, and location' },
  { icon: '🤖', title: 'AI Optimizer', desc: 'Your entire trip balanced and explained' },
];

export default function HomePage() {
  const { recentSearches, clearRecentSearches, removeRecentSearch, loadRecentSearch } = useRecentSearches();

  return (
    <PageContainer className="animate-fade-in">
      <section className="grid min-h-[calc(100vh-12rem)] items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-100/80 dark:bg-primary-900/30 px-4 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-300">
            <span aria-hidden="true">✨</span>
            AI-Powered Travel Planning
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              Plan your perfect trip with{' '}
              <span className="bg-gradient-to-r from-primary-600 to-cyan-500 bg-clip-text text-transparent">
                BonVoyage AI
              </span>
            </h1>
            <p className="max-w-xl text-lg text-slate-600 dark:text-slate-300">
              Personalized itineraries, smart weather insights, curated flights and hotels —
              all optimized by AI in one beautiful experience.
            </p>
          </div>

          <Link to={ROUTES.PLAN} className="btn-primary text-lg px-8 py-4">
            Let&apos;s Begin
            <span aria-hidden="true">→</span>
          </Link>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl bg-white/50 dark:bg-slate-800/40 p-3 backdrop-blur-sm">
                <span className="text-xl" aria-hidden="true">{icon}</span>
                <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">{title}</p>
                <p className="text-[10px] leading-tight text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <LoginCard />
          <RecentSearches
            searches={recentSearches}
            onClear={clearRecentSearches}
            onRemove={removeRecentSearch}
            onSelect={loadRecentSearch}
          />
          <FavoritesPanel />
          <SavedTripsPanel />
        </div>
      </section>
    </PageContainer>
  );
}
