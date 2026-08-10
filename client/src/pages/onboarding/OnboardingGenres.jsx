import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GENRES, GENRE_EMOJIS } from '../../utils/config';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

/**
 * OnboardingGenres — Step 3
 *
 * Shows all genres as interactive cards.
 * Each genre can be: love / like / neutral (default) / dislike
 * The cycle order on click: neutral → like → love → dislike → neutral
 *
 * Data sent: { genres: { "Action": "like", "Horror": "dislike", ... } }
 * Only genres with non-neutral values are sent.
 */

const PREFERENCE_CYCLE = ['neutral', 'like', 'love', 'dislike'];

const PREF_STYLE = {
  neutral: {
    label: '', icon: '',
    border: 'var(--border-subtle)',
    bg: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    dot: 'var(--bg-overlay)',
  },
  like: {
    label: 'Like', icon: '👍',
    border: 'rgba(201,168,76,0.5)',
    bg: 'rgba(201,168,76,0.07)',
    color: 'var(--gold)',
    dot: 'var(--gold)',
  },
  love: {
    label: 'Love', icon: '❤️',
    border: 'rgba(201,168,76,0.9)',
    bg: 'rgba(201,168,76,0.14)',
    color: '#F5C842',
    dot: '#F5C842',
  },
  dislike: {
    label: 'Dislike', icon: '👎',
    border: 'rgba(239,68,68,0.35)',
    bg: 'rgba(239,68,68,0.05)',
    color: '#FCA5A5',
    dot: '#FCA5A5',
  },
};

