import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaApi, onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

/**
 * OnboardingActors — Step 4
 *
 * User searches for actors/actresses they like.
 * Each added actor gets a preference level: love / like / neutral
 *
 * Data sent: [{ tmdbId, name, preference }]
 */

const TMDB_IMG_FACE = 'https://image.tmdb.org/t/p/w92';

const PREF_OPTIONS = [
  { value: 'love',    label: 'Love',    icon: '❤️',  color: '#F5C842' },
  { value: 'like',    label: 'Like',    icon: '👍',  color: 'var(--gold)' },
  { value: 'neutral', label: 'Neutral', icon: '😐',  color: 'var(--text-muted)' },
];

function ActorCard({ actor, onRemove, onChangePref }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.14)',
      borderRadius: 'var(--radius-md)', padding: 'var(--space-3)',
      transition: 'all 0.2s',
    }}>
      {/* Photo */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
        background: 'var(--bg-overlay)', flexShrink: 0,
        border: '2px solid var(--border-subtle)',
      }}>
        {actor.profilePath ? (
          <img
            src={`${TMDB_IMG_FACE}${actor.profilePath}`}
            alt={actor.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            🎭
          </div>
        )}
      </div>

      {/* Name + known for */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {actor.name}
        </div>
        {actor.knownFor && (
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Known for: {actor.knownFor}
          </div>
        )}
      </div>

      {/* Preference selector */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {PREF_OPTIONS.map(p => (
          <button
            key={p.value}
            type="button"
            title={p.label}
            onClick={() => onChangePref(actor.tmdbId, p.value)}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              border: actor.preference === p.value
                ? `2px solid ${p.color}`
                : '2px solid var(--border-subtle)',
              background: actor.preference === p.value
                ? `${p.color}18`
                : 'var(--bg-overlay)',
              cursor: 'pointer', fontSize: '0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              boxShadow: actor.preference === p.value ? `0 0 8px ${p.color}40` : 'none',
            }}
          >
            {p.icon}
          </button>
        ))}
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(actor.tmdbId)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-disabled)', fontSize: '0.95rem',
          padding: 4, borderRadius: 4, flexShrink: 0, transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#FCA5A5'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}
      >
        ✕
      </button>
    </div>
  );
}

export default function OnboardingActors() {
  const navigate = useNavigate();

  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actors, setActors]   = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]     = useState('');

  const debounceRef = useRef(null);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Search cast/crew via media search — we'll extract cast from results
        const res = await mediaApi.searchPeople({ q, limit: 10 });
        setResults(res.data.people || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 380);
  }, []);

  const addActor = (person) => {
    if (actors.find(a => a.tmdbId === person.tmdbId)) return;
    setActors(prev => [...prev, { ...person, preference: 'like' }]);
    setQuery('');
    setResults([]);
  };

  const removeActor = (tmdbId) => setActors(prev => prev.filter(a => a.tmdbId !== tmdbId));
  const changePref  = (tmdbId, pref) => setActors(prev => prev.map(a => a.tmdbId === tmdbId ? { ...a, preference: pref } : a));

  const handleNext = async () => {
    setIsLoading(true);
    setError('');
    try {
      const payload = actors.map(a => ({
        tmdbId: a.tmdbId,
        name: a.name,
        preference: a.preference,
      }));
      await onboardingApi.saveActors({ actors: payload });
      navigate('/onboarding/directors');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save actor preferences.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout
      step={4} totalSteps={5}
      title="Favourite actors &amp; actresses?"
      subtitle="Search for performers whose work you love — your recommendations will feature more of them"
      onBack={() => navigate('/onboarding/genres')}
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={actors.length > 0 ? `Continue with ${actors.length} actor${actors.length > 1 ? 's' : ''} →` : 'Skip this step →'}
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

      {/* ── Search box ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-5)' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 'var(--space-4)', top: '50%', transform: 'translateY(-50%)',
            fontSize: '1rem', pointerEvents: 'none', color: 'var(--text-muted)',
          }}>🎭</span>
          <input
            id="actor-search"
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search actors, actresses, performers..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--bg-card)', border: '2px solid var(--border-default)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4) var(--space-3) 2.8rem',
              color: 'var(--text-primary)', fontSize: '0.95rem',
              outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.boxShadow = 'none'; }}
            autoComplete="off"
          />
          {isSearching && (
            <div style={{ position: 'absolute', right: 'var(--space-4)', top: '50%', transform: 'translateY(-50%)' }}>
              <div style={{
                width: 16, height: 16, border: '2px solid var(--border-default)',
                borderTopColor: 'var(--gold)', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
            </div>
          )}
        </div>

        {/* ── Results dropdown ─────────────────────────────────── */}
        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}>
            {results.map(person => {
              const already = actors.find(a => a.tmdbId === person.tmdbId);
              return (
                <button
                  key={person.tmdbId}
                  type="button"
                  onClick={() => !already && addActor(person)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-3)', background: 'none',
                    border: 'none', borderBottom: '1px solid var(--border-subtle)',
                    cursor: already ? 'not-allowed' : 'pointer',
                    textAlign: 'left', transition: 'background 0.15s',
                    opacity: already ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!already) e.currentTarget.style.background = 'var(--bg-overlay)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                    background: 'var(--bg-overlay)', flexShrink: 0,
                    border: '1px solid var(--border-subtle)',
                  }}>
                    {person.profilePath ? (
                      <img src={`${TMDB_IMG_FACE}${person.profilePath}`} alt={person.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎭</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{person.name}</div>
                    {person.knownFor && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {person.knownFor}
                      </div>
                    )}
                  </div>
                  {already
                    ? <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700 }}>Added ✓</span>
                    : <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>+</span>
                  }
                </button>
              );
            })}
          </div>
        )}

        {/* No results hint */}
        {query.trim() && !isSearching && results.length === 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
            textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            No actors found for "{query}" — try a different spelling
          </div>
        )}
      </div>

      {/* ── Empty state ───────────────────────────────────────── */}
      {actors.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 'var(--space-10) var(--space-6)',
          background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🎭</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Search for your favourite performers</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto' }}>
            Try names like "Rajinikanth", "Deepika Padukone", or "Keanu Reeves" — this step is optional.
          </div>
        </div>
      )}

      {/* ── Actor list ────────────────────────────────────────── */}
      {actors.length > 0 && (
        <div>
          <div style={{
            fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--gold)',
            marginBottom: 'var(--space-3)',
          }}>
            {actors.length} actor{actors.length > 1 ? 's' : ''} added
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {actors.map(actor => (
              <ActorCard
                key={actor.tmdbId}
                actor={actor}
                onRemove={removeActor}
                onChangePref={changePref}
              />
            ))}
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
