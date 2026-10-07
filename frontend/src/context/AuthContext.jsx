import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, logout as apiLogout } from '../services/authApi';

const AuthContext = createContext(null);

const GUEST_KEY = 'bonvoyage_guest';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(GUEST_KEY) === 'true');
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await getMe();
      if (data.user) {
        setUser(data.user);
        setIsGuest(false);
        localStorage.removeItem(GUEST_KEY);
      } else {
        setUser(null);
      }
    } catch {
      // 502 during backend restart should not force logout UI — treat as signed out quietly
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback((userData) => {
    setUser(userData);
    setIsGuest(false);
    localStorage.removeItem(GUEST_KEY);
  }, []);

  const continueAsGuest = useCallback(() => {
    setUser(null);
    setIsGuest(true);
    localStorage.setItem(GUEST_KEY, 'true');
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem(GUEST_KEY);
  }, []);

  const isAuthenticated = Boolean(user);
  const canSave = isAuthenticated && !isGuest;

  const value = useMemo(
    () => ({
      user,
      isGuest,
      isAuthenticated,
      canSave,
      loading,
      login,
      logout,
      continueAsGuest,
      refreshUser,
    }),
    [user, isGuest, isAuthenticated, canSave, loading, login, logout, continueAsGuest, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
