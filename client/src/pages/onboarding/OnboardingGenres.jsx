import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GENRES } from '../../utils/config';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { resetDownstreamOnboarding } from '../../utils/onboardingHelper';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w154';

const GENRE_GRADIENT = {
  Action:       'linear-gradient(145deg,#2a0404 0%,#8a1010 50%,#c41818 100%)',
  Adventure:    'linear-gradient(145deg,#041a10 0%,#0e5430 50%,#167848 100%)',
  Animation:    'linear-gradient(145deg,#0c0a28 0%,#2a247a 50%,#3e38b2 100%)',
  Comedy:       'linear-gradient(145deg,#1e0e00 0%,#7a3800 50%,#b85a00 100%)',
  Crime:        'linear-gradient(145deg,#080808 0%,#202020 50%,#383838 100%)',
  Documentary:  'linear-gradient(145deg,#060e20 0%,#102060 50%,#183090 100%)',
  Drama:        'linear-gradient(145deg,#140420 0%,#4a1268 50%,#701c9e 100%)',
  Family:       'linear-gradient(145deg,#041a04 0%,#126212 50%,#1c9020 100%)',
  Fantasy:      'linear-gradient(145deg,#080620 0%,#281a80 50%,#4028b8 100%)',
  History:      'linear-gradient(145deg,#200c00 0%,#723000 50%,#a84800 100%)',
  Horror:       'linear-gradient(145deg,#020204 0%,#0a0814 50%,#140c20 100%)',
  Music:        'linear-gradient(145deg,#240412 0%,#7a0e38 50%,#b41858 100%)',
  Mystery:      'linear-gradient(145deg,#060608 0%,#181820 50%,#222232 100%)',
  Romance:      'linear-gradient(145deg,#1e0406 0%,#780e16 50%,#b01826 100%)',
  'Sci-Fi':     'linear-gradient(145deg,#020e18 0%,#083870 50%,#104ea8 100%)',
  Thriller:     'linear-gradient(145deg,#06060e 0%,#0e0e22 50%,#161630 100%)',
  War:          'linear-gradient(145deg,#080604 0%,#1e1a10 50%,#2e2818 100%)',
  Western:      'linear-gradient(145deg,#180800 0%,#643000 50%,#944800 100%)',
  'TV Movie':   'linear-gradient(145deg,#060e1e 0%,#102060 50%,#183090 100%)',
};

// Short icon labels for each genre
const GENRE_ICON = {
  Action: 'ACT', Adventure: 'ADV', Animation: 'ANI', Comedy: 'COM',
  Crime: 'CRM', Documentary: 'DOC', Drama: 'DRM', Family: 'FAM',
  Fantasy: 'FAN', History: 'HST', Horror: 'HOR', Music: 'MUS',
  Mystery: 'MYS', Romance: 'ROM', 'Sci-Fi': 'SCI', Thriller: 'THR',
  War: 'WAR', Western: 'WST', 'TV Movie': 'TVM',
};

