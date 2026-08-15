import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Play, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FullPosterUniverse from '../components/auth/FullPosterUniverse';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

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

  // Field Validation Checks
  const isNameValid = formData.name.trim().length >= 2;
  const isEmailValid = formData.email.includes('@') && formData.email.includes('.');
  const isPwValid = formData.password.length >= 6;
  const isCpwValid = formData.confirmPassword.length >= 6 && formData.confirmPassword === formData.password;

  // Form Progress Step (0 to 1)
  const formProgress = useMemo(() => {
    let score = 0;
    if (isNameValid) score += 0.25;
    if (isEmailValid) score += 0.25;
    if (isPwValid) score += 0.25;
    if (isCpwValid) score += 0.25;
    return score;
  }, [isNameValid, isEmailValid, isPwValid, isCpwValid]);

  // Current Step Label & Headline
  const currentStepInfo = useMemo(() => {
    if (formProgress < 0.5) {
      return {
        stepNum: '01',
        stepLabel: 'Tell us who you are',
        headline: 'Build your movie universe.',
        stage: 'IDENTITY'
      };
    } else if (formProgress < 1.0) {
      return {
        stepNum: '02',
        stepLabel: 'Secure your account',
        headline: 'Your story starts here.',
        stage: 'TASTE'
      };
    } else {
      return {
        stepNum: '03',
        stepLabel: 'Ready to discover',
        headline: 'Your next obsession is waiting.',
        stage: 'MATCH'
      };
    }
  }, [formProgress]);

  // Password Strength Feedback
  const pwStrength = useMemo(() => {
    const p = formData.password;
    if (!p) return { level: 0, label: '', color: 'transparent' };
    if (p.length < 6) return { level: 1, label: 'WEAK', color: '#E74C3C' };
    if (p.length < 8) return { level: 2, label: 'DEVELOPING', color: '#E67E22' };
    if (/[0-9!@#$%^&*]/.test(p)) return { level: 4, label: 'READY', color: '#D4A843' };
    return { level: 3, label: 'STRONG', color: '#F1C40F' };
  }, [formData.password]);

  const floatingMarkers = [
    { num: '①', label: 'LANGUAGE', desc: 'Your cinema, your language', pos: 'top-left' },
    { num: '②', label: 'TASTE', desc: 'Genres that move you', pos: 'top-right' },
    { num: '③', label: 'DISCOVER', desc: 'Stories made for you', pos: 'bottom-left' },
    { num: '④', label: 'MATCH', desc: 'Your universe gets smarter', pos: 'bottom-right' }
  ];

  return (
    <div className="cinematic-register-page">
      {/* ── 1. Full Viewport 5-Lane Movie Universe Background ─── */}
      <FullPosterUniverse formProgress={formProgress} />

      {/* ── 2. Atmospheric Floating Story Markers ─────────────── */}
      <div className="floating-markers-container">
        {floatingMarkers.map((marker, idx) => (
          <div key={idx} className={`floating-story-node marker-${marker.pos}`}>
            <span className="marker-num">{marker.num}</span>
            <div className="marker-text">
              <span className="marker-label">{marker.label}</span>
              <span className="marker-desc">{marker.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Central Cinematic Focus Zone Portal ────────────── */}
      <div className="portal-focus-zone animate-fade-in">
        <div className={`cinematic-portal-frame ${formProgress === 1 ? 'frame-universe-ready' : ''}`}>

          {/* Top Progress Sequence Indicator */}
          <div className="form-progress-bar-container">
            <div className="progress-stages-track">
              <span className={`stage-tag ${formProgress >= 0 ? 'active' : ''}`}>IDENTITY</span>
              <span className="stage-connector"><span className="connector-fill" style={{ width: `${Math.min(formProgress * 2, 1) * 100}%` }} /></span>
              <span className={`stage-tag ${formProgress >= 0.5 ? 'active' : ''}`}>TASTE</span>
              <span className="stage-connector"><span className="connector-fill" style={{ width: `${Math.max(0, (formProgress - 0.5) * 2) * 100}%` }} /></span>
              <span className={`stage-tag ${formProgress === 1 ? 'active' : ''}`}>MATCH</span>
            </div>

            <div className="progress-step-row">
              <span className="step-count-badge">Step {currentStepInfo.stepNum} / 03</span>
              <span className="step-action-desc">{currentStepInfo.stepLabel}</span>
            </div>
          </div>

          {/* Portal Header */}
          <div className="portal-header">
            <Link to="/" className="portal-logo-link">
              <div className="portal-logo-box">
                <Play size={18} fill="#0d0a02" stroke="none" className="logo-play-icon" />
              </div>
              <span className="portal-brand-title">
                Cine<span className="text-gold">Match</span>
              </span>
            </Link>

            <h1 className="dynamic-headline">{currentStepInfo.headline}</h1>
            <p className="portal-subtitle">
              Create your account to unlock personalized recommendations.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="info-banner info-banner--error animate-fade-in" style={{ marginBottom: '16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Interactive Form */}
          <form onSubmit={handleSubmit} className="portal-form">

            {/* Name Field */}
            <div className="form-group">
              <div className="label-row">
                <label className="form-label" htmlFor="reg-name">Full Name</label>
                {isNameValid && <Check size={14} className="valid-check-icon animate-fade-in" />}
              </div>
              <div className="portal-input-box">
                <User className="input-field-icon" size={18} />
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  className={`form-input custom-input ${isNameValid ? 'input-valid' : ''}`}
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="form-group">
              <div className="label-row">
                <label className="form-label" htmlFor="reg-email">Email Address</label>
                {isEmailValid && <Check size={14} className="valid-check-icon animate-fade-in" />}
              </div>
              <div className="portal-input-box">
                <Mail className="input-field-icon" size={18} />
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  className={`form-input custom-input ${isEmailValid ? 'input-valid' : ''}`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password & Confirm Grid */}
            <div className="password-grid-row">
              <div className="form-group">
                <div className="label-row">
                  <label className="form-label" htmlFor="reg-pw">Password</label>
                  {isPwValid && <Check size={14} className="valid-check-icon animate-fade-in" />}
                </div>
                <div className="portal-input-box">
                  <Lock className="input-field-icon" size={18} />
                  <input
                    id="reg-pw"
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    className={`form-input custom-input ${isPwValid ? 'input-valid' : ''}`}
                    placeholder="Min. 6 chars"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    className="pw-eye-btn"
                    onClick={() => setShowPw(p => !p)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label className="form-label" htmlFor="reg-cpw">Confirm</label>
                  {isCpwValid && <Check size={14} className="valid-check-icon animate-fade-in" />}
                </div>
                <div className="portal-input-box">
                  <Lock className="input-field-icon" size={18} />
                  <input
                    id="reg-cpw"
                    type={showPw ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`form-input custom-input ${isCpwValid ? 'input-valid' : ''}`}
                    placeholder="Repeat"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* Password Strength Meter */}
            {formData.password.length > 0 && (
              <div className="pw-strength-meter animate-fade-in">
                <div className="meter-label-row">
                  <span className="meter-title">PASSWORD STRENGTH</span>
                  <span className="meter-status" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                </div>
                <div className="meter-dots-row">
                  {[1, 2, 3, 4].map(dot => (
                    <span
                      key={dot}
                      className={`meter-dot ${dot <= pwStrength.level ? 'active' : ''}`}
                      style={{ backgroundColor: dot <= pwStrength.level ? pwStrength.color : 'rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* "Your CineMatch Universe is Ready" Indicator */}
            {formProgress === 1 && (
              <div className="universe-ready-banner animate-fade-in">
                <ShieldCheck size={16} className="text-gold" />
                <span>✦ Your CineMatch universe is ready to be created.</span>
              </div>
            )}

            {/* Submit Button — BEGIN MY JOURNEY */}
            <button
              id="register-submit"
              type="submit"
              className="begin-journey-btn"
              disabled={loading}
            >
              <span className="btn-light-sweep" />
              {loading ? (
                <span className="btn-spinner-content">
                  <span className="spinner-dot-gold" />
                  Creating your movie universe...
                </span>
              ) : (
                <span className="btn-text-content">
                  <span>BEGIN MY JOURNEY</span>
                  <ArrowRight size={18} className="btn-arrow-icon" />
                </span>
              )}
            </button>
          </form>

          {/* Frame Footer */}
          <div className="portal-footer">
            <span className="footer-line" />
            <Link to="/login" className="login-link-subtle">
              Already have an account? <span className="text-gold">Sign in</span>
            </Link>
            <span className="footer-line" />
          </div>

        </div>
      </div>

      {/* ── CSS Styling ─────────────────────────────────────────── */}
      <style>{`
        .cinematic-register-page {
          min-height: 100vh;
          position: relative;
          background: #06080e;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-x: hidden;
          padding: 40px 20px;
          color: var(--text-primary);
        }

        /* Floating Story Markers */
        .floating-markers-container {
          position: absolute;
          inset: 40px 60px;
          z-index: 2;
          pointer-events: none;
        }

        .floating-story-node {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: rgba(14, 18, 26, 0.7);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(212, 168, 67, 0.18);
          border-radius: 100px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          animation: calmFloatNode 8s ease-in-out infinite alternate;
        }

        .marker-top-left { top: 6%; left: 4%; }
        .marker-top-right { top: 6%; right: 4%; animation-delay: 2s; }
        .marker-bottom-left { bottom: 8%; left: 4%; animation-delay: 4s; }
        .marker-bottom-right { bottom: 8%; right: 4%; animation-delay: 6s; }

        .marker-num {
          font-size: 0.9rem;
          color: var(--gold);
        }

        .marker-text {
          display: flex;
          flex-direction: column;
        }

        .marker-label {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: var(--gold);
        }

        .marker-desc {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        /* Central Focus Zone Portal */
        .portal-focus-zone {
          position: relative;
          z-index: 3;
          width: 100%;
          max-width: 480px;
        }

        .cinematic-portal-frame {
          position: relative;
          background: rgba(14, 18, 26, 0.88);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(212, 168, 67, 0.25);
          border-radius: 26px;
          padding: 36px 32px;
          box-shadow:
            0 30px 90px rgba(0, 0, 0, 0.85),
            0 0 60px rgba(212, 168, 67, 0.08);
          clip-path: polygon(
            0 0,
            calc(100% - 24px) 0,
            100% 24px,
            100% 100%,
            24px 100%,
            0 calc(100% - 24px)
          );
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
        }

        .cinematic-portal-frame.frame-universe-ready {
          border-color: rgba(212, 168, 67, 0.5);
          box-shadow:
            0 30px 90px rgba(0, 0, 0, 0.9),
            0 0 70px rgba(212, 168, 67, 0.22);
        }

        /* Progress Bar Indicator */
        .form-progress-bar-container {
          margin-bottom: 22px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(212, 168, 67, 0.15);
        }

        .progress-stages-track {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .stage-tag {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.16em;
          color: var(--text-muted);
          transition: color 0.3s ease;
        }

        .stage-tag.active {
          color: var(--gold);
        }

        .stage-connector {
          flex: 1;
          height: 2px;
          background: rgba(255, 255, 255, 0.08);
          margin: 0 8px;
          position: relative;
          border-radius: 2px;
          overflow: hidden;
        }

        .connector-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: var(--gold);
          transition: width 0.4s ease;
        }

        .progress-step-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .step-count-badge {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--gold);
          background: rgba(212, 168, 67, 0.1);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .step-action-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        /* Portal Header */
        .portal-logo-link {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          margin-bottom: 14px;
        }

        .portal-logo-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--gradient-gold);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-gold);
        }

        .logo-play-icon {
          margin-left: 2px;
        }

        .portal-brand-title {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 1.35rem;
          color: var(--text-primary);
        }

        .dynamic-headline {
          font-family: var(--font-serif);
          font-style: italic;
          font-weight: 900;
          font-size: 1.65rem;
          color: var(--text-primary);
          margin-bottom: 4px;
          transition: all 0.3s ease;
        }

        .portal-subtitle {
          font-size: 0.82rem;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        /* Form Inputs */
        .portal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .valid-check-icon {
          color: var(--gold);
        }

        .portal-input-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-field-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .custom-input {
          padding-left: 44px !important;
          background: rgba(255, 255, 255, 0.035) !important;
          border-color: rgba(212, 168, 67, 0.18) !important;
          border-radius: 12px !important;
          transition: all 0.25s ease;
        }

        .custom-input.input-valid {
          border-color: rgba(212, 168, 67, 0.4) !important;
        }

        .portal-input-box:focus-within .input-field-icon {
          color: var(--gold);
        }

        .password-grid-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .pw-eye-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .pw-eye-btn:hover {
          color: var(--text-primary);
        }

        /* Password Strength Meter */
        .pw-strength-meter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.025);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          margin-top: -4px;
        }

        .meter-title {
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: var(--text-muted);
        }

        .meter-status {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .meter-dots-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .meter-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: background-color 0.3s ease, transform 0.2s ease;
        }

        .meter-dot.active {
          transform: scale(1.15);
        }

        /* Universe Ready Banner */
        .universe-ready-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(212, 168, 67, 0.1);
          border: 1px solid rgba(212, 168, 67, 0.3);
          border-radius: 10px;
          font-size: 0.78rem;
          color: var(--gold);
          font-weight: 700;
        }

        /* Primary Button — BEGIN MY JOURNEY */
        .begin-journey-btn {
          position: relative;
          width: 100%;
          padding: 14px 24px;
          border-radius: 12px;
          border: none;
          background: var(--gradient-gold);
          color: #0d0a02;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 0.95rem;
          letter-spacing: 0.08em;
          cursor: pointer;
          overflow: hidden;
          box-shadow: var(--shadow-gold);
          margin-top: 4px;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
        }

        .begin-journey-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 36px rgba(212, 168, 67, 0.5), 0 1px 0 rgba(255, 255, 255, 0.2) inset;
        }

        .begin-journey-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-light-sweep {
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          transform: skewX(-20deg);
          transition: left 0.75s ease;
        }

        .begin-journey-btn:hover .btn-light-sweep {
          left: 140%;
        }

        .btn-text-content, .btn-spinner-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          z-index: 2;
        }

        .btn-arrow-icon {
          transition: transform 0.2s ease;
        }

        .begin-journey-btn:hover .btn-arrow-icon {
          transform: translateX(4px);
        }

        .spinner-dot-gold {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(13, 10, 2, 0.3);
          border-top-color: #0d0a02;
          animation: spin 0.7s linear infinite;
        }

        .portal-footer {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 22px;
        }

        .footer-line {
          flex: 1;
          height: 1px;
          background: rgba(212, 168, 67, 0.15);
        }

        .login-link-subtle {
          font-size: 0.78rem;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .login-link-subtle:hover {
          color: var(--text-primary);
        }

        @keyframes calmFloatNode {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-10px); }
        }

        /* Mobile Responsive */
        @media (max-width: 992px) {
          .floating-markers-container {
            display: none; /* Hide floating markers on mobile to maximize space */
          }
        }

        @media (max-width: 520px) {
          .cinematic-portal-frame {
            padding: 28px 20px;
            clip-path: none;
            border-radius: 20px;
          }

          .password-grid-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
