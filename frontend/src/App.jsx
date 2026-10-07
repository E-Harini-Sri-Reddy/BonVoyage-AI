import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import TripPlannerPage from './pages/TripPlannerPage';
import ResultsPage from './pages/ResultsPage';
import { TripProvider } from './context/TripContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ROUTES } from './constants/routes';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppLayout({ children }) {
  return (
    <div className="page-gradient flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AppRoutes() {
  return (
    <AppLayout>
      <Routes>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.PLAN} element={<TripPlannerPage />} />
        <Route path={ROUTES.RESULTS} element={<ResultsPage />} />
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  const content = (
    <ThemeProvider>
      <AuthProvider>
        <TripProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TripProvider>
      </AuthProvider>
    </ThemeProvider>
  );

  if (googleClientId) {
    return <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>;
  }

  return content;
}
