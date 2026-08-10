import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const TMDB_FACE = 'https://image.tmdb.org/t/p/w185';

function PersonCard({ person, selected, onToggle }) {
  return (
    <button
      id={`actor-${person.tmdbId}`}
      type="button"
      onClick={() => onToggle(person.tmdbId)}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'center', width: '100%' }}
    >
      <div style={{
        position: 'relative', transition: 'transform 0.18s',
        transform: selected ? 'scale(1.04)' : 'scale(1)',
      }}>
        {/* Circle photo */}
        <div style={{
          width: '100%', aspectRatio: '1', borderRadius: '50%',
          overflow: 'hidden', background: 'var(--bg-overlay)',
          border: selected ? '3px solid var(--gold)' : '3px solid var(--border-subtle)',
          boxShadow: selected ? '0 0 20px rgba(201,168,76,0.4)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s', margin: '0 auto', maxWidth: 100,
        }}>
          {person.profilePath ? (
            <img src={`${TMDB_FACE}${person.profilePath}`} alt={person.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', background: 'var(--bg-elevated)' }}>
              {person.role === 'director' ? '🎬' : '🎭'}
            </div>
          )}
        </div>

        {/* Heart badge */}
        {selected && (
          <div style={{
            position: 'absolute', bottom: 4, right: '50%', transform: 'translateX(50%)',
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--gradient-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.6rem', color: '#0a0805', fontWeight: 900,
            boxShadow: '0 0 8px rgba(201,168,76,0.6)',
          }}>♥</div>
        )}
      </div>

      {/* Name */}
      <div style={{
        marginTop: 'var(--space-2)', fontWeight: 700, fontSize: '0.78rem',
        color: selected ? 'var(--gold)' : 'var(--text-primary)',
        lineHeight: 1.2, transition: 'color 0.15s',
      }}>{person.name}</div>

      {person.knownFor && (
        <div style={{ fontSize: '0.62rem', color: 'var(--text-disabled)', marginTop: 2, lineHeight: 1.3 }}>
          {person.knownFor}
        </div>
      )}
    </button>
  );
}

export default function OnboardingActors() {
  const navigate = useNavigate();

  const [people, setPeople]           = useState([]);
  const [selected, setSelected]       = useState(new Set());
  const [isFetching, setIsFetching]   = useState(true);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    const mediaIds  = JSON.parse(sessionStorage.getItem('ob_watched_ids') || '[]').join(',');
    const languages = JSON.parse(sessionStorage.getItem('ob_languages') || '[]').join(',');
    onboardingApi.getPeopleSuggestions({ mediaIds, languages, role: 'actor', limit: 40 })
      .then(res => setPeople(res.data.people || []))
      .catch(() => setError('Could not load actor suggestions.'))
      .finally(() => setIsFetching(false));
  }, []);

  const toggle = (tmdbId) => setSelected(prev => {
    const next = new Set(prev);
    next.has(tmdbId) ? next.delete(tmdbId) : next.add(tmdbId);
    return next;
  });

  const handleNext = async () => {
    setIsLoading(true);
    setError('');
    try {
      const actors = people
        .filter(p => selected.has(p.tmdbId))
        .map(p => ({ tmdbId: p.tmdbId, name: p.name, preference: 'like' }));
      await onboardingApi.saveActors({ actors });
      navigate('/onboarding/directors');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save. Try again.');
    } finally { setIsLoading(false); }
  };

  const selCount = selected.size;

  return (
    <OnboardingLayout
      step={4} totalSteps={5}
      title="Actors you love"
      subtitle="These actors appear in movies from your languages — tap the ones you enjoy watching"
      onBack={() => navigate('/onboarding/movies')}
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={selCount > 0 ? `Continue with ${selCount} actor${selCount > 1 ? 's' : ''} →` : 'Skip this step →'}
    >
      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'var(--radius-md)', padding:'var(--space-3) var(--space-4)', marginBottom:'var(--space-5)', color:'#FCA5A5', fontSize:'0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {selCount > 0 && (
        <div style={{ padding:'var(--space-2) var(--space-4)', background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:'var(--radius-md)', marginBottom:'var(--space-5)', fontSize:'0.8rem', color:'var(--gold)', fontWeight:600 }}>
          ♥ {selCount} actor{selCount > 1 ? 's' : ''} selected
        </div>
      )}

      {isFetching && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:'var(--space-5)' }}>
          {[...Array(20)].map((_,i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--bg-card)', animation:'shimmer 1.5s ease-in-out infinite' }} />
              <div style={{ width:60, height:10, borderRadius:4, background:'var(--bg-card)' }} />
            </div>
          ))}
        </div>
      )}

      {!isFetching && people.length === 0 && (
        <div style={{ textAlign:'center', padding:'var(--space-10)', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'var(--space-3)' }}>🎭</div>
          <div style={{ fontWeight:700, marginBottom:6 }}>No actor data yet</div>
          <div style={{ fontSize:'0.82rem' }}>Rate more movies in the previous step or the database may still be loading.</div>
        </div>
      )}

      {!isFetching && people.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:'var(--space-5)' }}>
          {people.map(p => (
            <PersonCard
              key={p.tmdbId} person={p}
              selected={selected.has(p.tmdbId)}
              onToggle={toggle}
            />
          ))}
        </div>
      )}
    </OnboardingLayout>
  );
}
