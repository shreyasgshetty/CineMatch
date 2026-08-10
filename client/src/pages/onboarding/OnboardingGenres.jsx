import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GENRES, GENRE_EMOJIS } from '../../utils/config';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w154';

const GENRE_GRADIENT = {
  Action:       'linear-gradient(135deg,#7f1d1d,#b91c1c)',
  Adventure:    'linear-gradient(135deg,#064e3b,#065f46)',
  Animation:    'linear-gradient(135deg,#312e81,#4338ca)',
  Comedy:       'linear-gradient(135deg,#713f12,#d97706)',
  Crime:        'linear-gradient(135deg,#1c1917,#44403c)',
  Documentary:  'linear-gradient(135deg,#1e3a5f,#1e40af)',
  Drama:        'linear-gradient(135deg,#3b0764,#7e22ce)',
  Family:       'linear-gradient(135deg,#14532d,#16a34a)',
  Fantasy:      'linear-gradient(135deg,#1e1b4b,#6d28d9)',
  History:      'linear-gradient(135deg,#78350f,#b45309)',
  Horror:       'linear-gradient(135deg,#0f172a,#1e293b)',
  Music:        'linear-gradient(135deg,#831843,#db2777)',
  Mystery:      'linear-gradient(135deg,#1c1917,#292524)',
  Romance:      'linear-gradient(135deg,#881337,#be123c)',
  'Sci-Fi':     'linear-gradient(135deg,#0c4a6e,#0369a1)',
  Thriller:     'linear-gradient(135deg,#1a1a2e,#16213e)',
  War:          'linear-gradient(135deg,#1c1917,#3f3f46)',
  Western:      'linear-gradient(135deg,#78350f,#92400e)',
  'TV Movie':   'linear-gradient(135deg,#1e3a5f,#2563eb)',
};

function PosterCollage({ posters, gradient }) {
  if (!posters || posters.length < 2) {
    return <div style={{ position: 'absolute', inset: 0, background: gradient || '#111' }} />;
  }
  const slots = [...posters, ...posters].slice(0, 4);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, overflow: 'hidden' }}>
      {slots.map((path, i) => (
        <div key={i} style={{ overflow: 'hidden', background: '#111' }}>
          <img
            src={`${TMDB_IMG}${path}`}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.82 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
      ))}
    </div>
  );
}

function GenreCard({ genre, isSelected, onToggle, posters }) {
  return (
    <button
      id={`genre-${genre.id}`}
      type="button"
      onClick={() => onToggle(genre.name)}
      style={{ position: 'relative', aspectRatio: '2/3', minHeight: 140, width: '100%', border: 'none', padding: 0, cursor: 'pointer', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'none' }}
    >
      <PosterCollage posters={posters} gradient={GENRE_GRADIENT[genre.name] || '#1a1a2e'} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 42%, rgba(0,0,0,0.12) 100%)' }} />
      {isSelected && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(201,168,76,0.2)', border: '3px solid var(--gold)', borderRadius: 'var(--radius-lg)', boxShadow: '0 0 24px rgba(201,168,76,0.4) inset, 0 0 20px rgba(201,168,76,0.3)' }} />
      )}
      {isSelected && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#0a0805', boxShadow: '0 0 8px rgba(201,168,76,0.6)' }}>✓</div>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px' }}>
        <div style={{ fontSize: '1.2rem', lineHeight: 1, marginBottom: 3 }}>{GENRE_EMOJIS[genre.name] || '🎬'}</div>
        <div style={{ fontWeight: 800, fontSize: '0.78rem', lineHeight: 1.2, color: isSelected ? 'var(--gold)' : '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)', transition: 'color 0.15s' }}>
          {genre.name}
        </div>
      </div>
    </button>
  );
}

export default function OnboardingGenres() {
  const navigate = useNavigate();

  const [selected, setSelected]   = useState([]);
  const [previews, setPreviews]   = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    const languages = JSON.parse(sessionStorage.getItem('ob_languages') || '[]').join(',');
    // Fetch genre previews using the user's selected languages so posters are relevant
    onboardingApi.getGenrePreviews({ languages })
      .then(res => setPreviews(res.data.previews || {}))
      .catch(() => {}); // fall back to gradients silently
  }, []);

  const toggle = (name) => {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    if (error) setError('');
  };

  const handleNext = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Build genre payload: selected = "like", unselected = omitted
      const genrePayload = Object.fromEntries(selected.map(name => [name, 'like']));
      await onboardingApi.saveGenres({ genres: genrePayload });
      sessionStorage.setItem('ob_genres', JSON.stringify(selected));
      navigate('/onboarding/movies');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally { setIsLoading(false); }
  };

  const selCount = selected.length;

  return (
    <OnboardingLayout
      step={2} totalSteps={5}
      title="Genres you love"
      subtitle="Select the kinds of stories you enjoy — your movie feed will be tailored to these"
      onBack={() => navigate('/onboarding/languages')}
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={selCount > 0 ? `Continue with ${selCount} genre${selCount > 1 ? 's' : ''} →` : 'Skip genres →'}
    >
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-5)', color: '#FCA5A5', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Selection summary */}
      {selCount > 0 && (
        <div style={{ padding: 'var(--space-2) var(--space-4)', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', fontSize: '0.8rem', color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700 }}>✓ {selCount} selected:</span>
          {selected.map(name => (
            <span key={name} style={{ padding: '2px 10px', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 600 }}>{name}</span>
          ))}
        </div>
      )}

      {selCount === 0 && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>💡</span> Tap any genre to select it — you can pick as many as you like
        </div>
      )}

      {/* Genre grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 'var(--space-3)' }}>
        {GENRES.map(genre => (
          <GenreCard
            key={genre.id}
            genre={genre}
            isSelected={selected.includes(genre.name)}
            onToggle={toggle}
            posters={previews[genre.name] || []}
          />
        ))}
      </div>
    </OnboardingLayout>
  );
}
