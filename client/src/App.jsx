/**
 * App.jsx — Root Router
 *
 * Route protection strategy:
 * - <ProtectedRoute>: requires auth, redirects to /login if not authenticated
 * - <OnboardingRoute>: requires auth + onboarding NOT completed
 * - <PublicRoute>: redirects to /home if already authenticated
 *
 * Why this structure?
 * New users → /login or /register → /onboarding/* → /home
 * Returning users → /login → /home (skip onboarding)
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Spinner from './components/ui/Spinner';

// ── Lazy-loaded pages (code splitting) ──────────────────────
const LoginPage            = lazy(() => import('./pages/LoginPage'));
const RegisterPage         = lazy(() => import('./pages/RegisterPage'));
const OnboardingLanguages  = lazy(() => import('./pages/onboarding/OnboardingLanguages'));
const OnboardingVibe       = lazy(() => import('./pages/onboarding/OnboardingVibe'));
const OnboardingGenres     = lazy(() => import('./pages/onboarding/OnboardingGenres'));
const OnboardingMovies     = lazy(() => import('./pages/onboarding/OnboardingMovies'));
const OnboardingActors     = lazy(() => import('./pages/onboarding/OnboardingActors'));
const OnboardingDirectors  = lazy(() => import('./pages/onboarding/OnboardingDirectors'));
const HomePage             = lazy(() => import('./pages/HomePage'));
const RecommendationsPage  = lazy(() => import('./pages/RecommendationsPage'));
const SearchPage           = lazy(() => import('./pages/SearchPage'));
const MediaDetailPage      = lazy(() => import('./pages/MediaDetailPage'));
const ProfilePage          = lazy(() => import('./pages/ProfilePage'));
const WatchPlannerPage     = lazy(() => import('./pages/WatchPlannerPage'));

// ── Route Guards ─────────────────────────────────────────────

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, onboardingCompleted } = useAuth();
  if (isLoading) return <Spinner fullPage />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!onboardingCompleted) return <Navigate to="/onboarding/languages" replace />;
  return children;
}

function OnboardingRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Spinner fullPage />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, onboardingCompleted } = useAuth();
  if (isLoading) return <Spinner fullPage />;
  if (isAuthenticated) {
    return <Navigate to={onboardingCompleted ? '/home' : '/onboarding/languages'} replace />;
  }
  return children;
}

// ── Page Fallback ─────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Spinner size="lg" />
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Onboarding Routes (auth required, no layout nav) */}
        <Route path="/onboarding/languages"  element={<OnboardingRoute><OnboardingLanguages /></OnboardingRoute>} />
        <Route path="/onboarding/vibe"        element={<OnboardingRoute><OnboardingVibe /></OnboardingRoute>} />
        <Route path="/onboarding/genres"     element={<OnboardingRoute><OnboardingGenres /></OnboardingRoute>} />
        <Route path="/onboarding/movies"     element={<OnboardingRoute><OnboardingMovies /></OnboardingRoute>} />
        <Route path="/onboarding/actors"     element={<OnboardingRoute><OnboardingActors /></OnboardingRoute>} />
        <Route path="/onboarding/directors"  element={<OnboardingRoute><OnboardingDirectors /></OnboardingRoute>} />

        {/* Main App Routes (protected + onboarding completed) */}
        <Route element={<AppLayout />}>
          <Route path="/home"         element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
          <Route path="/search"       element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/media/:id"    element={<ProtectedRoute><MediaDetailPage /></ProtectedRoute>} />
          <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/planner"      element={<ProtectedRoute><WatchPlannerPage /></ProtectedRoute>} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
