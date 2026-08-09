import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * LoginPage — /login
 *
 * Design: Split layout with cinematic backdrop on right, form on left.
 * Uses CSS variable-based design system, no inline style sprawl.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(formData);
      navigate(user.onboardingCompleted ? '/home' : '/onboarding/languages');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: 'var(--color-bg-base)',
    }} className="auth-page">

      {/* ── Left: Form ─────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-12) var(--space-8)',
        minHeight: '100vh',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="animate-fade-in">

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-8)', textDecoration: 'none' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', boxShadow: 'var(--shadow-brand)',
            }}>🎬</div>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 900,
              fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)',
            }}>
              Cine<span style={{ color: 'var(--color-brand-primary)' }}>Match</span>
            </span>
          </Link>

          <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-2)' }}>
            Welcome back
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-sm)' }}>
            Sign in to get your personalized recommendations
          </p>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)',
              color: 'var(--color-error)',
              fontSize: 'var(--text-sm)',
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                name="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn--primary btn--full"
              style={{ marginTop: 'var(--space-2)', padding: 'var(--space-4)' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="animate-spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            New to CineMatch?{' '}
            <Link to="/register" style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}>
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right: Cinematic Visual ─────────────────────── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--color-bg-surface)',
      }} className="auth-visual">
        <CinematicPanel />
      </div>

      {/* Mobile: hide right panel */}
      <style>{`
        @media (max-width: 768px) {
          .auth-page { grid-template-columns: 1fr !important; }
          .auth-visual { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function CinematicPanel() {
  const features = [
    { emoji: '🎯', title: 'Personalized Just For You', desc: 'AI learns your taste — Kannada, Tamil, Hindi, or Hollywood' },
    { emoji: '🧠', title: 'Smart Recommendations', desc: 'TF-IDF + collaborative filtering, not random suggestions' },
    { emoji: '⭐', title: 'Your Ratings Matter', desc: 'Every interaction improves your recommendations instantly' },
    { emoji: '🌍', title: 'Indian & International', desc: 'Sandalwood, Bollywood, Hollywood and more in one place' },
  ];

  return (
    <div style={{
      height: '100%', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: 'var(--space-12)',
      background: `
        radial-gradient(ellipse at 80% 20%, rgba(232,87,42,0.15) 0%, transparent 60%),
        radial-gradient(ellipse at 20% 80%, rgba(244,165,51,0.10) 0%, transparent 60%),
        var(--color-bg-surface)
      `,
    }}>
      <div style={{ marginBottom: 'var(--space-10)' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 900,
          fontSize: 'clamp(2rem, 3vw, 2.8rem)',
          lineHeight: 1.15, color: 'var(--color-text-primary)',
          marginBottom: 'var(--space-4)',
        }}>
          Discover cinema<br />
          <span style={{
            background: 'var(--gradient-brand)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>made for you.</span>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: 360, lineHeight: 1.7 }}>
          CineMatch learns your preferences across Indian and international cinema
          and delivers recommendations that actually match your taste.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {features.map((f, i) => (
          <div
            key={i}
            className="animate-fade-in"
            style={{
              animationDelay: `${i * 100}ms`,
              display: 'flex', gap: 'var(--space-4)',
              padding: 'var(--space-4)',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border-subtle)',
            }}
          >
            <div style={{ fontSize: '24px', flexShrink: 0 }}>{f.emoji}</div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px', fontSize: 'var(--text-sm)' }}>
                {f.title}
              </div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                {f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
