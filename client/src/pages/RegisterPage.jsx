import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * RegisterPage — /register
 * Same split layout as LoginPage for visual consistency.
 */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await register({ name: formData.name, email: formData.email, password: formData.password });
      navigate('/onboarding/languages');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
      }}>
        <div style={{ width: '100%', maxWidth: 400 }} className="animate-fade-in">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-8)', textDecoration: 'none' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-md)',
              background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', boxShadow: 'var(--shadow-brand)',
            }}>🎬</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'var(--text-2xl)', color: 'var(--color-text-primary)' }}>
              Cine<span style={{ color: 'var(--color-brand-primary)' }}>Match</span>
            </span>
          </Link>

          <h1 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-2)' }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-sm)' }}>
            Set up your profile and start getting personalized recommendations
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-4)', color: 'var(--color-error)', fontSize: 'var(--text-sm)',
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <input id="reg-name" type="text" name="name" className="form-input"
                placeholder="Shreyas Shetty" value={formData.name}
                onChange={handleChange} required autoComplete="name" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" name="email" className="form-input"
                placeholder="you@example.com" value={formData.email}
                onChange={handleChange} required autoComplete="email" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input id="reg-password" type="password" name="password" className="form-input"
                placeholder="Min. 6 characters" value={formData.password}
                onChange={handleChange} required autoComplete="new-password" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
              <input id="reg-confirm" type="password" name="confirmPassword" className="form-input"
                placeholder="••••••••" value={formData.confirmPassword}
                onChange={handleChange} required autoComplete="new-password" />
            </div>

            <button
              id="register-submit"
              type="submit"
              className="btn btn--primary btn--full"
              style={{ marginTop: 'var(--space-2)', padding: 'var(--space-4)' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="animate-spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                  Creating account…
                </span>
              ) : 'Create Account → Start Onboarding'}
            </button>
          </form>

          <p style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-brand-primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>

      {/* ── Right: Onboarding Preview ────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden' }} className="auth-visual">
        <div style={{
          height: '100%', minHeight: '100vh',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 'var(--space-12)',
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(232,87,42,0.15) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 70%, rgba(244,165,51,0.10) 0%, transparent 60%),
            var(--color-bg-surface)
          `,
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', lineHeight: 1.2, marginBottom: 'var(--space-6)' }}>
            Your personalized<br />
            <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              film journey
            </span> starts here.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              '✅ Select your preferred languages',
              '✅ Rate movies you\'ve already watched',
              '✅ Tell us your genre preferences',
              '✅ Choose favourite actors & directors',
              '🎬 Get personalised recommendations!',
            ].map((step, i) => (
              <div
                key={i}
                className="animate-fade-in"
                style={{
                  animationDelay: `${i * 80}ms`,
                  padding: 'var(--space-3) var(--space-4)',
                  background: i === 4 ? 'rgba(232,87,42,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${i === 4 ? 'rgba(232,87,42,0.3)' : 'var(--color-border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  color: i === 4 ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                  fontWeight: i === 4 ? 600 : 400,
                }}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-page { grid-template-columns: 1fr !important; }
          .auth-visual { display: none !important; }
        }
      `}</style>
    </div>
  );
}
