import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANGUAGES } from '../../utils/config';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { resetDownstreamOnboarding } from '../../utils/onboardingHelper';
import CinematicPosterWall from '../../components/onboarding/CinematicPosterWall';

export default function OnboardingLanguages() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(() => JSON.parse(sessionStorage.getItem('ob_languages') || '[]'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  const langConf = selected.length > 0 ? Math.min(20, Math.max(10, selected.length * 5)) : 0;
  const activeLangCode = LANGUAGES[activeIndex]?.code || 'kn';

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveIndex(Number(entry.target.dataset.index));
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '-35% 0px -35% 0px',
        threshold: 0.2,
      }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const toggle = (code) => {
    setSelected((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      sessionStorage.setItem('ob_languages', JSON.stringify(next));
      const conf = next.length > 0 ? Math.min(20, Math.max(10, next.length * 5)) : 0;
      sessionStorage.setItem('ob_conf_lang', String(conf));
      resetDownstreamOnboarding(1);
      return next;
    });
    if (error) setError('');
  };

  const handleNext = async () => {
    if (selected.length === 0) {
      setError('Please select at least one language.');
      return;
    }
    setIsLoading(true);
    try {
      await onboardingApi.saveLanguages({ languages: selected });
      sessionStorage.setItem('ob_languages', JSON.stringify(selected));
      navigate('/onboarding/vibe');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for Selected Languages text
  const getSelectedText = () => {
    if (selected.length === 0) return 'None selected';
    const names = selected.map((code) => LANGUAGES.find((l) => l.code === code)?.label || code);
    if (names.length <= 3) return names.join(' · ');
    return `${names.slice(0, 3).join(' · ')} + ${names.length - 3} more`;
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      {/* ── 1. Full-Screen Cinematic Moving Movie Poster Wall ── */}
      <CinematicPosterWall activeLanguage={activeLangCode} selectedLanguages={selected} />

      {/* ── 2. Interactive Onboarding Layout Frame & Vertical Language Selector ── */}
      <OnboardingLayout
        step={1}
        totalSteps={6}
        title="What do you speak?"
        subtitle="Choose the languages you love watching in. Scroll to explore • Hover posters to paint color."
        onNext={handleNext}
        isLoading={isLoading}
        canProceed={selected.length > 0}
        nextLabel={selected.length > 0 ? 'Continue' : 'Select a language'}
        confidence={langConf}
      >
        {error && (
          <div className="info-banner info-banner--error" style={{ marginBottom: 'var(--space-5)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Persistent Selection Summary */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(13, 15, 20, 0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(212,168,67,0.22)',
              borderRadius: 'var(--radius-full)',
              padding: '8px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: 800,
                color: 'var(--gold)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              Your Selected Languages
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {getSelectedText()}
            </span>
          </div>
        </div>

        {/* Cinematic Vertical Language Snap Thread */}
        <div className="lang-thread-container" ref={containerRef}>
          {/* Scroll Hint */}
          <div
            style={{
              position: 'absolute',
              top: '12vh',
              left: 0,
              right: 0,
              textAlign: 'center',
              opacity: activeIndex === 0 ? 0.75 : 0,
              transition: 'opacity 0.5s ease',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: 'var(--text-secondary)',
              }}
            >
              SCROLL VERTICALLY TO EXPLORE CINEMA
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--gold)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ animation: 'slideUp 1.5s infinite alternate reverse' }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          {LANGUAGES.map((lang, index) => {
            const isSelected = selected.includes(lang.code);
            const isActive = index === activeIndex;
            const isPrev = index < activeIndex;

            let stateClass = 'next';
            if (isActive) stateClass = 'active';
            else if (isPrev) stateClass = 'prev';

            return (
              <div
                key={lang.code}
                ref={(el) => (itemRefs.current[index] = el)}
                data-index={index}
                className={`lang-thread-item ${stateClass} ${isSelected ? 'selected' : ''}`}
                onClick={() => toggle(lang.code)}
              >
                <div className="lang-content">
                  <div className="lang-name">{lang.label}</div>
                  <div className="lang-industry">{lang.industry}</div>

                  <div className="lang-check">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Vertical Progress Indicator Dots */}
        <div
          className="vertical-progress-indicator"
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none',
            zIndex: 10,
            paddingRight: 'var(--space-4)',
          }}
        >
          {LANGUAGES.map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: i === activeIndex ? 7 : 4,
                  height: i === activeIndex ? 7 : 4,
                  borderRadius: '50%',
                  background: i === activeIndex ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
                  boxShadow: i === activeIndex ? '0 0 12px rgba(212,168,67,0.7)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
              {i < LANGUAGES.length - 1 && (
                <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 640px) {
            .vertical-progress-indicator { display: none !important; }
          }
        `}</style>
      </OnboardingLayout>
    </div>
  );
}