export default function OnboardingGenres() {
  const navigate = useNavigate();

  // Map: genre name → preference level
  const [prefs, setPrefs] = useState(() =>
    Object.fromEntries(GENRES.map(g => [g.name, 'neutral']))
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  const cyclePreference = (name) => {
    setPrefs(prev => {
      const current = prev[name];
      const idx = PREFERENCE_CYCLE.indexOf(current);
      const next = PREFERENCE_CYCLE[(idx + 1) % PREFERENCE_CYCLE.length];
      return { ...prev, [name]: next };
    });
    if (error) setError('');
  };

  const setPreference = (name, pref) => {
    setPrefs(prev => ({ ...prev, [name]: pref }));
  };

  const nonNeutral = Object.entries(prefs).filter(([, v]) => v !== 'neutral');
  const loveCount    = nonNeutral.filter(([, v]) => v === 'love').length;
  const likeCount    = nonNeutral.filter(([, v]) => v === 'like').length;
  const dislikeCount = nonNeutral.filter(([, v]) => v === 'dislike').length;

  const handleNext = async () => {
    setIsLoading(true);
    setError('');
    try {
      const genrePayload = Object.fromEntries(
        Object.entries(prefs).filter(([, v]) => v !== 'neutral')
      );
      await onboardingApi.saveGenres({ genres: genrePayload });
      navigate('/onboarding/actors');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save genre preferences.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={3} totalSteps={5}
      title="What kind of stories do you love?"
      subtitle="Tap a genre to cycle through your preference — the more you tell us, the better your recommendations"
      onBack={() => navigate('/onboarding/movies')}
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={nonNeutral.length > 0 ? `Continue with ${nonNeutral.length} preference${nonNeutral.length > 1 ? 's' : ''} →` : 'Skip genres →'}
    >
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-5)', color: '#FCA5A5', fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠️</span> {error}
        </div>
      )}

      {/* ── Summary bar ─────────────────────────────────────────── */}
      {nonNeutral.length > 0 && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(201,168,76,0.05)',
          border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-5)',
          display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap',
          fontSize: '0.78rem',
        }}>
          {loveCount > 0 && <span><span style={{ color: '#F5C842' }}>❤️ {loveCount}</span> <span style={{ color: 'var(--text-muted)' }}>loved</span></span>}
          {likeCount > 0 && <span><span style={{ color: 'var(--gold)' }}>👍 {likeCount}</span> <span style={{ color: 'var(--text-muted)' }}>liked</span></span>}
          {dislikeCount > 0 && <span><span style={{ color: '#FCA5A5' }}>👎 {dislikeCount}</span> <span style={{ color: 'var(--text-muted)' }}>disliked</span></span>}
          <span style={{ color: 'var(--text-disabled)', marginLeft: 'auto' }}>tap to cycle</span>
        </div>
      )}

      {/* ── How to use hint ─────────────────────────────────────── */}
      {nonNeutral.length === 0 && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)',
          fontSize: '0.78rem', color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>💡</span>
          <span>Tap a genre card to set: <b style={{ color: 'var(--gold)' }}>Like</b> → <b style={{ color: '#F5C842' }}>Love</b> → <b style={{ color: '#FCA5A5' }}>Dislike</b> → back to neutral</span>
        </div>
      )}

      {/* ── Genre grid ──────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: 'var(--space-3)',
      }}>
        {GENRES.map((genre, i) => {
          const pref = prefs[genre.name];
          const style = PREF_STYLE[pref];
          const emoji = GENRE_EMOJIS[genre.name] || '🎬';

          return (
            <button
              key={genre.id}
              id={`genre-${genre.id}`}
              type="button"
              onClick={() => cyclePreference(genre.name)}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div style={{
                padding: 'var(--space-4) var(--space-3)',
                background: style.bg,
                border: `2px solid ${style.border}`,
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
                boxShadow: pref !== 'neutral'
                  ? `0 0 18px ${pref === 'dislike' ? 'rgba(239,68,68,0.12)' : 'rgba(201,168,76,0.15)'}`
                  : 'none',
                transform: pref !== 'neutral' ? 'scale(1.02)' : 'scale(1)',
                userSelect: 'none',
              }}
              onMouseEnter={e => { if (pref === 'neutral') { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
              onMouseLeave={e => { if (pref === 'neutral') { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'scale(1)'; } }}
              >
                {/* Preference badge */}
                {pref !== 'neutral' && (
                  <div style={{
                    position: 'absolute', top: 5, right: 5,
                    width: 18, height: 18, borderRadius: '50%',
                    background: style.dot,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem',
                    boxShadow: `0 0 8px ${style.dot}60`,
                  }}>
                    {pref === 'love' ? '♥' : pref === 'like' ? '✓' : '✕'}
                  </div>
                )}

                <div style={{ fontSize: '1.8rem', marginBottom: 'var(--space-2)', lineHeight: 1 }}>
                  {emoji}
                </div>
                <div style={{
                  fontWeight: 700, fontSize: '0.78rem',
                  color: pref !== 'neutral' ? style.color : 'var(--text-primary)',
                  marginBottom: pref !== 'neutral' ? 3 : 0,
                  lineHeight: 1.2,
                }}>
                  {genre.name}
                </div>
                {pref !== 'neutral' && (
                  <div style={{ fontSize: '0.62rem', color: style.color, fontWeight: 600, marginTop: 3 }}>
                    {style.icon} {style.label}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Quick-set row ────────────────────────────────────────── */}
      <div style={{
        marginTop: 'var(--space-6)', padding: 'var(--space-4)',
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick set all to:</span>
        {['neutral', 'like', 'love'].map(pref => (
          <button
            key={pref}
            type="button"
            onClick={() => setPrefs(Object.fromEntries(GENRES.map(g => [g.name, pref])))}
            style={{
              padding: '4px 14px', background: PREF_STYLE[pref].bg,
              border: `1px solid ${PREF_STYLE[pref].border}`,
              borderRadius: 'var(--radius-full)', cursor: 'pointer',
              fontSize: '0.73rem', fontWeight: 700,
              color: pref === 'neutral' ? 'var(--text-muted)' : PREF_STYLE[pref].color,
              transition: 'all 0.15s',
            }}
          >
            {pref === 'neutral' ? '↺ Reset all' : `${PREF_STYLE[pref].icon} All ${PREF_STYLE[pref].label}`}
          </button>
        ))}
      </div>
    </OnboardingLayout>
  );
}
