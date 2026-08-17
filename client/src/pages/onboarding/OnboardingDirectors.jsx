/**
 * OnboardingDirectors — Step 6 of 6
 *
 * Features & Fixes:
 *  1. State Persistence — `prefs` saved to `sessionStorage` (`ob_director_prefs`).
 *     Navigating Back / Next preserves all preferences and confidence scores.
 *  2. Unreviewed Filter in Tinder Deck (if used) & Grid mode sync.
 *  3. Progressive Reveal & Search to Add.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi, mediaApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const TMDB_FACE = 'https://image.tmdb.org/t/p/w185';
const INITIAL_N = 5;
const REVEAL_N  = 4;
const PREF      = { LOVE: 'love', LIKE: 'like', DISLIKE: 'dislike', NONE: null };

// ─────────────────────────────────────────────────────────────────
// Success Screen
// ─────────────────────────────────────────────────────────────────
function SuccessScreen() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-void)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 'var(--space-5)', padding: 'var(--space-8)', textAlign: 'center', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', left: '20%', width: '60%', height: '60%', background: 'radial-gradient(ellipse,rgba(212,168,67,0.18) 0%,transparent 65%)', filter: 'blur(80px)' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-6)', boxShadow: '0 0 40px rgba(212,168,67,0.5)', animation: 'glow-pulse 2s ease infinite' }}>
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
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Director card with Like / Dislike
// ─────────────────────────────────────────────────────────────────
function DirectorCard({ person, pref, onPref, isNew }) {
  const [hovered, setHovered] = useState(false);
  const liked    = pref === PREF.LIKE || pref === PREF.LOVE;
  const loved    = pref === PREF.LOVE;
  const disliked = pref === PREF.DISLIKE;

  return (
    <div style={{ position: 'relative', textAlign: 'center', animation: isNew ? 'slideUp 0.35s ease both' : 'none' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div
        onClick={() => onPref(person.tmdbId, liked ? PREF.NONE : PREF.LIKE)}
        style={{
          position: 'relative', width: '100%', aspectRatio: '1',
          maxWidth: 96, margin: '0 auto', borderRadius: '50%', overflow: 'hidden',
          background: 'var(--bg-overlay)', cursor: 'pointer',
          border: loved ? '3px solid #f472b6' : liked ? '3px solid var(--gold)' : disliked ? '3px solid rgba(239,68,68,0.4)' : hovered ? '3px solid rgba(212,168,67,0.35)' : '3px solid var(--border-subtle)',
          boxShadow: loved ? '0 0 22px rgba(244,114,182,0.55)' : liked ? '0 0 22px rgba(212,168,67,0.45)' : disliked ? '0 0 8px rgba(239,68,68,0.25)' : 'none',
          transition: 'border-color var(--t-base), box-shadow var(--t-base)',
          transform: liked ? 'scale(1.04)' : hovered ? 'scale(1.02)' : 'scale(1)',
        }}>
        {person.profilePath ? (
          <img src={`${TMDB_FACE}${person.profilePath}`} alt={person.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: disliked ? 'grayscale(80%) brightness(0.6)' : 'none', transition: 'filter 0.2s, transform var(--t-slow)', transform: hovered ? 'scale(1.07)' : 'scale(1)' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,var(--bg-elevated),var(--bg-overlay))' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
            </svg>
          </div>
        )}
        {isNew && (
          <div style={{ position: 'absolute', top: 4, right: 4, fontSize: '0.45rem', fontWeight: 900, padding: '1px 5px', borderRadius: 99, background: 'rgba(212,168,67,0.9)', color: '#0d0a02', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NEW</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6, opacity: hovered || liked || disliked ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: hovered || liked || disliked ? 'auto' : 'none' }}>
        <button type="button" title="Love"
          onClick={() => onPref(person.tmdbId, pref === PREF.LOVE ? PREF.LIKE : PREF.LOVE)}
          style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: loved ? '#ec4899' : 'rgba(255,255,255,0.07)', boxShadow: loved ? '0 0 8px rgba(236,72,153,0.6)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', transform: loved ? 'scale(1.15)' : 'scale(1)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill={loved ? '#fff' : 'rgba(236,72,153,0.8)'} stroke={loved ? 'none' : 'rgba(236,72,153,0.8)'} strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button type="button" title="Not for me"
          onClick={() => onPref(person.tmdbId, pref === PREF.DISLIKE ? PREF.NONE : PREF.DISLIKE)}
          style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: disliked ? '#ef4444' : 'rgba(255,255,255,0.07)', boxShadow: disliked ? '0 0 8px rgba(239,68,68,0.5)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', transform: disliked ? 'scale(1.15)' : 'scale(1)' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={disliked ? '#fff' : 'rgba(239,68,68,0.8)'} strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div style={{ marginTop: liked || disliked ? 2 : 6, fontWeight: 700, fontSize: '0.72rem', lineHeight: 1.2, color: loved ? '#f472b6' : liked ? 'var(--gold)' : disliked ? 'rgba(239,68,68,0.7)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color var(--t-fast)' }}>
        {person.name}
      </div>
      {person.knownFor && (
        <div style={{ fontSize: '0.58rem', color: 'var(--text-disabled)', marginTop: 2, lineHeight: 1.3 }}>{person.knownFor}</div>
      )}
      {(liked || disliked) && (
        <div style={{ fontSize: '0.55rem', marginTop: 2, fontWeight: 700, letterSpacing: '0.04em', color: loved ? '#f472b6' : liked ? 'rgba(212,168,67,0.7)' : 'rgba(239,68,68,0.6)' }}>
          {loved ? '❤ Love' : liked ? '✓ Liked' : '✗ Not for me'}
        </div>
      )}
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────────
function SearchBar({ onAdd, existingIds }) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const [added, setAdded]     = useState(null);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await mediaApi.searchPeople({ q: q.trim(), role: 'director', limit: 6 });
        const items = (res.data.people || []).filter(p => !existingIds.has(String(p.tmdbId)));
        setResults(items.slice(0, 5));
        setOpen(items.length > 0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 380);
  };

  const handleAdd = (item) => {
    onAdd(item);
    setAdded(item.tmdbId);
    setTimeout(() => setAdded(null), 1600);
    setQuery(''); setResults([]); setOpen(false);
  };

  return (
    <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '8px 12px' }}>
        {loading
          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}><circle cx="12" cy="12" r="9" strokeOpacity="0.25"/><path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round"/></svg>
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        }
        <input value={query} onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Don't see a director? Search here…"
          style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.82rem', width: '100%', fontFamily: 'var(--font-sans)' }} />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setResults([]); setOpen(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer', padding: '2px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 50, boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
          {results.map((item, i) => (
            <button key={item.tmdbId} type="button" onMouseDown={() => handleAdd(item)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', border: 'none', background: added === item.tmdbId ? 'rgba(212,168,67,0.12)' : 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = added === item.tmdbId ? 'rgba(212,168,67,0.12)' : 'transparent'}>
              {item.profilePath
                ? <img src={`${TMDB_FACE}${item.profilePath}`} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} />
                : <div style={{ width: 32, height: 32, background: 'var(--bg-overlay)', borderRadius: '50%', flexShrink: 0 }} />
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{item.name}</div>
                {item.knownFor && <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.knownFor}</div>}
              </div>
              {added === item.tmdbId
                ? <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>Added ✓</span>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              }
            </button>
          ))}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
export default function OnboardingDirectors() {
  const navigate      = useNavigate();
  const { updateUser } = useAuth();

  const [allPeople, setAllPeople]   = useState([]);
  const [visible, setVisible]       = useState([]);
  const [shownIds, setShownIds]     = useState(new Set());
  const [newIds, setNewIds]         = useState(new Set());

  // Restore prefs from sessionStorage so going back/forward preserves user picks!
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('ob_director_prefs') || '{}');
    } catch { return {}; }
  });

  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);

  // Save prefs to sessionStorage on every change
  useEffect(() => {
    sessionStorage.setItem('ob_director_prefs', JSON.stringify(prefs));
  }, [prefs]);

  // ── Load directors ────────────────────────────────────────────
  useEffect(() => {
    const mediaIds  = JSON.parse(sessionStorage.getItem('ob_watched_ids') || '[]').join(',');
    const languages = JSON.parse(sessionStorage.getItem('ob_languages')   || '[]').join(',');
    onboardingApi.getPeopleSuggestions({ mediaIds, languages, role: 'director', limit: 30 })
      .then(res => {
        const people = res.data.people || [];
        setAllPeople(people);

        const savedIds = new Set(Object.keys(prefs));
        const initial = people.filter(p => savedIds.has(String(p.tmdbId)));
        const remaining = people.filter(p => !savedIds.has(String(p.tmdbId)));
        const combined = [...initial, ...remaining.slice(0, Math.max(INITIAL_N, INITIAL_N - initial.length))];

        setVisible(combined);
        setShownIds(new Set(combined.map(p => String(p.tmdbId))));
      })
      .catch(() => setError('Could not load director suggestions.'))
      .finally(() => setIsFetching(false));
  }, []);

  // ── Progressive reveal ────────────────────────────────────────
  const revealMore = useCallback(() => {
    setShownIds(prevShown => {
      const picks = allPeople
        .filter(p => !prevShown.has(String(p.tmdbId)))
        .slice(0, REVEAL_N);
      if (picks.length === 0) return prevShown;
      const pickIds = new Set(picks.map(p => String(p.tmdbId)));
      setVisible(prev => [...prev, ...picks]);
      setNewIds(pickIds);
      setTimeout(() => setNewIds(new Set()), 2000);
      return new Set([...prevShown, ...pickIds]);
    });
  }, [allPeople]);

  // ── Preference setter ─────────────────────────────────────────
  const setPref = useCallback((tmdbId, pref) => {
    setPrefs(prev => {
      const wasPositive = prev[String(tmdbId)] === PREF.LIKE || prev[String(tmdbId)] === PREF.LOVE;
      if (!wasPositive && (pref === PREF.LIKE || pref === PREF.LOVE)) revealMore();
      return { ...prev, [String(tmdbId)]: pref };
    });
  }, [revealMore]);

  // ── Add from search ───────────────────────────────────────────
  const handleAddFromSearch = useCallback((item) => {
    const idStr = String(item.tmdbId);
    if (shownIds.has(idStr)) { setPref(idStr, PREF.LIKE); return; }
    setVisible(prev => [item, ...prev]);
    setShownIds(prev => new Set([...prev, idStr]));
    setNewIds(new Set([idStr]));
    setTimeout(() => setNewIds(new Set()), 2000);
    setPref(idStr, PREF.LIKE);
  }, [shownIds, setPref]);

  // ── Finish ────────────────────────────────────────────────────
  const handleFinish = async () => {
    setIsLoading(true); setError('');
    try {
      const directors = visible
        .filter(p => prefs[String(p.tmdbId)] && prefs[String(p.tmdbId)] !== PREF.NONE)
        .map(p => ({ tmdbId: p.tmdbId, name: p.name, preference: prefs[String(p.tmdbId)] }));
      const res = await onboardingApi.saveDirectors({ directors });
      if (res.data.user) updateUser(res.data.user);
      ['ob_languages','ob_genres','ob_watched_ids','ob_vibe_genres','ob_vibe_id','ob_conf_genres','ob_conf_movies','ob_movie_states','ob_actor_prefs','ob_director_prefs','ob_view_movies','ob_view_actors'].forEach(k => sessionStorage.removeItem(k));
      setSuccess(true);
      setTimeout(() => navigate('/home'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete onboarding.');
    } finally { setIsLoading(false); }
  };

  if (success) return <SuccessScreen />;

  const liked    = Object.values(prefs).filter(p => p === PREF.LIKE || p === PREF.LOVE).length;
  const disliked = Object.values(prefs).filter(p => p === PREF.DISLIKE).length;
  const baseConf   = Number(sessionStorage.getItem('ob_conf_actors') || 75);
  const dirAdd     = Math.min(25, liked * 4 + disliked * 1);
  const confidence = Math.min(100, baseConf + dirAdd);
  const existingIds = new Set(visible.map(p => String(p.tmdbId)));

  return (
    <OnboardingLayout
      step={6} totalSteps={6}
      title="Directors you admire"
      subtitle="The filmmakers behind your favourite movies — tap to like, ❤ to love, ✗ to skip. More will appear as you choose."
      onBack={() => navigate('/onboarding/actors')}
      onNext={handleFinish}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={liked > 0 ? `Finish setup (${liked} director${liked > 1 ? 's' : ''})` : 'Finish setup'}
      confidence={confidence}
    >
      {error && (
        <div className="info-banner info-banner--error" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          {error}
        </div>
      )}

      {/* Taste profile summary */}
      <div style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.14)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10 }}>Your taste profile so far</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {['Languages picked','Vibe chosen','Genres set','Films rated','Actors selected','Directors — this step'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: i < 5 ? 'var(--text-secondary)' : 'var(--gold)', fontWeight: i === 5 ? 700 : 400 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: i < 5 ? 'var(--gradient-gold)' : 'rgba(212,168,67,0.2)', border: i === 5 ? '1px solid var(--gold)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i < 5 ? (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#0d0a02" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)' }} />
                )}
              </div>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {liked > 0 ? (
            <span>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{liked}</span> liked
              {disliked > 0 && <span> · <span style={{ color: 'rgba(239,68,68,0.7)', fontWeight: 700 }}>{disliked}</span> passed</span>}
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(212,168,67,0.5)', display: 'inline-block', animation: 'pulse 1.5s ease infinite' }} />
              Showing {visible.length} of {allPeople.length}
            </span>
          )}
        </div>
      </div>

      {/* Search */}
      <SearchBar onAdd={handleAddFromSearch} existingIds={existingIds} />

      {/* Hint */}
      {liked === 0 && visible.length <= INITIAL_N && (
        <div className="info-banner" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          Tap a portrait to like · ❤ to love · ✗ to pass — more directors appear as you choose
        </div>
      )}

      {/* Skeleton */}
      {isFetching && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 'var(--space-5)' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div className="skeleton" style={{ width: 80, height: 80, borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: 60, height: 10, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {!isFetching && visible.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 'var(--space-5)' }}>
          {visible.map(p => (
            <DirectorCard key={p.tmdbId} person={p} pref={prefs[String(p.tmdbId)] || PREF.NONE} onPref={setPref} isNew={newIds.has(String(p.tmdbId))} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isFetching && visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-muted)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', margin: '0 auto var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No directors extracted yet</div>
          <div style={{ fontSize: '0.82rem' }}>Try going back and rating more movies, or search above.</div>
        </div>
      )}
    </OnboardingLayout>
  );
}
