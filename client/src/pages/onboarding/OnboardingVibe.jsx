/**
 * OnboardingVibe — Step 2 of 6
 *
 * Pure UI step — no API call. Saves selected vibe to sessionStorage
 * as `ob_vibe_genres` (array of genre names). The Genres page reads
 * this on mount and pre-selects those genres.
 *
 * Design: 5 large cinematic "vibe cards" with rich gradient backgrounds
 * and an animated shimmer on hover. Tap one → it glows and zooms.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { resetDownstreamOnboarding } from '../../utils/onboardingHelper';

// ── Vibe definitions ─────────────────────────────────────────────
const VIBES = [
  {
    id: 'dark',
    emoji: '🔥',
    label: 'Dark & Intense',
    desc: 'Keeps you on the edge. Twists, tension, and the thrill of the unpredictable.',
    genres: ['Thriller', 'Crime', 'Horror', 'Mystery'],
    gradient: 'linear-gradient(145deg,#0f0204 0%,#3a0810 40%,#7a0e1a 80%,#a01428 100%)',
    glow: 'rgba(160,20,40,0.55)',
    accent: '#e05060',
    tags: ['Thriller', 'Crime', 'Horror'],
  },
  {
    id: 'fun',
    emoji: '😂',
    label: 'Light & Fun',
    desc: 'Stories that make you smile, laugh, and feel warm inside.',
    genres: ['Comedy', 'Romance', 'Family', 'Music'],
    gradient: 'linear-gradient(145deg,#100800 0%,#3a1800 40%,#7a3400 80%,#c05000 100%)',
    glow: 'rgba(192,80,0,0.5)',
    accent: '#f08030',
    tags: ['Comedy', 'Romance', 'Family'],
  },
  {
    id: 'epic',
    emoji: '🚀',
    label: 'Big & Epic',
    desc: 'Large-scale adventures, spectacular action, and worlds beyond imagination.',
    genres: ['Action', 'Adventure', 'Sci-Fi', 'War'],
    gradient: 'linear-gradient(145deg,#000a14 0%,#021832 40%,#043870 80%,#0660b0 100%)',
    glow: 'rgba(6,96,176,0.5)',
    accent: '#4090e0',
    tags: ['Action', 'Adventure', 'Sci-Fi'],
  },
  {
    id: 'deep',
    emoji: '🧠',
    label: 'Deep & Thoughtful',
    desc: 'Films that stay with you long after the credits roll. Real stories, real emotions.',
    genres: ['Drama', 'Documentary', 'History', 'War'],
    gradient: 'linear-gradient(145deg,#060210 0%,#160630 40%,#2c0e60 80%,#480e90 100%)',
    glow: 'rgba(72,14,144,0.5)',
    accent: '#9060e0',
    tags: ['Drama', 'Documentary', 'History'],
  },
  {
    id: 'magical',
    emoji: '✨',
    label: 'Magical & Imaginative',
    desc: 'Worlds that couldn\'t exist, but feel more real than reality. Fantasy, wonder, and awe.',
    genres: ['Fantasy', 'Animation', 'Adventure', 'Family'],
    gradient: 'linear-gradient(145deg,#04060e 0%,#0c1430 40%,#183060 80%,#1e4080 100%)',
    glow: 'rgba(30,64,128,0.5)',
    accent: '#60a0e0',
    tags: ['Fantasy', 'Animation'],
  },
];

// ── Vibe card ─────────────────────────────────────────────────────
function VibeCard({ vibe, isSelected, onSelect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect(vibe.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`cinematic-card ${isSelected ? 'cinematic-card--selected' : ''}`}
      style={{
        position: 'relative',
        border: 'none',
        padding: 0,
        textAlign: 'left',
        width: '100%',
        minHeight: 120,
        background: vibe.gradient,
        outline: 'none',
        boxShadow: isSelected
          ? `0 0 0 2px ${vibe.accent}, 0 12px 40px ${vibe.glow}, 0 0 60px ${vibe.glow}`
          : hovered
            ? `0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)`
            : '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {/* Shimmer on hover/selected */}
      {(hovered || isSelected) && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.07) 50%,transparent 60%)',
          animation: 'shimmer 1.8s ease infinite',
        }} />
      )}

      {/* Selection overlay */}
      {isSelected && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse at 20% 50%, ${vibe.glow} 0%, transparent 65%)`,
        }} />
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, padding: '20px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>

          {/* Emoji */}
          <div style={{
            fontSize: '2rem', lineHeight: 1, flexShrink: 0,
            filter: isSelected ? 'drop-shadow(0 0 8px rgba(255,255,255,0.4))' : 'none',
            transition: 'filter 0.2s',
          }}>
            {vibe.emoji}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 800, fontSize: '1rem', color: '#fff',
              lineHeight: 1.2, marginBottom: 5,
              letterSpacing: '-0.01em',
            }}>
              {vibe.label}
            </div>
            <div style={{
              fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.5,
            }}>
              {vibe.desc}
            </div>

            {/* Genre tags */}
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {vibe.tags.map(t => (
                <span key={t} style={{
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.05em',
                  padding: '2px 9px', borderRadius: 99,
                  background: `rgba(255,255,255,0.10)`,
                  border: `1px solid ${isSelected ? vibe.accent + '88' : 'rgba(255,255,255,0.12)'}`,
                  color: isSelected ? vibe.accent : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.18s',
                }}>
                  {t}
                </span>
              ))}
              {vibe.tags.length < vibe.genres.length && (
                <span style={{
                  fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)',
                  padding: '2px 6px',
                }}>
                  +{vibe.genres.length - vibe.tags.length} more
                </span>
              )}
            </div>
          </div>

          {/* Check badge */}
          {isSelected ? (
            <div className="selection-check-badge" style={{ background: vibe.accent, position: 'relative', top: 0, right: 0, width: 26, height: 26 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          ) : (
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(255,255,255,0.08)',
              border: '2px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────
export default function OnboardingVibe() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(
    () => sessionStorage.getItem('ob_vibe_id') || null
  );

  const langConf = Number(sessionStorage.getItem('ob_conf_lang') || 15);
  const vibeConf = selectedId ? 10 : 0;
  const confidence = Math.min(30, langConf + vibeConf);

  const handleSelect = (id) => {
    setSelectedId(id);
    const vibe = VIBES.find(v => v.id === id);
    if (vibe) sessionStorage.setItem('ob_vibe_genres', JSON.stringify(vibe.genres));
    sessionStorage.setItem('ob_vibe_id', id);
    sessionStorage.setItem('ob_conf_vibe', String(langConf + 10));
    resetDownstreamOnboarding(2);
  };

  const handleNext = () => navigate('/onboarding/genres');
  const handleSkip = () => {
    sessionStorage.removeItem('ob_vibe_genres');
    sessionStorage.removeItem('ob_vibe_id');
    sessionStorage.setItem('ob_conf_vibe', String(langConf));
    resetDownstreamOnboarding(2);
    navigate('/onboarding/genres');
  };

  const selectedVibe = VIBES.find(v => v.id === selectedId);

  return (
    <OnboardingLayout
      step={2} totalSteps={6}
      title="What kind of stories move you?"
      subtitle="Choose the vibe that resonates — we'll pre-tune your genres and fine-tune from there"
      onBack={() => navigate('/onboarding/languages')}
      onNext={handleNext}
      isLoading={false}
      canProceed={true}
      nextLabel={selectedId ? `Continue with ${selectedVibe?.label}` : 'Continue'}
      confidence={confidence}
    >
      {/* Selected vibe summary banner */}
      {selectedVibe && (
        <div style={{
          marginBottom: 'var(--space-5)',
          padding: '10px 16px',
          background: `linear-gradient(90deg, ${selectedVibe.glow}30, transparent)`,
          border: `1px solid ${selectedVibe.accent}44`,
          borderLeft: `3px solid ${selectedVibe.accent}`,
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: '0.78rem',
          animation: 'fadeIn 0.3s ease',
        }}>
          <span style={{ fontSize: '1.1rem' }}>{selectedVibe.emoji}</span>
          <span style={{ color: selectedVibe.accent, fontWeight: 700 }}>{selectedVibe.label}</span>
          <span style={{ color: 'var(--text-muted)' }}>
            → pre-selecting {selectedVibe.genres.join(', ')}
          </span>
        </div>
      )}

      {/* Vibe cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {VIBES.map((vibe, idx) => (
          <div
            key={vibe.id}
            style={{ animation: `slideUp 0.35s ease ${idx * 0.07}s both` }}
          >
            <VibeCard
              vibe={vibe}
              isSelected={selectedId === vibe.id}
              onSelect={handleSelect}
            />
          </div>
        ))}
      </div>

      {/* Skip */}
      <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
        <button
          type="button"
          onClick={handleSkip}
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-disabled)', cursor: 'pointer',
            fontSize: '0.78rem', textDecoration: 'underline',
          }}
        >
          Skip — I'll pick genres myself
        </button>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </OnboardingLayout>
  );
}
