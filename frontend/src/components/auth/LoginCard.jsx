import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import GlassPanel from '../layout/GlassPanel';
import Input from '../common/Input';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { login as apiLogin, register as apiRegister, googleLogin } from '../../services/authApi';

export default function LoginCard() {
  const { login, continueAsGuest, isAuthenticated, user, logout } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = mode === 'login'
        ? await apiLogin({ email: form.email, password: form.password })
        : await apiRegister(form);
      login(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await googleLogin(response.credential);
      login(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <GlassPanel className="p-6 animate-slide-up text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40 text-2xl">
          {user.avatar ? <img src={user.avatar} alt="" className="h-16 w-16 rounded-full" /> : '👤'}
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <Button variant="secondary" onClick={logout} className="w-full">
          Sign out
        </Button>
      </GlassPanel>
    );
  }

  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary-400/20 to-cyan-400/20 blur-2xl" aria-hidden="true" />
      <GlassPanel className="relative p-6 sm:p-8 animate-slide-up">
        <div className="mb-6 text-center">
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to save trips, favorites & more
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed')}
                theme="outline"
                size="large"
                width="300"
                text="continue_with"
              />
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/70 dark:bg-slate-900/70 px-2 text-slate-400">or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <Input
                label="Name"
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            )}
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              hint={mode === 'register' ? 'Min 8 chars, uppercase, lowercase, number' : undefined}
            />
            <Button type="submit" className="w-full" isLoading={loading}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="w-full text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/70 dark:bg-slate-900/70 px-2 text-slate-400">or</span>
            </div>
          </div>

          <Button variant="secondary" className="w-full" onClick={continueAsGuest}>
            Continue as Guest
          </Button>

          <p className="text-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-lg px-3 py-2">
            Your travel plans will not be saved while using Guest Mode.
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
