/**
 * AuthContext — Global Authentication State
 *
 * Provides: user, token, login(), logout(), isLoading, isAuthenticated
 * Uses: localStorage for persistence (token + user object)
 *
 * Why Context over a global store?
 * AuthContext is simple enough that React Context handles it well.
 * For larger state (recommendations, media lists), we'll use local state
 * with React Query for server caching.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // True until we've checked localStorage

  // ── Restore session from localStorage on mount ─────────────
  useEffect(() => {
    const token = localStorage.getItem('cinematch_token');
    const savedUser = localStorage.getItem('cinematch_user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Optionally verify the token is still valid
        authApi.me()
          .then(res => setUser(res.data.user))
          .catch(() => {
            // Token expired or invalid — clear storage
            localStorage.removeItem('cinematch_token');
            localStorage.removeItem('cinematch_user');
            setUser(null);
          })
          .finally(() => setIsLoading(false));
      } catch {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // ── Login: store token + user, update state ─────────────────
  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);
    const { token, user: userData } = res.data;

    localStorage.setItem('cinematch_token', token);
    localStorage.setItem('cinematch_user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  // ── Register: same flow as login ────────────────────────────
  const register = useCallback(async (data) => {
    const res = await authApi.register(data);
    const { token, user: userData } = res.data;

    localStorage.setItem('cinematch_token', token);
    localStorage.setItem('cinematch_user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  // ── Logout ───────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('cinematch_token');
    localStorage.removeItem('cinematch_user');
    setUser(null);
  }, []);

  // ── Update user state after onboarding completes ────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('cinematch_user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    onboardingCompleted: user?.onboardingCompleted ?? false,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Custom Hook ──────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}

export default AuthContext;
