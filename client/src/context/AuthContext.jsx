import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../api/authApi';
import { setAccessToken, setAuthFailureHandler, getErrorMessage } from '../api/axios';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session

  const applySession = useCallback((data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // Silent session restore on first load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await authApi.refresh();
        if (mounted) applySession(data);
      } catch {
        if (mounted) clearSession();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applySession, clearSession]);

  // Register a handler so the axios interceptor can log us out on hard failures
  useEffect(() => {
    setAuthFailureHandler(() => clearSession());
  }, [clearSession]);

  const login = useCallback(
    async (credentials) => {
      const { data } = await authApi.login(credentials);
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await authApi.register(payload);
      applySession(data);
      return data.user;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore network errors on logout */
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      getErrorMessage,
    }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
