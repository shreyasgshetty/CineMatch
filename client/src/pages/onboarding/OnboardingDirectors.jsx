import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaApi, onboardingApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

/**
 * OnboardingDirectors — Step 5 (Final)
 *
 * Identical to Actors in UX but for directors.
 * On submit, calls /api/onboarding/directors which also marks onboarding complete.
 * Then refreshes the user in AuthContext and redirects to /home.
 */

const TMDB_IMG_FACE = 'https://image.tmdb.org/t/p/w92';

const PREF_OPTIONS = [
  { value: 'love',    label: 'Love',    icon: '❤️',  color: '#F5C842' },
  { value: 'like',    label: 'Like',    icon: '👍',  color: 'var(--gold)' },
  { value: 'neutral', label: 'Neutral', icon: '😐',  color: 'var(--text-muted)' },
];

function DirectorCard({ director, onRemove, onChangePref }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.14)',
      borderRadius: 'var(--radius-md)', padding: 'var(--space-3)',
    }}>
      {/* Photo */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
        background: 'var(--bg-overlay)', flexShrink: 0,
        border: '2px solid var(--border-subtle)',
      }}>
        {director.profilePath ? (
          <img
            src={`${TMDB_IMG_FACE}${director.profilePath}`}
            alt={director.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            🎬
          </div>
        )}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {director.name}
        </div>
        {director.knownFor && (
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {director.knownFor}
          </div>
        )}
      </div>

      {/* Preference buttons */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {PREF_OPTIONS.map(p => (
          <button
            key={p.value}
            type="button"
            title={p.label}
            onClick={() => onChangePref(director.tmdbId, p.value)}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              border: director.preference === p.value
                ? `2px solid ${p.color}`
                : '2px solid var(--border-subtle)',
              background: director.preference === p.value
                ? `${p.color}18`
                : 'var(--bg-overlay)',
              cursor: 'pointer', fontSize: '0.75rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              boxShadow: director.preference === p.value ? `0 0 8px ${p.color}40` : 'none',
            }}
          >
            {p.icon}
          </button>
        ))}
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(director.tmdbId)}
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

export default function OnboardingDirectors() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [directors, setDirectors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  const debounceRef = useRef(null);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await mediaApi.searchPeople({ q, limit: 10, role: 'director' });
        setResults(res.data.people || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 380);
  }, []);

  const addDirector = (person) => {
    if (directors.find(d => d.tmdbId === person.tmdbId)) return;
    setDirectors(prev => [...prev, { ...person, preference: 'like' }]);
    setQuery('');
    setResults([]);
  };

  const removeDirector = (tmdbId) => setDirectors(prev => prev.filter(d => d.tmdbId !== tmdbId));
  const changePref     = (tmdbId, pref) => setDirectors(prev => prev.map(d => d.tmdbId === tmdbId ? { ...d, preference: pref } : d));

  const handleFinish = async () => {
    setIsLoading(true);
    setError('');
    try {
      const payload = directors.map(d => ({
        tmdbId: d.tmdbId,
        name: d.name,
        preference: d.preference,
      }));
      const res = await onboardingApi.saveDirectors({ directors: payload });

      // Update AuthContext so App.jsx knows onboarding is done
      if (res.data.user) {
        updateUser(res.data.user);
      }

      setSuccess(true);
      setTimeout(() => navigate('/home'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg-void)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-8)',
        textAlign: 'center',
      }}>
        {/* Ambient glows */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '20%', left: '20%', width: '60%', height: '60%', background: 'radial-gradient(ellipse, rgba(201,168,76,0.2) 0%, transparent 65%)', filter: 'blur(80px)' }} />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)', animation: 'fadeIn 0.6s ease-out' }}>🎬</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', color: 'var(--gold)', marginBottom: 'var(--space-3)' }}>
            You're all set!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 400, margin: '0 auto' }}>
            Your personal taste profile is ready. Taking you to your recommendations…
          </p>
          <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 8, justifyContent: 'center' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--gold)', opacity: 0.2 + i * 0.2,
                animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <OnboardingLayout
      step={5} totalSteps={5}
      title="Favourite directors?"
      subtitle="Last step — tell us which filmmakers you admire and we'll prioritise their work in your feed"
      onBack={() => navigate('/onboarding/actors')}
      onNext={handleFinish}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={directors.length > 0
        ? `🎬 Complete setup (${directors.length} director${directors.length > 1 ? 's' : ''})`
        : '🎬 Complete setup'}
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

      {/* ── Onboarding summary ────────────────────────────────── */}
      <div style={{
        background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-4) var(--space-5)',
        marginBottom: 'var(--space-6)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>
          🎯 Your profile so far
        </div>
        {[
          { icon: '🌐', label: 'Languages selected' },
          { icon: '⭐', label: 'Films rated' },
          { icon: '🎭', label: 'Genre preferences set' },
          { icon: '👤', label: 'Actors added' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>✓</span>
            <span>{item.icon} {item.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600, marginTop: 2 }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--gold)', display: 'inline-block', boxShadow: '0 0 8px rgba(201,168,76,0.4)' }} />
          <span>🎬 Directors — this step</span>
        </div>
      </div>

      {/* ── Search box ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-5)' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 'var(--space-4)', top: '50%', transform: 'translateY(-50%)',
            fontSize: '1rem', pointerEvents: 'none', color: 'var(--text-muted)',
          }}>🎬</span>
          <input
            id="director-search"
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search directors, filmmakers..."
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

        {/* Dropdown */}
        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}>
            {results.map(person => {
              const already = directors.find(d => d.tmdbId === person.tmdbId);
              return (
                <button
                  key={person.tmdbId}
                  type="button"
                  onClick={() => !already && addDirector(person)}
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
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🎬</div>
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

        {query.trim() && !isSearching && results.length === 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
            textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            No directors found for "{query}" — try a different name
          </div>
        )}
      </div>

      {/* ── Empty state ───────────────────────────────────────── */}
      {directors.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 'var(--space-8) var(--space-6)',
          background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🎬</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Search for your favourite filmmakers</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto' }}>
            Try "SS Rajamouli", "Christopher Nolan", "Mani Ratnam" — or skip this step entirely.
          </div>
        </div>
      )}

      {/* ── Director list ─────────────────────────────────────── */}
      {directors.length > 0 && (
        <div>
          <div style={{
            fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: 'var(--gold)',
            marginBottom: 'var(--space-3)',
          }}>
            {directors.length} director{directors.length > 1 ? 's' : ''} added
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {directors.map(d => (
              <DirectorCard
                key={d.tmdbId}
                director={d}
                onRemove={removeDirector}
                onChangePref={changePref}
              />
            ))}
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
