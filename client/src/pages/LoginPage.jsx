import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

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
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-void)' }}>

      {/* ── Left: Visual Panel ──────────────────────────────── */}
      <div className="auth-visual" style={{
        flex: '0 0 55%', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        {/* Layered background */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#07080e 0%,#0d1220 40%,#080508 100%)' }} />
          <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: '70%', height: '70%', background: 'radial-gradient(ellipse, rgba(122,24,37,0.30) 0%, transparent 65%)', filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', top: '20%', right: '-5%', width: '55%', height: '55%', background: 'radial-gradient(ellipse, rgba(212,168,67,0.18) 0%, transparent 65%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '20%', width: '60%', height: '50%', background: 'radial-gradient(ellipse, rgba(90,14,22,0.40) 0%, transparent 65%)', filter: 'blur(45px)' }} />
          <FilmStripDecor />
          {/* Diagonal accent lines */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.04 }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ position: 'absolute', left: '-20%', top: `${15 + i * 20}%`, width: '140%', height: 1, background: 'linear-gradient(90deg,transparent,var(--gold),transparent)', transform: 'rotate(-8deg)' }} />
            ))}
          </div>
          <div style={{ position: 'absolute', inset: 0, background: 'var(--gradient-vignette)', opacity: 0.45 }} />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: 'var(--space-12)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'rgba(212,168,67,0.10)', border: '1px solid rgba(212,168,67,0.24)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-6)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', boxShadow: '0 0 6px var(--gold)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>AI-Powered Cinema</span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontStyle: 'italic', fontSize: 'clamp(2rem,3.5vw,3.2rem)', lineHeight: 1.1, marginBottom: 'var(--space-5)', color: 'var(--text-primary)' }}>
            Discover cinema<br />
            <span className="text-gradient-gold">made for you.</span>
          </h2>

          <p style={{ color: 'var(--text-secondary)', maxWidth: 380, marginBottom: 'var(--space-8)', lineHeight: 1.8 }}>
            CineMatch learns your taste across Sandalwood, Bollywood, Hollywood
            and every industry in between — and finds films that genuinely match you.
          </p>

          {/* Feature pills — no emojis */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {['Personalized picks', 'Indian cinema focus', 'Explainable AI', 'Learns from feedback'].map((f) => (
              <span key={f} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.045)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', color: 'var(--text-secondary)', letterSpacing: '0.01em' }}>
                {f}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 'var(--space-8)', marginTop: 'var(--space-8)' }}>
            {[['14+', 'Languages'], ['∞', 'Indian Films'], ['AI', 'Powered']].map(([val, lbl]) => (
              <div key={lbl}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.7rem', color: 'var(--gold)', letterSpacing: '-0.02em' }}>{val}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{lbl}</div>
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
        position: 'relative', overflowY: 'auto', minHeight: '100vh',
      }}>
        {/* Subtle top glow */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: '220px', background: 'radial-gradient(ellipse at center top, rgba(212,168,67,0.055) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 400, position: 'relative' }} className="animate-fade-in">

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-10)', textDecoration: 'none' }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-gold)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0d0a02">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.35rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Cine<span style={{ color: 'var(--gold)' }}>Match</span>
            </span>
          </Link>

          <h1 style={{ marginBottom: 4, fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-8)', fontSize: '0.875rem' }}>
            Sign in to your personalized film dashboard
          </p>

          {/* Error */}
          {error && (
            <div className="info-banner info-banner--error" style={{ marginBottom: 'var(--space-4)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
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
              <div style={{ position: 'relative' }}>
                <input id="login-password" type={showPw ? 'text' : 'password'} name="password" className="form-input"
                  placeholder="••••••••" value={formData.password}
                  onChange={handleChange} required autoComplete="current-password"
                  style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button id="login-submit" type="submit" className="btn btn--gold btn--full btn--lg"
              style={{ marginTop: 'var(--space-2)' }} disabled={loading}>
              {loading ? <LoadingSpinner label="Signing in" /> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 'var(--space-6) 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>NEW HERE</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          <Link to="/register" className="btn btn--outline-gold btn--full" style={{ justifyContent: 'center' }}>
            Create your CineMatch account
          </Link>

          <p style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-disabled)' }}>
            This product uses the TMDB API but is not endorsed by TMDB.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .auth-visual { display: none !important; } }
      `}</style>
    </div>
  );
}

function FilmStripDecor() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.06 }}>
      {[8,22,36,52,66,80].map((left, i) => (
        <div key={i} style={{ position: 'absolute', top: 0, left: `${left}%`, width: 1, height: '100%', background: 'linear-gradient(180deg,transparent,var(--gold),transparent)', opacity: i % 2 === 0 ? 0.7 : 0.3 }} />
      ))}
      {[12,28,48,68,84].map((top, i) => (
        <div key={i} style={{ position: 'absolute', left: 0, top: `${top}%`, height: 1, width: '100%', background: 'linear-gradient(90deg,transparent,var(--gold),transparent)', opacity: 0.25 }} />
      ))}
    </div>
  );
}

function LoadingSpinner({ label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(10,8,5,0.3)', borderTopColor: '#0d0a02', animation: 'spin 0.7s linear infinite' }} />
      {label}
    </span>
  );
}
