import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANGUAGES } from '../../utils/config';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

/**
 * OnboardingLanguages — Step 1 of 5
 *
 * User selects which languages they usually watch.
 * Selections stored in user preferences as array of language codes.
 * Language selection determines which industries are shown in Step 2.
 */
export default function OnboardingLanguages() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleLanguage = (code) => {
    setSelected(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  };

  const handleNext = async () => {
    if (selected.length === 0) {
      setError('Please select at least one language to continue.');
      return;
    }
    setIsLoading(true);
    try {
      await onboardingApi.saveLanguages({ languages: selected });
      navigate('/onboarding/movies');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const indianLanguages  = LANGUAGES.filter(l => l.region === 'Indian');
  const intlLanguages    = LANGUAGES.filter(l => l.region === 'International');

  return (
    <OnboardingLayout
      step={1}
      totalSteps={5}
      title="What do you usually watch?"
      subtitle="Select all the languages you enjoy — we'll find the best recommendations for you"
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={selected.length > 0}
      nextLabel={`Continue with ${selected.length > 0 ? selected.length : ''} language${selected.length !== 1 ? 's' : ''}`}
    >
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-6)', color: 'var(--color-error)', fontSize: 'var(--text-sm)',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Indian Languages */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.1em',
          color: 'var(--color-text-muted)', textTransform: 'uppercase',
          marginBottom: 'var(--space-4)',
        }}>
          🇮🇳 Indian Cinema
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 'var(--space-3)',
        }}>
          {indianLanguages.map(lang => (
            <LanguageCard
              key={lang.code}
              lang={lang}
              isSelected={selected.includes(lang.code)}
              onToggle={() => toggleLanguage(lang.code)}
            />
          ))}
        </div>
      </div>

      {/* International Languages */}
      <div>
        <div style={{
          fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.1em',
          color: 'var(--color-text-muted)', textTransform: 'uppercase',
          marginBottom: 'var(--space-4)',
        }}>
          🌍 International Cinema
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 'var(--space-3)',
        }}>
          {intlLanguages.map(lang => (
            <LanguageCard
              key={lang.code}
              lang={lang}
              isSelected={selected.includes(lang.code)}
              onToggle={() => toggleLanguage(lang.code)}
            />
          ))}
        </div>
      </div>

      {selected.length > 0 && (
        <div style={{
          marginTop: 'var(--space-6)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(232,87,42,0.08)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(232,87,42,0.2)',
          fontSize: 'var(--text-sm)', color: 'var(--color-brand-primary)',
        }}>
          ✓ Selected: {selected.map(code => LANGUAGES.find(l => l.code === code)?.label).join(', ')}
        </div>
      )}
    </OnboardingLayout>
  );
}

function LanguageCard({ lang, isSelected, onToggle }) {
  return (
    <button
      id={`lang-${lang.code}`}
      onClick={onToggle}
      className={`select-card${isSelected ? ' selected' : ''}`}
      type="button"
      style={{ position: 'relative' }}
    >
      {isSelected && (
        <span style={{
          position: 'absolute', top: 6, right: 8,
          fontSize: '12px', color: 'var(--color-brand-primary)',
        }}>✓</span>
      )}
      <span className="select-card__emoji">{lang.emoji}</span>
      <div style={{ fontWeight: 700, marginBottom: '2px' }}>{lang.label}</div>
      <div style={{ fontSize: '11px', color: isSelected ? 'var(--color-brand-secondary)' : 'var(--color-text-disabled)', fontWeight: 400 }}>
        {lang.industry}
      </div>
    </button>
  );
}
