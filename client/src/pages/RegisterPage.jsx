import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

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
    } finally { setLoading(false); }
  };

  const steps = [
    { num: 1, label: 'Pick your languages', desc: 'Kannada, Hindi, English and 11 more' },
    { num: 2, label: 'Select genres', desc: 'Action, thriller, romance and more' },
    { num: 3, label: 'Rate what you\'ve seen', desc: 'Help us understand your taste' },
    { num: 4, label: 'Get cinematic picks', desc: 'AI-matched just for you' },
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
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80%', height: '220px', background: 'radial-gradient(ellipse at center top, rgba(122,24,37,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '100%', maxWidth: 420, position: 'relative' }} className="animate-fade-in">

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 'var(--space-8)', textDecoration: 'none' }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-md)', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-gold)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0d0a02">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.35rem', color: 'var(--text-primary)' }}>
              Cine<span style={{ color: 'var(--gold)' }}>Match</span>
            </span>
          </Link>

          <h1 style={{ marginBottom: 4, fontSize: '1.75rem', fontFamily: 'var(--font-display)' }}>Create your account</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-8)', fontSize: '0.875rem' }}>
            5 minutes of setup · a lifetime of great films
          </p>

          {error && (
            <div className="info-banner info-banner--error" style={{ marginBottom: 'var(--space-4)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
              {error}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }} className="pw-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-pw">Password</label>
                <div style={{ position: 'relative' }}>
                  <input id="reg-pw" type={showPw ? 'text' : 'password'} name="password" className="form-input"
                    placeholder="Min. 6 chars" value={formData.password}
                    onChange={handleChange} required autoComplete="new-password"
                    style={{ paddingRight: 38 }} />
                  <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    {showPw ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-cpw">Confirm</label>
                <input id="reg-cpw" type={showPw ? 'text' : 'password'} name="confirmPassword" className="form-input"
                  placeholder="Repeat" value={formData.confirmPassword}
                  onChange={handleChange} required autoComplete="new-password" />
              </div>
            </div>

            <button id="register-submit" type="submit" className="btn btn--gold btn--full btn--lg"
              style={{ marginTop: 'var(--space-2)' }} disabled={loading}>
              {loading ? <LoadingSpinner label="Creating account" /> : 'Create Account and Start Onboarding'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: 'var(--space-6) 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>ALREADY A MEMBER</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          <Link to="/login" className="btn btn--outline-gold btn--full" style={{ justifyContent: 'center' }}>
            Sign in instead
          </Link>
        </div>
      </div>

      {/* ── Right: Onboarding Preview ────────────────────────── */}
      <div className="auth-visual" style={{
        flex: '0 0 46%', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'var(--space-12)',
      }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#050a08 0%,#0a1020 50%,#080308 100%)' }} />
          <div style={{ position: 'absolute', top: '10%', right: '-10%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(212,168,67,0.15) 0%, transparent 65%)', filter: 'blur(55px)' }} />
          <div style={{ position: 'absolute', bottom: '5%', left: '-5%', width: '55%', height: '55%', background: 'radial-gradient(ellipse, rgba(122,24,37,0.18) 0%, transparent 65%)', filter: 'blur(45px)' }} />
          {/* Subtle grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(212,168,67,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(212,168,67,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', background: 'rgba(212,168,67,0.09)', border: '1px solid rgba(212,168,67,0.22)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-6)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', boxShadow: '0 0 6px var(--gold)' }} />
            <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>Your journey</span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 900, fontSize: 'clamp(1.6rem,2.5vw,2.5rem)', lineHeight: 1.15, marginBottom: 'var(--space-8)' }}>
            4 steps to your<br />
            <span className="text-gradient-gold">perfect film match.</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {steps.map((step, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  padding: 'var(--space-4)',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'all var(--t-base)',
                }}>
                  {/* Step number */}
                  <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: 'rgba(212,168,67,0.10)', border: '1px solid rgba(212,168,67,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.82rem', color: 'var(--gold)' }}>
                    {step.num}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: 2 }}>{step.label}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{step.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA note */}
          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'rgba(212,168,67,0.07)', border: '1px solid rgba(212,168,67,0.18)', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 600, textAlign: 'center', letterSpacing: '0.01em' }}>
            Then get AI-matched recommendations instantly
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .auth-visual { display: none !important; } }
        @media (max-width: 480px) { .pw-grid { grid-template-columns: 1fr !important; } }
      `}</style>
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