function PosterCollage({ posters, gradient }) {
  if (!posters || posters.length < 2) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: gradient || '#111' }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 35% 65%, rgba(255,255,255,0.07) 0%, transparent 55%)',
        }} />
      </div>
    );
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
  const [hovered, setHovered] = useState(false);

  return (
    <button
      id={`genre-${genre.id}`}
      type="button"
      onClick={() => onToggle(genre.name)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', aspectRatio: '2/3', minHeight: 130, width: '100%',
        border: 'none', padding: 0, cursor: 'pointer',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'none',
        transition: 'transform var(--t-base), box-shadow var(--t-base)',
        transform: hovered && !isSelected ? 'translateY(-3px)' : isSelected ? 'translateY(-2px)' : 'none',
        outline: isSelected ? '2.5px solid var(--gold)' : '2.5px solid transparent',
        boxShadow: isSelected
          ? '0 0 0 2.5px var(--gold), 0 8px 28px rgba(212,168,67,0.30)'
          : hovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      }}
    >
      <PosterCollage posters={posters} gradient={GENRE_GRADIENT[genre.name] || '#1a1a2e'} />

      {/* Base dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.94) 38%, rgba(0,0,0,0.10) 100%)' }} />

      {/* Selected tint */}
      {isSelected && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(212,168,67,0.10)' }} />
      )}

      {/* Check badge */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--gradient-gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 10px rgba(212,168,67,0.6)',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0d0a02" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}

      {/* Genre text */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 10px' }}>
        {/* Short identifier tag */}
        <div style={{
          fontSize: '0.52rem', fontWeight: 900, letterSpacing: '0.1em',
          color: isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase', marginBottom: 3,
          transition: 'color var(--t-fast)',
        }}>
          {GENRE_ICON[genre.name] || '---'}
        </div>
        <div style={{
          fontWeight: 800, fontSize: '0.78rem', lineHeight: 1.2,
          color: isSelected ? 'var(--gold)' : '#fff',
          textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          transition: 'color var(--t-fast)',
        }}>
          {genre.name}
        </div>
      </div>
    </button>
  );
}

export default function OnboardingGenres() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(() => {
    const saved = JSON.parse(sessionStorage.getItem('ob_genres') || '[]');
    if (saved.length > 0) return saved;
    return JSON.parse(sessionStorage.getItem('ob_vibe_genres') || '[]');
  });
  const [previews, setPreviews]   = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    const languages = JSON.parse(sessionStorage.getItem('ob_languages') || '[]').join(',');
    onboardingApi.getGenrePreviews({ languages })
      .then(res => setPreviews(res.data.previews || {}))
      .catch(() => {});
  }, []);

  const langConf = Number(sessionStorage.getItem('ob_conf_lang') || 15);
  const vibeConf = Number(sessionStorage.getItem('ob_conf_vibe') || (sessionStorage.getItem('ob_vibe_id') ? 25 : 15));
  const baseConf = Math.max(langConf, vibeConf);
  const genreConf = Math.min(45, baseConf + selected.length * 3);

  const toggle = (name) => {
    setSelected(prev => {
      const next = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name];
      sessionStorage.setItem('ob_genres', JSON.stringify(next));
      sessionStorage.setItem('ob_conf_genres', String(Math.min(45, baseConf + next.length * 3)));
      resetDownstreamOnboarding(3);
      return next;
    });
    if (error) setError('');
  };

  const handleNext = async () => {
    setIsLoading(true);
    setError('');
    try {
      const genrePayload = Object.fromEntries(selected.map(name => [name, 'like']));
      await onboardingApi.saveGenres({ genres: genrePayload });
      sessionStorage.setItem('ob_genres', JSON.stringify(selected));
      sessionStorage.setItem('ob_conf_genres', String(genreConf));
      navigate('/onboarding/movies');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally { setIsLoading(false); }
  };

  const selCount = selected.length;

  return (
    <OnboardingLayout
      step={3} totalSteps={6}
      title="Genres you love"
      subtitle="Your vibe pre-selected these — adjust freely. Your movie feed will be tailored to your picks."
      onBack={() => navigate('/onboarding/vibe')}
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={selCount > 0 ? `Continue with ${selCount} genre${selCount > 1 ? 's' : ''}` : 'Skip genres'}
      confidence={genreConf}
    >
      {error && (
        <div className="info-banner info-banner--error" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {selCount > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          marginBottom: 'var(--space-5)',
          padding: 'var(--space-3) var(--space-4)',
          background: 'rgba(212,168,67,0.05)',
          border: '1px solid rgba(212,168,67,0.15)',
          borderRadius: 'var(--radius-md)',
        }}>
          <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--gold)', marginRight: 4 }}>{selCount} selected:</span>
          {selected.map(name => <span key={name} className="chip">{name}</span>)}
        </div>
      )}

      {selCount === 0 && (
        <div className="info-banner" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Tap any genre to select it — you can pick as many as you like
        </div>
      )}

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
