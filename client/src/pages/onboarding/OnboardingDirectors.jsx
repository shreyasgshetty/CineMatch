import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const TMDB_FACE = 'https://image.tmdb.org/t/p/w185';

function DirectorCard({ person, selected, onToggle }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      id={`director-${person.tmdbId}`}
      type="button"
      onClick={() => onToggle(person.tmdbId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'center', width: '100%' }}
    >
      <div style={{ position: 'relative', transition: 'transform var(--t-base)', transform: selected ? 'scale(1.06)' : hovered ? 'scale(1.03)' : 'scale(1)' }}>
        <div style={{
          width: '100%', aspectRatio: '1', borderRadius: '50%', overflow: 'hidden',
          background: 'var(--bg-overlay)', maxWidth: 96, margin: '0 auto',
          border: selected
            ? '3px solid var(--gold)'
            : hovered ? '3px solid rgba(212,168,67,0.4)' : '3px solid var(--border-subtle)',
          boxShadow: selected ? '0 0 22px rgba(212,168,67,0.45)' : hovered ? 'var(--shadow-md)' : 'none',
          transition: 'border-color var(--t-base), box-shadow var(--t-base)',
        }}>
          {person.profilePath ? (
            <img src={`${TMDB_FACE}${person.profilePath}`} alt={person.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform var(--t-slow)', transform: hovered ? 'scale(1.08)' : 'scale(1)' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,var(--bg-elevated),var(--bg-overlay))' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
              </svg>
            </div>
          )}
        </div>

        {/* Director badge */}
        {selected && (
          <div style={{
            position: 'absolute', bottom: 2, right: '50%', transform: 'translateX(50%)',
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--gradient-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 10px rgba(212,168,67,0.6)',
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0d0a02" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        )}
      </div>

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

/* ── Success Screen ─────────────────────────────────────────── */
function SuccessScreen() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 'var(--space-5)', padding: 'var(--space-8)', textAlign: 'center', position: 'relative' }}>
      {/* Ambient glow */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '20%', width: '60%', height: '60%', background: 'radial-gradient(ellipse,rgba(212,168,67,0.18) 0%,transparent 65%)', filter: 'blur(80px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
        {/* Icon ring */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--gradient-gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-6)',
          boxShadow: '0 0 40px rgba(212,168,67,0.5)',
          animation: 'glow-pulse 2s ease infinite',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0d0a02" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1.8rem,5vw,2.8rem)', color: 'var(--gold)', marginBottom: 'var(--space-3)' }}>
          Your CineMatch is ready!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7 }}>
          Taking you to your personalised recommendations
        </p>

        <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[...Array(5)].map((_,i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingDirectors() {
  const navigate     = useNavigate();
  const { updateUser } = useAuth();

  const [people, setPeople]         = useState([]);
  const [selected, setSelected]     = useState(new Set());
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    const mediaIds  = JSON.parse(sessionStorage.getItem('ob_watched_ids') || '[]').join(',');
    const languages = JSON.parse(sessionStorage.getItem('ob_languages') || '[]').join(',');
    onboardingApi.getPeopleSuggestions({ mediaIds, languages, role: 'director', limit: 30 })
      .then(res => setPeople(res.data.people || []))
      .catch(() => setError('Could not load director suggestions.'))
      .finally(() => setIsFetching(false));
  }, []);

  const toggle = (tmdbId) => setSelected(prev => {
    const next = new Set(prev);
    next.has(tmdbId) ? next.delete(tmdbId) : next.add(tmdbId);
    return next;
  });

  const handleFinish = async () => {
    setIsLoading(true);
    setError('');
    try {
      const directors = people
        .filter(p => selected.has(p.tmdbId))
        .map(p => ({ tmdbId: p.tmdbId, name: p.name, preference: 'like' }));
      const res = await onboardingApi.saveDirectors({ directors });
      if (res.data.user) updateUser(res.data.user);
      ['ob_languages','ob_genres','ob_watched_ids'].forEach(k => sessionStorage.removeItem(k));
      setSuccess(true);
      setTimeout(() => navigate('/home'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete onboarding.');
    } finally { setIsLoading(false); }
  };

  if (success) return <SuccessScreen />;

  const selCount = selected.size;

  return (
    <OnboardingLayout
      step={5} totalSteps={5}
      title="Directors you admire"
      subtitle="These filmmakers shaped the movies you've watched — select whose vision resonates with you"
      onBack={() => navigate('/onboarding/actors')}
      onNext={handleFinish}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={selCount > 0 ? `Finish setup (${selCount} director${selCount > 1 ? 's' : ''})` : 'Finish setup'}
    >
      {error && (
        <div className="info-banner info-banner--error" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          {error}
        </div>
      )}

      {/* Profile summary */}
      <div style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.14)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Your taste profile</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {['Languages picked','Genres set','Films rated','Actors selected','Directors — this step'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: i < 4 ? 'var(--text-secondary)' : 'var(--gold)', fontWeight: i === 4 ? 700 : 400 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: i < 4 ? 'var(--gradient-gold)' : 'rgba(212,168,67,0.2)', border: i === 4 ? '1px solid var(--gold)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i < 4 ? (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#0d0a02" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)' }} />
                )}
              </div>
              {label}
            </div>
          ))}
        </div>
      </div>

      {selCount > 0 && (
        <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.15)', borderLeft: '3px solid var(--gold)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>
          {selCount} director{selCount > 1 ? 's' : ''} selected
        </div>
      )}

      {isFetching && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 'var(--space-5)' }}>
          {[...Array(12)].map((_,i) => (
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
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
            </svg>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No directors extracted yet</div>
          <div style={{ fontSize: '0.82rem' }}>Try going back and marking more movies as seen. You can also skip this step.</div>
        </div>
      )}

      {!isFetching && people.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 'var(--space-5)' }}>
          {people.map(p => (
            <DirectorCard key={p.tmdbId} person={p} selected={selected.has(p.tmdbId)} onToggle={toggle} />
          ))}
        </div>
      )}
    </OnboardingLayout>
  );
}
