import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../ui/Spinner';
import CinematicBackground from './CinematicBackground';
import CalculationInfoModal from './CalculationInfoModal';

const STEPS = [
  { num: 1, label: 'Languages' },
  { num: 2, label: 'Vibe'      },
  { num: 3, label: 'Genres'    },
  { num: 4, label: 'Films'     },
  { num: 5, label: 'Actors'    },
  { num: 6, label: 'Directors' },
];

export default function OnboardingLayout({
  step, totalSteps = 6, title, subtitle,
  onNext, onBack, isLoading, canProceed,
  nextLabel = 'Continue',
  confidence = 0,   // 0–100 taste accuracy score
  children,
}) {
  const [showTasteInfo, setShowTasteInfo] = useState(false);
  const progress = (step / totalSteps) * 100;

  // Clamp confidence to 0-100 and round
  const pct = Math.min(100, Math.max(0, Math.round(confidence)));

  const confidenceLabel =
    pct < 20  ? 'Just getting started…'  :
    pct < 40  ? 'Warming up your taste'  :
    pct < 60  ? 'Getting a clearer picture' :
    pct < 80  ? 'Your taste is taking shape' :
    'We know what you love 🎯';

  let variant = 'default';
  if (step === 1) variant = 'languages';
  else if (step === 2) variant = 'vibe';
  else if (step === 3) variant = 'genres';
  else if (step === 4) variant = 'movies';
  else if (step === 5) variant = 'actors';
  else if (step === 6) variant = 'directors';

  return (
    <CinematicBackground variant={variant}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', pointerEvents: step === 1 ? 'none' : 'auto' }}>

      {/* Sticky Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 'var(--z-nav)',
        pointerEvents: 'auto',
        background: step === 1 ? 'rgba(6, 8, 12, 0.72)' : 'rgba(13,15,20,0.92)',
        backdropFilter: 'blur(18px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {/* Progress line */}
        <div className="progress-bar" style={{ borderRadius: 0 }}>
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="container" style={{ padding: 'var(--space-3) var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 7,
                background: 'var(--gradient-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#0d0a02">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Cine<span style={{ color: 'var(--gold)' }}>Match</span>
              </span>
            </div>

            {/* Step indicators — desktop */}
            <div className="ob-steps-desktop" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {STEPS.map((s, i) => {
                const isDone = s.num < step;
                const isCurrent = s.num === step;
                return (
                  <React.Fragment key={s.num}>
                    {i > 0 && (
                      <div style={{
                        width: 24, height: 1,
                        background: isDone ? 'var(--gold)' : 'var(--border-default)',
                        opacity: isDone ? 1 : 0.5,
                        transition: 'background var(--t-base)',
                      }} className="ob-step-connector" />
                    )}
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: isCurrent ? 800 : 600,
                      color: isDone || isCurrent ? 'var(--gold)' : 'var(--text-disabled)',
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.05em',
                      transition: 'all var(--t-base)',
                      opacity: isDone ? 0.8 : isCurrent ? 1 : 0.6,
                      textShadow: isCurrent ? '0 0 10px rgba(212,168,67,0.4)' : 'none',
                    }}>
                      0{s.num}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Step indicator — mobile */}
            <div className="ob-steps-mobile" style={{ display: 'none', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--gold)', textTransform: 'uppercase' }}>
              STEP {step} / {totalSteps} • {STEPS.find(s => s.num === step)?.label}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1, pointerEvents: step === 1 ? 'none' : 'auto' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: step === 1 ? 'var(--space-6) var(--space-6) var(--space-12)' : 'var(--space-10) var(--space-6) var(--space-20)', pointerEvents: step === 1 ? 'none' : 'auto' }}>
          <div className="animate-fade-in" style={{ pointerEvents: step === 1 ? 'none' : 'auto' }}>
            {/* Step badge */}
            <div style={{
              fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', color: 'var(--gold)', marginBottom: 'var(--space-3)', textTransform: 'uppercase'
            }}>
              STEP 0{step} / 0{totalSteps}
            </div>

            <h1 style={{ marginBottom: 'var(--space-3)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>{title}</h1>
            {subtitle && (
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', maxWidth: 560, lineHeight: 1.7 }}>
                {subtitle}
              </p>
            )}

            {children}
          </div>
        </div>
      </main>

      {/* Sticky Footer Actions */}
      <footer style={{
        position: 'sticky', bottom: 0, zIndex: 'var(--z-nav)',
        pointerEvents: 'auto',
        background: step === 1 ? 'rgba(6, 8, 12, 0.78)' : 'rgba(13,15,20,0.97)',
        backdropFilter: 'blur(18px)',
        borderTop: '1px solid var(--border-subtle)',
        padding: 'var(--space-3) 0',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 var(--space-6)' }}>

          {/* ── Taste Confidence Meter ────────────────────────── */}
          {pct > 0 && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{
                padding: '8px 12px',
                background: 'rgba(212,168,67,0.04)',
                border: '1px solid rgba(212,168,67,0.10)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {/* Pulse dot */}
                <div style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: pct > 60 ? 'var(--gold)' : 'rgba(212,168,67,0.6)',
                  boxShadow: pct > 60 ? '0 0 6px rgba(212,168,67,0.8)' : 'none',
                  animation: 'pulse 2s ease infinite',
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '0.65rem', color: 'var(--text-muted)',
                    marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase'
                  }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>YOUR TASTE PROFILE</span>
                    <span style={{ fontWeight: 800, color: pct > 60 ? 'var(--gold)' : 'var(--text-secondary)' }}>{pct}%</span>
                  </div>

                  {/* Progress track */}
                  <div style={{
                    height: 4, borderRadius: 99,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: 99,
                      background: pct > 70
                        ? 'var(--gradient-gold)'
                        : 'linear-gradient(90deg,rgba(212,168,67,0.4),rgba(212,168,67,0.75))',
                      transition: 'width 0.5s cubic-bezier(0.25,0.46,0.45,0.94)',
                      boxShadow: pct > 50 ? '0 0 8px rgba(212,168,67,0.4)' : 'none',
                    }} />
                  </div>
                </div>

                <span style={{
                  fontSize: '0.58rem', color: 'var(--text-disabled)',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  fontStyle: 'italic',
                }}>
                  {confidenceLabel}
                </span>
              </div>

              {/* ── Taste Accuracy Explanation Info Section ───── */}
              <div style={{
                marginTop: 6,
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.62rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>How it works:</strong> Each selection trains our AI on your movie DNA — higher accuracy unlocks 95%+ match scoring.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTasteInfo(true)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--gold)',
                    fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer',
                    textDecoration: 'underline', padding: '0 2px', flexShrink: 0,
                  }}
                >
                  How is this calculated?
                </button>
              </div>
            </div>
          )}

          {/* ── Cinematic Calculation Explanation Modal ── */}
          <CalculationInfoModal
            isOpen={showTasteInfo}
            onClose={() => setShowTasteInfo(false)}
          />

          {/* ── Back / Next row ───────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'space-between' }}>
            {/* Back */}
            <div>
              {onBack && (
                <button id={`ob-back-${step}`} className="btn btn--ghost" onClick={onBack} disabled={isLoading}>
                  Back
                </button>
              )}
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              {/* Dot progress */}
              <div style={{ display: 'flex', gap: 5 }}>
                {STEPS.map(s => (
                  <div key={s.num} style={{
                    width: s.num === step ? 18 : 5, height: 5,
                    borderRadius: 'var(--radius-full)',
                    background: s.num < step ? 'var(--gold)' : s.num === step ? 'var(--gold)' : 'var(--bg-overlay)',
                    transition: 'all var(--t-base)',
                    opacity: s.num <= step ? 1 : 0.4,
                    boxShadow: s.num === step ? '0 0 8px rgba(212,168,67,0.5)' : 'none',
                  }} />
                ))}
              </div>
              <button
                id={`ob-next-${step}`}
                className="btn btn--gold"
                style={{ minWidth: 160 }}
                onClick={onNext}
                disabled={isLoading || !canProceed}
              >
                {isLoading
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner size="sm" /> Saving</span>
                  : nextLabel
                }
              </button>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .ob-steps-desktop { display: none !important; }
          .ob-steps-mobile { display: block !important; }
        }
        @media (max-width: 440px) {
          .ob-step-connector { display: none !important; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
    </CinematicBackground>
  );
}
