import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const TMDB_FACE = 'https://image.tmdb.org/t/p/w185';

function PersonCard({ person, selected, onToggle }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      id={`actor-${person.tmdbId}`}
      type="button"
      onClick={() => onToggle(person.tmdbId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'center', width: '100%' }}
    >
      <div style={{ position: 'relative', transition: 'transform var(--t-base)', transform: selected ? 'scale(1.06)' : hovered ? 'scale(1.03)' : 'scale(1)' }}>
        {/* Circle photo */}
        <div style={{
          width: '100%', aspectRatio: '1', borderRadius: '50%',
          overflow: 'hidden', background: 'var(--bg-overlay)',
          border: selected
            ? '3px solid var(--gold)'
            : hovered
              ? '3px solid rgba(212,168,67,0.4)'
              : '3px solid var(--border-subtle)',
          boxShadow: selected
            ? '0 0 22px rgba(212,168,67,0.45)'
            : hovered ? '0 6px 20px rgba(0,0,0,0.4)' : 'none',
          transition: 'border-color var(--t-base), box-shadow var(--t-base)',
          margin: '0 auto', maxWidth: 96,
        }}>
          {person.profilePath ? (
            <img src={`${TMDB_FACE}${person.profilePath}`} alt={person.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform var(--t-slow)', transform: hovered ? 'scale(1.08)' : 'scale(1)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,var(--bg-elevated),var(--bg-overlay))' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
          )}
        </div>

        {/* Selected badge */}
        {selected && (
          <div style={{
            position: 'absolute', bottom: 2, right: '50%', transform: 'translateX(50%)',
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--gradient-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px rgba(212,168,67,0.6)',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0d0a02" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Name */}
      <div style={{
        marginTop: 'var(--space-2)', fontWeight: 700, fontSize: '0.75rem',
        color: selected ? 'var(--gold)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
        lineHeight: 1.2, transition: 'color var(--t-fast)',
      }}>{person.name}</div>

      {person.knownFor && (
        <div style={{ fontSize: '0.6rem', color: 'var(--text-disabled)', marginTop: 2, lineHeight: 1.3 }}>
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
      title="Actors you enjoy watching"
      subtitle="These actors appear in movies from your languages — tap the ones you follow"
      onBack={() => navigate('/onboarding/movies')}
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={selCount > 0 ? `Continue with ${selCount} actor${selCount > 1 ? 's' : ''}` : 'Skip this step'}
    >
      {error && (
        <div className="info-banner info-banner--error" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          {error}
        </div>
      )}

      {selCount > 0 && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.15)', borderLeft: '3px solid var(--gold)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>
          {selCount} actor{selCount > 1 ? 's' : ''} selected
        </div>
      )}

      {isFetching && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 'var(--space-5)' }}>
          {[...Array(20)].map((_,i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: 60, height: 10, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {!isFetching && people.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-muted)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', margin: '0 auto var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No actor data yet</div>
          <div style={{ fontSize: '0.82rem' }}>Rate more movies in the previous step or the database may still be loading.</div>
        </div>
      )}

      {!isFetching && people.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 'var(--space-5)' }}>
          {people.map(p => (
            <PersonCard key={p.tmdbId} person={p} selected={selected.has(p.tmdbId)} onToggle={toggle} />
          ))}
        </div>
      )}
    </OnboardingLayout>
  );
}
