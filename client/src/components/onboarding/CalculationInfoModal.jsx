import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function CalculationInfoModal({ isOpen, onClose }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const modalCardRef = useRef(null);

  // Handle smooth bottom-to-center opening, center-to-bottom closing, and body scroll locking
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small frame delay to allow portal DOM mount before triggering upward transition
      const frameId = requestAnimationFrame(() => {
        setIsAnimating(true);
      });

      // Lock body scroll
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        cancelAnimationFrame(frameId);
        document.body.style.overflow = prevOverflow;
      };
    } else if (shouldRender) {
      setIsAnimating(false);
      // Wait for exit downward slide and blur fade-out animation to finish
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 420);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  // Render via React Portal into document.body to completely escape all parent stacking contexts
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calculation-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999, // Above ALL onboarding elements, poster walls, and layouts
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: isAnimating ? 'rgba(4, 6, 10, 0.72)' : 'rgba(4, 6, 10, 0)',
        backdropFilter: isAnimating ? 'blur(14px) saturate(140%)' : 'blur(0px) saturate(100%)',
        WebkitBackdropFilter: isAnimating ? 'blur(14px) saturate(140%)' : 'blur(0px) saturate(100%)',
        transition: 'background-color 0.45s cubic-bezier(0.16, 1, 0.3, 1), backdrop-filter 0.45s cubic-bezier(0.16, 1, 0.3, 1), -webkit-backdrop-filter 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      {/* ── Modal Card (Travels from Bottom of Screen to Exact Viewport Center) ── */}
      <div
        ref={modalCardRef}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when interacting inside card
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: 'min(660px, 90vw)',
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: 'rgba(11, 14, 20, 0.95)',
          border: '1px solid rgba(212, 168, 67, 0.32)',
          borderRadius: 24,
          padding: 'clamp(20px, 4vw, 32px)',
          boxShadow: '0 28px 72px rgba(0, 0, 0, 0.9), 0 0 40px rgba(212, 168, 67, 0.15)',
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, 110vh) scale(0.94)', // Bottom -> Center animation
          transition: 'transform 0.52s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.42s cubic-bezier(0.16, 1, 0.3, 1)',
          color: '#e2e8f0',
          fontFamily: 'inherit',
          userSelect: 'text',
          willChange: 'transform, opacity',
          zIndex: 10000,
        }}
      >
        {/* Subtle Gold Caustic Glow Accent */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: '25%',
            width: '50%',
            height: 60,
            background: 'radial-gradient(ellipse at center, rgba(212, 168, 67, 0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 99,
                background: 'rgba(212, 168, 67, 0.1)',
                border: '1px solid rgba(212, 168, 67, 0.22)',
                color: 'var(--gold, #d4a843)',
                fontSize: '0.66rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              <span>🎯 TASTE ACCURACY ENGINE</span>
            </div>
            <h2
              id="calculation-modal-title"
              style={{
                fontSize: 'clamp(1.25rem, 2.8vw, 1.6rem)',
                fontFamily: 'var(--font-serif, serif)',
                fontStyle: 'italic',
                fontWeight: 700,
                color: '#fff',
                margin: 0,
                lineHeight: 1.25,
              }}
            >
              How is your Taste Profile calculated?
            </h2>
          </div>

          {/* Close '×' Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.35rem',
              cursor: 'pointer',
              flexShrink: 0,
              marginLeft: 12,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'rgba(212, 168, 67, 0.5)';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>

        {/* ── Body Overview ── */}
        <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.65, margin: '0 0 20px' }}>
          Your <strong style={{ color: '#fff' }}>Taste Profile Accuracy</strong> represents how deeply CineMatch has mapped your cinematic preferences. As you complete each onboarding step, our hybrid recommendation engine builds a personalized multi-dimensional vector of your favorite languages, storytelling tropes, and auteur filmmaking styles.
        </p>

        {/* ── 6-Step Accumulation Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 22 }}>
          <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.025)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--gold, #d4a843)', fontWeight: 800, fontSize: '0.75rem' }}>🌐 1. Languages</span>
              <span style={{ color: '#cbd5e1', fontSize: '0.7rem', fontWeight: 700 }}>+0–15%</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', lineHeight: 1.45 }}>
              Establishes your primary regional cinema industries and native/dubbed viewing preferences.
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.025)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--gold, #d4a843)', fontWeight: 800, fontSize: '0.75rem' }}>✨ 2. Vibe & Mood</span>
              <span style={{ color: '#cbd5e1', fontSize: '0.7rem', fontWeight: 700 }}>+10%</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', lineHeight: 1.45 }}>
              Pins down current emotional tones, atmospheric pacing, and entertainment modes.
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.025)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--gold, #d4a843)', fontWeight: 800, fontSize: '0.75rem' }}>🎭 3. Genres</span>
              <span style={{ color: '#cbd5e1', fontSize: '0.7rem', fontWeight: 700 }}>+20%</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', lineHeight: 1.45 }}>
              Weights storytelling themes (Sci-Fi, Crime Thrillers, Romance, Dark Comedy, etc.).
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.025)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--gold, #d4a843)', fontWeight: 800, fontSize: '0.75rem' }}>🎬 4. Films & Ratings</span>
              <span style={{ color: '#cbd5e1', fontSize: '0.7rem', fontWeight: 700 }}>+25%</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', lineHeight: 1.45 }}>
              Calibrates collaborative filtering weights based on movies you loved, disliked, or rated.
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.025)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--gold, #d4a843)', fontWeight: 800, fontSize: '0.75rem' }}>👥 5. Actors</span>
              <span style={{ color: '#cbd5e1', fontSize: '0.7rem', fontWeight: 700 }}>+15%</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', lineHeight: 1.45 }}>
              Identifies leading cast preferences and performer-driven film recommendations.
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: 'rgba(255, 255, 255, 0.025)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--gold, #d4a843)', fontWeight: 800, fontSize: '0.75rem' }}>🎬 6. Directors</span>
              <span style={{ color: '#cbd5e1', fontSize: '0.7rem', fontWeight: 700 }}>+15%</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', lineHeight: 1.45 }}>
              Completes your movie DNA with signature cinematography, auteur styles, and narrative pacing.
            </p>
          </div>
        </div>

        {/* ── Why It Matters Banner ── */}
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(212, 168, 67, 0.06)',
            border: '1px solid rgba(212, 168, 67, 0.18)',
            borderRadius: 14,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ fontSize: '1.25rem', flexShrink: 0 }}>✨</div>
          <div style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--gold, #d4a843)' }}>Why It Matters:</strong> Reaching <strong>85%+</strong> unlocks CineMatch's deep hybrid AI recommendations, delivering tailor-made film match scores with 95%+ precision.
          </div>
        </div>

        {/* ── Action Dismiss Button ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 22px',
              borderRadius: 'var(--radius-full, 99px)',
              background: 'var(--gradient-gold, linear-gradient(135deg, #f7d070, #d4a843))',
              border: 'none',
              color: '#0d0a02',
              fontWeight: 800,
              fontSize: '0.78rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(212, 168, 67, 0.35)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 168, 67, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(212, 168, 67, 0.35)';
            }}
          >
            Got it, continue
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
