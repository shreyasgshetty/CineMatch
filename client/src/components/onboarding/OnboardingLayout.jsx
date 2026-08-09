import React from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../ui/Spinner';

/**
 * OnboardingLayout — Shared wrapper for all onboarding steps
 *
 * Props:
 *   step: current step number (1-5)
 *   totalSteps: total steps
 *   title: page heading
 *   subtitle: description
 *   onNext: async handler for the continue button
 *   onBack: optional back handler
 *   isLoading: disables the continue button
 *   canProceed: enables the continue button
 *   nextLabel: custom label for next button
 *   children: the step content
 */
export default function OnboardingLayout({
  step, totalSteps = 5, title, subtitle,
  onNext, onBack, isLoading, canProceed,
  nextLabel = 'Continue', children,
}) {
  const navigate = useNavigate();
  const progress = (step / totalSteps) * 100;

  const steps = [
    { num: 1, label: 'Languages' },
    { num: 2, label: 'Rate Movies' },
    { num: 3, label: 'Genres' },
    { num: 4, label: 'Actors' },
    { num: 5, label: 'Directors' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-base)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Top Progress Bar ──────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 'var(--z-nav)',
        background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        {/* Thin progress line */}
        <div className="progress-bar" style={{ borderRadius: 0 }}>
          <div
            className="progress-bar__fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="container" style={{ padding: 'var(--space-4) var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🎬</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)' }}>
                Cine<span style={{ color: 'var(--color-brand-primary)' }}>Match</span>
              </span>
            </div>

            {/* Step dots */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              {steps.map(s => (
                <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: s.num === step ? 28 : 20,
                    height: s.num === step ? 28 : 20,
                    borderRadius: '50%',
                    background: s.num < step ? 'var(--gradient-brand)' :
                                s.num === step ? 'var(--gradient-brand)' :
                                'var(--color-bg-overlay)',
                    border: `2px solid ${s.num <= step ? 'var(--color-brand-primary)' : 'var(--color-border-default)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, color: '#fff',
                    transition: 'all var(--transition-base)',
                    boxShadow: s.num === step ? 'var(--shadow-brand)' : 'none',
                  }}>
                    {s.num < step ? '✓' : s.num}
                  </div>
                  <span style={{
                    fontSize: '9px', color: s.num <= step ? 'var(--color-brand-primary)' : 'var(--color-text-disabled)',
                    fontWeight: s.num === step ? 600 : 400,
                    display: 'none', // hidden on mobile, shown on desktop
                  }} className="step-label">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Step {step} of {totalSteps}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div className="container" style={{ maxWidth: 800, padding: 'var(--space-10) var(--space-6)' }}>
          <div className="animate-fade-in">
            <h1 style={{ marginBottom: 'var(--space-3)', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)' }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-8)', fontSize: 'var(--text-base)' }}>
                {subtitle}
              </p>
            )}

            {children}
          </div>
        </div>
      </div>

      {/* ── Bottom Action Bar ─────────────────────────── */}
      <div style={{
        position: 'sticky', bottom: 0,
        background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--color-border-subtle)',
        padding: 'var(--space-4) 0',
      }}>
        <div className="container" style={{ maxWidth: 800, display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          {onBack && (
            <button
              id={`onboarding-back-${step}`}
              className="btn btn--secondary"
              onClick={onBack}
              disabled={isLoading}
            >
              ← Back
            </button>
          )}
          <button
            id={`onboarding-next-${step}`}
            className="btn btn--primary"
            style={{ minWidth: 180 }}
            onClick={onNext}
            disabled={isLoading || !canProceed}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Spinner size="sm" /> Saving…
              </span>
            ) : (
              nextLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
