import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CinematicIntro from '../components/auth/CinematicIntro';
import PosterUniverse from '../components/auth/PosterUniverse';
import InfoRail from '../components/auth/InfoRail';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    email: localStorage.getItem('cinematch_remember_email') || '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('cinematch_remember_email'));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [introCompleted, setIntroCompleted] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem('cinematch_remember_email', formData.email);
      } else {
        localStorage.removeItem('cinematch_remember_email');
      }

      const user = await login(formData);
      navigate(user.onboardingCompleted ? '/home' : '/onboarding/languages');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cinematic-login-page">
      {/* ── 1. Quick Brand Intro Stage (0.0s – 0.8s) ─────────────── */}
      <CinematicIntro onComplete={() => setIntroCompleted(true)} />

      {/* ── 2. Ambient Poster Universe Background ──────────────── */}
      <PosterUniverse />

      {/* ── 3. Main Foreground Canvas ─────────────────────────── */}
      <div className={`cinematic-main-content ${introCompleted ? 'intro-finished' : ''}`}>

        <div className="cinematic-layout-grid">

          {/* Left Column — Brand & Information Rail */}
          <div className="left-hero-panel">
            <Link to="/" className="cinema-brand-link delay-stagger-1">
              <div className="cinema-logo-box">
                <Play size={18} fill="#0d0a02" stroke="none" className="logo-play-icon" />
              </div>
              <span className="cinema-brand-title">
                Cine<span className="text-gold">Match</span>
              </span>
            </Link>

            <div className="cinema-hero-text delay-stagger-2">
              <div className="universe-badge">
                <Sparkles size={13} className="text-gold" />
                <span>AI Recommendation Platform</span>
              </div>

              <h1 className="hero-heading">
                Your next obsession<br />
                <span className="text-gradient-gold">is waiting.</span>
              </h1>

              <p className="hero-subtext">
                Thousands of stories. One intelligent engine that truly understands your taste.
              </p>
            </div>

            {/* Minimal Animated Information Rail */}
            <div className="delay-stagger-3">
              <InfoRail />
            </div>
          </div>

          {/* Right Column — Asymmetric Panel ("CHOOSE YOUR STORY") */}
          <div className="right-panel-wrapper delay-stagger-2">
            <div className="cinematic-panel">

              {/* Panel Header */}
              <div className="panel-header delay-stagger-3">
                <span className="panel-eyebrow">ENTER CINEMATCH</span>
                <h2 className="panel-title">Choose Your Story</h2>
                <p className="panel-subtitle">Sign in to unlock your personalized movie universe</p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="info-banner info-banner--error animate-fade-in">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Staggered Login Form */}
              <form onSubmit={handleSubmit} className="staggered-form">
                
                {/* Email Field */}
                <div className="form-group delay-stagger-3">
                  <label className="form-label" htmlFor="login-email">Email Address</label>
                  <div className="cinematic-input-box">
                    <Mail className="input-icon" size={18} />
                    <input
                      id="login-email"
                      type="email"
                      name="email"
                      className="form-input custom-input"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="form-group delay-stagger-4">
                  <label className="form-label" htmlFor="login-password">Password</label>
                  <div className="cinematic-input-box">
                    <Lock className="input-icon" size={18} />
                    <input
                      id="login-password"
                      type={showPw ? 'text' : 'password'}
                      name="password"
                      className="form-input custom-input"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                      style={{ paddingRight: 48 }}
                    />
                    <button
                      type="button"
                      className="pw-toggle-btn"
                      onClick={() => setShowPw(p => !p)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="form-options-row delay-stagger-4">
                  <label className="checkbox-label" htmlFor="login-remember">
                    <input
                      id="login-remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="custom-checkbox"
                    />
                    <span className="checkbox-text">Remember me on this device</span>
                  </label>
                </div>

                {/* Special Cinematic Login Button — ENTER CINEMATCH */}
                <div className="delay-stagger-5">
                  <button
                    id="login-submit"
                    type="submit"
                    className="enter-cinematch-btn"
                    disabled={loading}
                  >
                    <span className="btn-light-sweep" />
                    {loading ? (
                      <span className="btn-spinner-content">
                        <span className="spinner-dot-gold" />
                        Entering Universe...
                      </span>
                    ) : (
                      <span className="btn-text-content">
                        <span>ENTER CINEMATCH</span>
                        <ArrowRight size={18} className="btn-arrow-icon" />
                      </span>
                    )}
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="panel-divider delay-stagger-5">
                <span className="divider-line" />
                <span className="divider-tag">NEW HERE?</span>
                <span className="divider-line" />
              </div>

              {/* Register Action */}
              <div className="delay-stagger-5">
                <Link to="/register" className="register-link-btn">
                  Create your CineMatch account
                </Link>
              </div>

              {/* Footer Notice */}
              <p className="tmdb-notice">
                This product uses the TMDB API but is not endorsed or certified by TMDB.
              </p>

            </div>
          </div>

        </div>

      </div>

      {/* ── CSS Styling ─────────────────────────────────────────── */}
      <style>{`
        .cinematic-login-page {
          min-height: 100vh;
          position: relative;
          background: #07090e;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-primary);
        }

        .cinematic-main-content {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 40px 24px;
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s;
        }

        .cinematic-main-content.intro-finished {
          opacity: 1;
          transform: translateY(0);
        }

        .cinematic-layout-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 56px;
          align-items: center;
        }

        /* Left Hero Panel */
        .cinema-brand-link {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          margin-bottom: 24px;
        }

        .cinema-logo-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: var(--gradient-gold);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-gold);
        }

        .logo-play-icon {
          margin-left: 2px;
        }

        .cinema-brand-title {
          font-family: var(--font-display);
          font-weight: 900;
          font-size: 1.6rem;
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .universe-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(212, 168, 67, 0.08);
          border: 1px solid rgba(212, 168, 67, 0.25);
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 16px;
        }

        .hero-heading {
          font-family: var(--font-serif);
          font-weight: 900;
          font-style: italic;
          font-size: clamp(2.3rem, 4vw, 3.6rem);
          line-height: 1.08;
          color: var(--text-primary);
          margin-bottom: 16px;
        }

        .hero-subtext {
          font-size: 1rem;
          color: var(--text-secondary);
          line-height: 1.65;
          max-width: 460px;
        }

        /* Right Panel — "CHOOSE YOUR STORY" Cinematic Panel */
        .right-panel-wrapper {
          width: 100%;
        }

        .cinematic-panel {
          position: relative;
          background: rgba(14, 17, 23, 0.85);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(212, 168, 67, 0.22);
          border-radius: 24px;
          padding: 40px 36px;
          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.85),
            0 0 50px rgba(212, 168, 67, 0.06);
          clip-path: polygon(
            0 0,
            calc(100% - 24px) 0,
            100% 24px,
            100% 100%,
            24px 100%,
            0 calc(100% - 24px)
          );
        }

        .panel-header {
          margin-bottom: 24px;
        }

        .panel-eyebrow {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: var(--gold);
          text-transform: uppercase;
          display: block;
          margin-bottom: 6px;
        }

        .panel-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .panel-subtitle {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .staggered-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .cinematic-input-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .custom-input {
          padding-left: 44px !important;
          background: rgba(255, 255, 255, 0.035) !important;
          border-color: rgba(212, 168, 67, 0.15) !important;
          border-radius: 12px !important;
        }

        .cinematic-input-box:focus-within .input-icon {
          color: var(--gold);
        }

        .pw-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.2s ease;
        }

        .pw-toggle-btn:hover {
          color: var(--text-primary);
        }

        .form-options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: -2px;
        }

        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .custom-checkbox {
          width: 16px;
          height: 16px;
          accent-color: var(--gold);
          cursor: pointer;
        }

        .checkbox-text {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        /* ENTER CINEMATCH Button */
        .enter-cinematch-btn {
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
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
        }

        .enter-cinematch-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 36px rgba(212, 168, 67, 0.5), 0 1px 0 rgba(255, 255, 255, 0.2) inset;
        }

        .enter-cinematch-btn:disabled {
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

        .enter-cinematch-btn:hover .btn-light-sweep {
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

        .enter-cinematch-btn:hover .btn-arrow-icon {
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

        .panel-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 18px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(212, 168, 67, 0.18);
        }

        .divider-tag {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: var(--text-muted);
        }

        .register-link-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid var(--border-gold);
          color: var(--gold);
          text-decoration: none;
          font-weight: 700;
          font-size: 0.85rem;
          transition: all 0.25s ease;
        }

        .register-link-btn:hover {
          background: rgba(212, 168, 67, 0.1);
          border-color: var(--gold);
          box-shadow: var(--shadow-gold);
        }

        .tmdb-notice {
          margin-top: 20px;
          text-align: center;
          font-size: 0.7rem;
          color: var(--text-disabled);
        }

        /* Staggered Delay Entrance Classes */
        .delay-stagger-1 { animation: slideUp 0.5s ease 0.1s both; }
        .delay-stagger-2 { animation: slideUp 0.5s ease 0.15s both; }
        .delay-stagger-3 { animation: slideUp 0.5s ease 0.2s both; }
        .delay-stagger-4 { animation: slideUp 0.5s ease 0.25s both; }
        .delay-stagger-5 { animation: slideUp 0.5s ease 0.3s both; }

        /* Mobile Adjustments */
        @media (max-width: 992px) {
          .cinematic-layout-grid {
            grid-template-columns: 1fr;
            gap: 32px;
            max-width: 480px;
            margin: 0 auto;
          }

          .left-hero-panel {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .hero-heading {
            font-size: 2.2rem;
          }
        }

        @media (max-width: 480px) {
          .cinematic-main-content {
            padding: 20px 14px 60px;
          }

          .cinematic-panel {
            padding: 28px 20px;
            clip-path: none;
            border-radius: 18px;
          }
        }
      `}</style>
    </div>
  );
}
