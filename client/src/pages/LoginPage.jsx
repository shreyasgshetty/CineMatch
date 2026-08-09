import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(formData);
      navigate(user.onboardingCompleted ? '/home' : '/onboarding/languages');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-void)' }}>

      {/* ── Left: Visual Panel ──────────────────────────────── */}
      <div className="auth-visual" style={{
        flex: '0 0 55%', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        {/* Layered cinematic background */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Base: deep gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, #03060f 0%, #0a1220 40%, #0f0507 100%)',
          }} />
          {/* Crimson glow — top left */}
          <div style={{
            position: 'absolute', top: '-15%', left: '-10%',
            width: '70%', height: '70%',
            background: 'radial-gradient(ellipse, rgba(140,28,42,0.35) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }} />
          {/* Gold glow — center right */}
          <div style={{
            position: 'absolute', top: '20%', right: '-5%',
            width: '55%', height: '55%',
            background: 'radial-gradient(ellipse, rgba(201,168,76,0.20) 0%, transparent 65%)',
            filter: 'blur(50px)',
          }} />
          {/* Deep crimson — bottom */}
          <div style={{
            position: 'absolute', bottom: '-10%', left: '20%',
            width: '60%', height: '50%',
            background: 'radial-gradient(ellipse, rgba(100,15,25,0.45) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }} />
          {/* Film strip decorative bars */}
          <FilmStripDecor />
          {/* Vignette overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'var(--gradient-vignette)', opacity: 0.5 }} />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: 'var(--space-12)' }}>
          {/* Eyebrow */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', background: 'rgba(201,168,76,0.10)',
            border: '1px solid rgba(201,168,76,0.25)', borderRadius: 'var(--radius-full)',
            marginBottom: 'var(--space-6)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', boxShadow: '0 0 6px var(--gold)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              AI-Powered Cinema
            </span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-serif)', fontWeight: 900, fontStyle: 'italic',
            fontSize: 'clamp(2rem, 3.5vw, 3.2rem)', lineHeight: 1.1,
            marginBottom: 'var(--space-6)', color: 'var(--text-primary)',
          }}>
            Discover cinema<br />
            <span className="text-gradient-gold">made for you.</span>
          </h2>

          <p style={{ color: 'var(--text-secondary)', maxWidth: 380, marginBottom: 'var(--space-8)', lineHeight: 1.7 }}>
            CineMatch learns your taste across Sandalwood, Bollywood, Hollywood
            and every industry in between — and finds films that genuinely match you.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {['🎯 Personalized picks', '🇮🇳 Indian cinema focus', '🧠 Explainable AI', '⭐ Learns from feedback'].map((f) => (
              <span key={f} style={{
                padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-default)', borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem', color: 'var(--text-secondary)',
              }}>{f}</span>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-8)' }}>
            {[['14+', 'Languages'], ['∞', 'Indian Films'], ['AI', 'Powered']].map(([val, lbl]) => (
              <div key={lbl}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.6rem', color: 'var(--gold)' }}>{val}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ───────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-8)', background: 'var(--bg-base)',
        position: 'relative', overflowY: 'auto',
        minHeight: '100vh',
      }}>
        {/* Subtle top glow */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: '200px',
          background: 'radial-gradient(ellipse at center top, rgba(201,168,76,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative' }} className="animate-fade-in">

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-8)', textDecoration: 'none' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: 'var(--shadow-gold)',
            }}>🎬</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Cine<span style={{ color: 'var(--gold)' }}>Match</span>
            </span>
          </Link>

          <h1 style={{ marginBottom: 4, fontSize: '1.75rem' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-8)', fontSize: '0.875rem' }}>
            Sign in to your personalized film dashboard
          </p>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)', color: '#FCA5A5', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <input id="login-email" type="email" name="email" className="form-input"
                placeholder="you@example.com" value={formData.email}
                onChange={handleChange} required autoComplete="email" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input id="login-password" type="password" name="password" className="form-input"
                placeholder="••••••••" value={formData.password}
                onChange={handleChange} required autoComplete="current-password" />
            </div>

            <button id="login-submit" type="submit" className="btn btn--gold btn--full btn--lg"
              style={{ marginTop: 'var(--space-2)' }} disabled={loading}>
              {loading ? <LoadingSpinner label="Signing in…" /> : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 'var(--space-6) 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>NEW HERE?</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          <Link to="/register" className="btn btn--outline-gold btn--full" style={{ justifyContent: 'center' }}>
            Create your CineMatch account
          </Link>

          <p style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            This product uses the TMDB API but is not endorsed by TMDB.
          </p>
        </div>
      </div>

      {/* Mobile styles */}
      <style>{`
        @media (max-width: 768px) {
          .auth-visual { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function FilmStripDecor() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.07 }}>
      {/* Vertical film strip lines */}
      {[8, 16, 24, 32, 40, 52, 62, 72, 82, 92].map((left, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: `${left}%`,
          width: 1, height: '100%',
          background: 'linear-gradient(180deg, transparent, var(--gold), transparent)',
          opacity: i % 3 === 0 ? 0.6 : 0.2,
        }} />
      ))}
      {/* Horizontal rule lines */}
      {[15, 30, 50, 70, 85].map((top, i) => (
        <div key={i} style={{
          position: 'absolute', left: 0, top: `${top}%`,
          height: 1, width: '100%',
          background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
          opacity: 0.3,
        }} />
      ))}
    </div>
  );
}

function LoadingSpinner({ label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
        border: '2px solid rgba(10,8,5,0.3)', borderTopColor: '#0a0805',
        animation: 'spin 0.7s linear infinite',
      }} />
      {label}
    </span>
  );
}
