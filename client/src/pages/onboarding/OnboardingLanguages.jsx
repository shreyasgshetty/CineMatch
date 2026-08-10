import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANGUAGES } from '../../utils/config';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w154';

// Fallback gradient per language if DB has no posters yet
const LANG_GRADIENT = {
  kn: 'linear-gradient(135deg,#7c2d12,#c2410c)',
  te: 'linear-gradient(135deg,#064e3b,#065f46)',
  ta: 'linear-gradient(135deg,#1e3a5f,#1e40af)',
  ml: 'linear-gradient(135deg,#14532d,#166534)',
  hi: 'linear-gradient(135deg,#831843,#9d174d)',
  bn: 'linear-gradient(135deg,#3b0764,#6b21a8)',
  mr: 'linear-gradient(135deg,#713f12,#92400e)',
  pa: 'linear-gradient(135deg,#78350f,#d97706)',
  en: 'linear-gradient(135deg,#1e293b,#334155)',
  ko: 'linear-gradient(135deg,#7f1d1d,#991b1b)',
  ja: 'linear-gradient(135deg,#831843,#be185d)',
  zh: 'linear-gradient(135deg,#7f1d1d,#b91c1c)',
  es: 'linear-gradient(135deg,#713f12,#b45309)',
  fr: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)',
};

function PosterCollage({ posters, gradient }) {
  if (!posters || posters.length === 0) {
    return <div style={{ position: 'absolute', inset: 0, background: gradient }} />;
  }
  const slots = [...posters, ...posters].slice(0, 4);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, overflow: 'hidden' }}>
      {slots.map((path, i) => (
        <div key={i} style={{ overflow: 'hidden', background: '#111' }}>
          <img
            src={`${TMDB_IMG}${path}`}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
          />
        </div>
      ))}
    </div>
  );
}

function LanguageCard({ lang, isSelected, onToggle, posters }) {
  return (
    <button
      id={`lang-${lang.code}`}
      type="button"
      onClick={() => onToggle(lang.code)}
      style={{ position: 'relative', aspectRatio: '3/4', minHeight: 180, width: '100%', border: 'none', padding: 0, cursor: 'pointer', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'none' }}
    >
      {/* Poster collage or gradient */}
      <PosterCollage posters={posters} gradient={LANG_GRADIENT[lang.code] || LANG_GRADIENT.en} />

      {/* Dark overlay — stronger at bottom */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 40%, rgba(0,0,0,0.18) 100%)', transition: 'opacity 0.2s' }} />

      {/* Gold selection tint */}
      {isSelected && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(201,168,76,0.22)', border: '3px solid var(--gold)', borderRadius: 'var(--radius-lg)', boxShadow: '0 0 28px rgba(201,168,76,0.4) inset, 0 0 24px rgba(201,168,76,0.3)' }} />
      )}

      {/* Checkmark badge */}
      {isSelected && (
        <div style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: '50%', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, color: '#0a0805', boxShadow: '0 0 10px rgba(201,168,76,0.6)' }}>✓</div>
      )}

      {/* Text */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px' }}>
        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? 'var(--gold)' : '#fff', letterSpacing: '-0.01em', textShadow: '0 1px 4px rgba(0,0,0,0.8)', marginBottom: 2 }}>
          {lang.label}
        </div>
        <div style={{ fontSize: '0.65rem', color: isSelected ? 'rgba(201,168,76,0.85)' : 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
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
      nextLabel={selected.length > 0 ? `Continue with ${selected.length} language${selected.length > 1 ? 's' : ''} →` : 'Select a language'}
    >
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-5)', color: '#FCA5A5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {selected.length > 0 && (
        <div style={{ padding: 'var(--space-2) var(--space-4)', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', fontSize: '0.8rem', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700 }}>✓ Selected:</span>
          {selected.map(code => {
            const l = LANGUAGES.find(x => x.code === code);
            return <span key={code} style={{ padding: '2px 10px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>{l?.label}</span>;
          })}
        </div>
      )}

      {/* Indian Cinema */}
      <SectionHeader title="🇮🇳 Indian Cinema" sub="Sandalwood · Tollywood · Kollywood · Bollywood and more" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
        {indian.map(lang => (
          <LanguageCard key={lang.code} lang={lang} isSelected={selected.includes(lang.code)} onToggle={toggle} posters={previews[lang.code] || []} />
        ))}
      </div>

      {/* International */}
      <SectionHeader title="🌍 International Cinema" sub="Hollywood · Korean · Japanese and beyond" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 'var(--space-3)' }}>
        {intl.map(lang => (
          <LanguageCard key={lang.code} lang={lang} isSelected={selected.includes(lang.code)} onToggle={toggle} posters={previews[lang.code] || []} />
        ))}
      </div>
    </OnboardingLayout>
  );
}

function SectionHeader({ title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,var(--gold),transparent)', opacity: 0.3 }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>{title}</div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg,var(--gold),transparent)', opacity: 0.3 }} />
    </div>
  );
}
