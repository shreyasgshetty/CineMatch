import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANGUAGES } from '../../utils/config';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w154';

// Rich warm gradient per language — used when no posters available
const LANG_GRADIENT = {
  kn: 'linear-gradient(145deg,#2a0a0a 0%,#6b1c1c 50%,#a0341a 100%)',
  te: 'linear-gradient(145deg,#062818 0%,#0f5236 50%,#1a7a52 100%)',
  ta: 'linear-gradient(145deg,#0a1a3a 0%,#1a3a70 50%,#1e50a0 100%)',
  ml: 'linear-gradient(145deg,#062212 0%,#125230 50%,#1a7044 100%)',
  hi: 'linear-gradient(145deg,#2e0828 0%,#6b1260 50%,#9a1a7a 100%)',
  bn: 'linear-gradient(145deg,#18062a 0%,#421880 50%,#6228a8 100%)',
  mr: 'linear-gradient(145deg,#2a1000 0%,#6e2e00 50%,#a04a00 100%)',
  pa: 'linear-gradient(145deg,#2a1a00 0%,#7a4800 50%,#c07000 100%)',
  en: 'linear-gradient(145deg,#080e18 0%,#142030 50%,#1e3248 100%)',
  ko: 'linear-gradient(145deg,#280808 0%,#681010 50%,#9a1818 100%)',
  ja: 'linear-gradient(145deg,#280a1a 0%,#6a1040 50%,#9e1860 100%)',
  zh: 'linear-gradient(145deg,#280808 0%,#701010 50%,#a81a1a 100%)',
  es: 'linear-gradient(145deg,#221000 0%,#6a2e00 50%,#a04800 100%)',
  fr: 'linear-gradient(145deg,#080e28 0%,#122070 50%,#1a30a8 100%)',
};

// Decorative pattern overlay for cards with no posters
const LANG_PATTERN_COLOR = {
  kn: 'rgba(160,52,26,0.5)',  te: 'rgba(26,122,82,0.5)',
  ta: 'rgba(30,80,160,0.5)',  ml: 'rgba(26,112,68,0.5)',
  hi: 'rgba(154,26,122,0.5)', bn: 'rgba(98,40,168,0.5)',
  mr: 'rgba(160,74,0,0.5)',   pa: 'rgba(192,112,0,0.5)',
  en: 'rgba(30,50,72,0.5)',   ko: 'rgba(154,24,24,0.5)',
  ja: 'rgba(158,24,96,0.5)',  zh: 'rgba(168,26,26,0.5)',
  es: 'rgba(160,72,0,0.5)',   fr: 'rgba(26,48,168,0.5)',
};

function PosterCollage({ posters, gradient, patternColor }) {
  if (!posters || posters.length === 0) {
    // No posters — show a rich decorative placeholder
    return (
      <div style={{ position: 'absolute', inset: 0, background: gradient }}>
        {/* Decorative grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(${patternColor} 1px, transparent 1px), linear-gradient(90deg, ${patternColor} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          opacity: 0.3,
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 30% 70%, rgba(255,255,255,0.06) 0%, transparent 60%)',
        }} />
      </div>
    );
  }
  const slots = [...posters, ...posters].slice(0, 4);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, overflow: 'hidden' }}>
      {slots.map((path, i) => (
        <div key={i} style={{ overflow: 'hidden', background: '#111', position: 'relative' }}>
          <img
            src={`${TMDB_IMG}${path}`}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
      ))}
    </div>
  );
}

function LanguageCard({ lang, isSelected, onToggle, posters }) {
  const [hovered, setHovered] = useState(false);
  const hasPosters = posters && posters.length > 0;

  return (
    <button
      id={`lang-${lang.code}`}
      type="button"
      onClick={() => onToggle(lang.code)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', aspectRatio: '3/4', minHeight: 170, width: '100%',
        border: 'none', padding: 0, cursor: 'pointer',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'none',
        outline: isSelected ? '2.5px solid var(--gold)' : '2.5px solid transparent',
        outlineOffset: isSelected ? '0px' : '0px',
        transition: 'outline-color var(--t-base), transform var(--t-base), box-shadow var(--t-base)',
        transform: hovered && !isSelected ? 'translateY(-3px)' : isSelected ? 'translateY(-2px)' : 'none',
        boxShadow: isSelected
          ? '0 0 0 2.5px var(--gold), 0 8px 32px rgba(212,168,67,0.35), 0 0 24px rgba(212,168,67,0.2) inset'
          : hovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      }}
    >
      {/* Poster collage or decorative gradient */}
      <PosterCollage
        posters={posters}
        gradient={LANG_GRADIENT[lang.code] || LANG_GRADIENT.en}
        patternColor={LANG_PATTERN_COLOR[lang.code] || 'rgba(255,255,255,0.2)'}
      />

      {/* Dark overlay — bottom weighted */}
      <div style={{
        position: 'absolute', inset: 0,
        background: hasPosters
          ? 'linear-gradient(to top, rgba(0,0,0,0.92) 38%, rgba(0,0,0,0.15) 100%)'
          : 'linear-gradient(to top, rgba(0,0,0,0.80) 30%, rgba(0,0,0,0.05) 100%)',
        transition: 'opacity var(--t-base)',
      }} />

      {/* Hover shimmer */}
      {hovered && !isSelected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)',
        }} />
      )}

      {/* Selected tint */}
      {isSelected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(212,168,67,0.10)',
        }} />
      )}

      {/* Checkmark badge */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: 9, right: 9,
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--gradient-gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px rgba(212,168,67,0.6)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d0a02" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}

      {/* Text */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px' }}>
        <div style={{
          fontWeight: 800, fontSize: '0.92rem',
          color: isSelected ? 'var(--gold)' : '#fff',
          letterSpacing: '-0.01em', textShadow: '0 1px 6px rgba(0,0,0,0.9)',
          marginBottom: 2, transition: 'color var(--t-fast)',
        }}>
          {lang.label}
        </div>
        <div style={{
          fontSize: '0.62rem',
          color: isSelected ? 'rgba(212,168,67,0.8)' : 'rgba(255,255,255,0.55)',
          fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          transition: 'color var(--t-fast)',
        }}>
          {lang.industry}
        </div>
      </div>
    </button>
  );
}

