import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      await register({ name: formData.name, email: formData.email, password: formData.password });
      navigate('/onboarding/languages');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { emoji: '🌐', label: 'Pick your languages', desc: 'Kannada, Hindi, English and 11 more' },
    { emoji: '⭐', label: 'Rate what you\'ve seen', desc: 'Help us understand your taste' },
    { emoji: '🎭', label: 'Set genre preferences', desc: 'Action, thriller, comedy…' },
    { emoji: '🎬', label: 'Get cinematic picks', desc: 'AI-matched just for you' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-void)' }}>

      {/* ── Left: Form ──────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-8)', background: 'var(--bg-base)',
        position: 'relative', overflowY: 'auto', minHeight: '100vh',
      }}>
        {/* Top glow */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: '200px',
          background: 'radial-gradient(ellipse at center top, rgba(140,28,42,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ width: '100%', maxWidth: 420, position: 'relative' }} className="animate-fade-in">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-8)', textDecoration: 'none' }}>
            <div style={{
              width: 42, height: 42, borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: 'var(--shadow-gold)',
            }}>🎬</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--text-primary)' }}>
              Cine<span style={{ color: 'var(--gold)' }}>Match</span>
            </span>
          </Link>

          <h1 style={{ marginBottom: 4, fontSize: '1.75rem' }}>Create your account</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-8)', fontSize: '0.875rem' }}>
            5 minutes of setup · a lifetime of great films
          </p>

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
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input id="reg-name" type="text" name="name" className="form-input"
                placeholder="Your name" value={formData.name}
                onChange={handleChange} required autoComplete="name" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <input id="reg-email" type="email" name="email" className="form-input"
                placeholder="you@example.com" value={formData.email}
                onChange={handleChange} required autoComplete="email" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-pw">Password</label>
                <input id="reg-pw" type="password" name="password" className="form-input"
                  placeholder="Min. 6 chars" value={formData.password}
                  onChange={handleChange} required autoComplete="new-password" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-cpw">Confirm</label>
                <input id="reg-cpw" type="password" name="confirmPassword" className="form-input"
                  placeholder="Repeat" value={formData.confirmPassword}
                  onChange={handleChange} required autoComplete="new-password" />
              </div>
            </div>

            <button id="register-submit" type="submit" className="btn btn--gold btn--full btn--lg"
              style={{ marginTop: 'var(--space-2)' }} disabled={loading}>
              {loading
                ? <LoadingSpinner label="Creating account…" />
                : '🎬  Create Account & Start Onboarding'
              }
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 'var(--space-6) 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ALREADY A MEMBER?</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          <Link to="/login" className="btn btn--outline-gold btn--full" style={{ justifyContent: 'center' }}>
            Sign in instead
          </Link>
        </div>
      </div>

      {/* ── Right: Onboarding Preview ────────────────────────── */}
      <div className="auth-visual" style={{
        flex: '0 0 48%', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'var(--space-12)',
      }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #030c05 0%, #0a1020 50%, #0c0308 100%)' }} />
          <div style={{ position: 'absolute', top: '10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(201,168,76,0.18) 0%, transparent 65%)', filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', bottom: '5%', left: '-5%', width: '55%', height: '55%', background: 'radial-gradient(ellipse, rgba(140,28,42,0.20) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', background: 'rgba(201,168,76,0.10)',
            border: '1px solid rgba(201,168,76,0.25)', borderRadius: 'var(--radius-full)',
            marginBottom: 'var(--space-6)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', boxShadow: '0 0 6px var(--gold)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              Your journey
            </span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 900,
            fontSize: 'clamp(1.6rem, 2.5vw, 2.6rem)', lineHeight: 1.15,
            marginBottom: 'var(--space-8)',
          }}>
            4 steps to your<br />
            <span className="text-gradient-gold">perfect film match.</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {steps.map((step, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'all var(--t-base)',
                }}>
                  {/* Step number */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(201,168,76,0.12)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.8rem', color: 'var(--gold)',
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 2 }}>
                      {step.emoji} {step.label}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{step.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Final line */}
          <div style={{
            marginTop: 'var(--space-6)', padding: 'var(--space-4)',
            background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.20)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 600,
            textAlign: 'center',
          }}>
            🎯 Then get AI-matched recommendations instantly
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-visual { display: none !important; }
        }
        @media (max-width: 480px) {
          #reg-pw, #reg-cpw { grid-column: 1 / -1 !important; }
        }
      `}</style>
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
