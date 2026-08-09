import React from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../ui/Spinner';

const STEPS = [
  { num: 1, label: 'Languages', emoji: '🌐' },
  { num: 2, label: 'Rate Films', emoji: '⭐' },
  { num: 3, label: 'Genres',    emoji: '🎭' },
  { num: 4, label: 'Actors',    emoji: '🎭' },
  { num: 5, label: 'Directors', emoji: '🎬' },
];

export default function OnboardingLayout({
  step, totalSteps = 5, title, subtitle,
  onNext, onBack, isLoading, canProceed,
  nextLabel = 'Continue', children,
}) {
  const progress = (step / totalSteps) * 100;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Ambient background ──────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(ellipse, rgba(140,28,42,0.18) 0%, transparent 65%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: '55%', height: '55%', background: 'radial-gradient(ellipse, rgba(201,168,76,0.12) 0%, transparent 65%)', filter: 'blur(70px)' }} />
      </div>

      {/* ── Sticky Header ───────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 'var(--z-nav)',
        background: 'rgba(5,8,15,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {/* Gold progress line */}
        <div className="progress-bar" style={{ borderRadius: 0 }}>
          <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="container" style={{ padding: 'var(--space-4) var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--gradient-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, boxShadow: 'var(--shadow-gold)',
              }}>🎬</div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Cine<span style={{ color: 'var(--gold)' }}>Match</span>
              </span>
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              {STEPS.map((s) => {
                const isDone    = s.num < step;
                const isCurrent = s.num === step;
                return (
                  <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{
                      width: isCurrent ? 34 : 28,
                      height: isCurrent ? 34 : 28,
                      borderRadius: '50%',
                      background: isDone || isCurrent
                        ? 'var(--gradient-gold)'
                        : 'var(--bg-overlay)',
                      border: `2px solid ${isDone || isCurrent ? 'var(--gold)' : 'var(--border-default)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isCurrent ? '0.85rem' : '0.75rem',
                      fontWeight: 800,
                      color: isDone || isCurrent ? '#0a0805' : 'var(--text-muted)',
                      transition: 'all var(--t-base)',
                      boxShadow: isCurrent ? '0 0 16px rgba(201,168,76,0.4)' : 'none',
                      flexShrink: 0,
                    }}>
                      {isDone ? '✓' : s.num}
                    </div>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.04em',
                      color: isCurrent ? 'var(--gold)' : 'var(--text-disabled)',
                      display: window.innerWidth > 600 ? 'block' : 'none',
                    }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step counter */}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{step}</span>/{totalSteps}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: 'var(--space-10) var(--space-6)' }}>
          <div className="animate-fade-in">
            {/* Step badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 14px',
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.20)',
              borderRadius: 'var(--radius-full)',
              marginBottom: 'var(--space-5)',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', boxShadow: '0 0 5px var(--gold)' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
                Step {step} of {totalSteps}
              </span>
            </div>

            <h1 style={{ marginBottom: 'var(--space-3)', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)' }}>{title}</h1>
            {subtitle && (
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-8)', maxWidth: 560 }}>
                {subtitle}
              </p>
            )}

            {children}
          </div>
        </div>
      </main>

      {/* ── Sticky Footer Actions ─────────────────────────────── */}
      <footer style={{
        position: 'sticky', bottom: 0, zIndex: 'var(--z-nav)',
        background: 'rgba(5,8,15,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
        padding: 'var(--space-4) 0',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', justifyContent: 'space-between' }}>
          {/* Back */}
          <div>
            {onBack && (
              <button id={`ob-back-${step}`} className="btn btn--ghost" onClick={onBack} disabled={isLoading}>
                ← Back
              </button>
            )}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {STEPS.map(s => (
                <div key={s.num} style={{
                  width: s.num === step ? 20 : 6, height: 6,
                  borderRadius: 'var(--radius-full)',
                  background: s.num < step ? 'var(--gold)' : s.num === step ? 'var(--gradient-gold)' : 'var(--bg-overlay)',
                  transition: 'all var(--t-base)',
                  boxShadow: s.num === step ? '0 0 8px rgba(201,168,76,0.5)' : 'none',
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
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner size="sm" /> Saving…</span>
                : nextLabel
              }
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
