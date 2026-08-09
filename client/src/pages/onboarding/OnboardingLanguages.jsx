import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANGUAGES } from '../../utils/config';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

export default function OnboardingLanguages() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (code) => {
    setSelected(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
    if (error) setError('');
  };

  const handleNext = async () => {
    if (selected.length === 0) { setError('Please select at least one language to continue.'); return; }
    setIsLoading(true);
    try {
      await onboardingApi.saveLanguages({ languages: selected });
      navigate('/onboarding/movies');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setIsLoading(false); }
  };

  const indian = LANGUAGES.filter(l => l.region === 'Indian');
  const intl   = LANGUAGES.filter(l => l.region === 'International');

  return (
    <OnboardingLayout
      step={1} totalSteps={5}
      title="What do you usually watch?"
      subtitle="Select all the languages you enjoy — we'll curate your perfect film universe"
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={selected.length > 0}
      nextLabel={selected.length > 0 ? `Continue with ${selected.length} language${selected.length > 1 ? 's' : ''} →` : 'Select a language'}
    >
      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-6)', color: '#FCA5A5', fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Selected summary */}
      {selected.length > 0 && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)',
          borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)',
          fontSize: '0.85rem', color: 'var(--gold)',
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          <span style={{ fontWeight: 700 }}>✓ Selected:</span>
          {selected.map(code => {
            const lang = LANGUAGES.find(l => l.code === code);
            return (
              <span key={code} style={{
                padding: '2px 10px', background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.25)', borderRadius: 'var(--radius-full)',
                fontSize: '0.78rem', fontWeight: 600,
              }}>
                {lang?.emoji} {lang?.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Indian Cinema */}
      <LanguageGroup
        title="🇮🇳 Indian Cinema"
        description="Sandalwood · Tollywood · Kollywood · Bollywood and more"
        languages={indian}
        selected={selected}
        onToggle={toggle}
      />

      <div style={{ height: 'var(--space-8)' }} />

      {/* International */}
      <LanguageGroup
        title="🌍 International Cinema"
        description="Hollywood · Korean · Japanese · Spanish and beyond"
        languages={intl}
        selected={selected}
        onToggle={toggle}
      />
    </OnboardingLayout>
  );
}

function LanguageGroup({ title, description, languages, selected, onToggle }) {
  return (
    <div>
      {/* Group header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--gold), transparent)', opacity: 0.3 }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            {title}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
        </div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg, var(--gold), transparent)', opacity: 0.3 }} />
      </div>

      {/* Cards grid */}
      <div className="grid-lang">
        {languages.map((lang, i) => {
          const isSelected = selected.includes(lang.code);
          return (
            <button
              key={lang.code}
              id={`lang-${lang.code}`}
              onClick={() => onToggle(lang.code)}
              type="button"
              className={`animate-fade-in`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div style={{
                padding: 'var(--space-4) var(--space-3)',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.06) 100%)'
                  : 'var(--bg-card)',
                border: `2px solid ${isSelected ? 'var(--gold)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer', textAlign: 'center',
                transition: 'all var(--t-base)',
                position: 'relative', overflow: 'hidden',
                boxShadow: isSelected ? '0 0 20px rgba(201,168,76,0.18), 0 0 0 1px rgba(201,168,76,0.12)' : 'none',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                userSelect: 'none',
              }}
              onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
              onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.transform = 'scale(1)'; } }}
              >
                {/* Check mark */}
                {isSelected && (
                  <div style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'var(--gradient-gold)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', fontWeight: 900, color: '#0a0805',
                  }}>✓</div>
                )}
                {/* Emoji */}
                <div style={{ fontSize: '1.8rem', marginBottom: 'var(--space-2)', lineHeight: 1 }}>{lang.emoji}</div>
                {/* Language name */}
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? 'var(--gold)' : 'var(--text-primary)', marginBottom: 3 }}>
                  {lang.label}
                </div>
                {/* Industry */}
                <div style={{ fontSize: '0.65rem', color: isSelected ? 'var(--gold-dim)' : 'var(--text-disabled)', fontWeight: 500 }}>
                  {lang.industry}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