export default function OnboardingLanguages() {
  const navigate   = useNavigate();
  const [selected, setSelected]   = useState([]);
  const [previews, setPreviews]   = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    onboardingApi.getLanguagePreviews()
      .then(res => setPreviews(res.data.previews || {}))
      .catch(() => {}); // silently fall back to gradients
  }, []);

  const toggle = (code) => {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
    if (error) setError('');
  };

  const handleNext = async () => {
    if (selected.length === 0) { setError('Please select at least one language.'); return; }
    setIsLoading(true);
    try {
      await onboardingApi.saveLanguages({ languages: selected });
      sessionStorage.setItem('ob_languages', JSON.stringify(selected));
      navigate('/onboarding/genres');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally { setIsLoading(false); }
  };

  const indian = LANGUAGES.filter(l => l.region === 'Indian');
  const intl   = LANGUAGES.filter(l => l.region === 'International');

  return (
    <OnboardingLayout
      step={1} totalSteps={5}
      title="What cinema do you love?"
      subtitle="Pick your languages — we'll build your personal universe from the very best of each industry"
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={selected.length > 0}
      nextLabel={selected.length > 0 ? `Continue with ${selected.length} language${selected.length > 1 ? 's' : ''}` : 'Select a language'}
    >
      {error && (
        <div className="info-banner info-banner--error" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {selected.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          marginBottom: 'var(--space-5)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(212,168,67,0.05)',
          border: '1px solid rgba(212,168,67,0.15)',
          borderRadius: 'var(--radius-md)',
        }}>
          <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--gold)', marginRight: 4 }}>Selected:</span>
          {selected.map(code => {
            const l = LANGUAGES.find(x => x.code === code);
            return (
              <span key={code} className="chip">{l?.label}</span>
            );
          })}
        </div>
      )}

      {/* Indian Cinema */}
      <CinematicDivider label="Indian Cinema" sub="Sandalwood · Tollywood · Kollywood · Bollywood and more" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
        {indian.map(lang => (
          <LanguageCard key={lang.code} lang={lang} isSelected={selected.includes(lang.code)} onToggle={toggle} posters={previews[lang.code] || []} />
        ))}
      </div>

      {/* International Cinema */}
      <CinematicDivider label="International Cinema" sub="Hollywood · Korean · Japanese and beyond" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 'var(--space-3)' }}>
        {intl.map(lang => (
          <LanguageCard key={lang.code} lang={lang} isSelected={selected.includes(lang.code)} onToggle={toggle} posters={previews[lang.code] || []} />
        ))}
      </div>
    </OnboardingLayout>
  );
}

function CinematicDivider({ label, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(212,168,67,0.4),transparent)' }} />
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontSize: '0.67rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>{label}</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg,rgba(212,168,67,0.4),transparent)' }} />
    </div>
  );
}
