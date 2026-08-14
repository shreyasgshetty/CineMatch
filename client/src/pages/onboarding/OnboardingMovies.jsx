/**
 * OnboardingMovies — Step 4 of 6
 *
 * Features:
 *  1. Progressive Reveal — starts with 5 movies; each selection reveals
 *     3-4 similar items from the pre-fetched pool (matching genres/language),
 *     animating in with a slide-up effect.
 *  2. Grid / Tinder toggle — both modes share state.
 *  3. Search to Add — debounced search bar; results appear as dropdown,
 *     clicking a result adds it to visible pool and selects it.
 *  4. Taste Confidence Meter — passed as `confidence` to layout.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi, mediaApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import SwipeCard from '../../components/onboarding/SwipeCard';

const TMDB_IMG    = 'https://image.tmdb.org/t/p/w342';
const CARD_W      = 280;
const CARD_H      = 420;
const INITIAL_N   = 5;   // items shown at start
const REVEAL_N    = 4;   // items revealed on each selection

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Return up to `n` items from `pool` that share genres or language with `seed` */
function findSimilar(pool, seen, seed, n) {
  if (!seed) return pool.slice(0, n);
  const { genres = [], originalLanguage } = seed;
  return pool
    .filter(m => !seen.has(String(m._id)))
    .map(m => {
      let score = 0;
      if (m.originalLanguage === originalLanguage) score += 2;
      genres.forEach(g => { if ((m.genres || []).includes(g)) score += 1; });
      return { m, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(x => x.m);
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

function StarRow({ value, onChange, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const fs = size === 'lg' ? '1.7rem' : '1rem';
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button"
          onClick={e => { e.stopPropagation(); onChange(s); }}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
            fontSize: fs,
            color: s <= (hovered || value) ? (hovered ? '#F5C842' : 'var(--gold)') : 'rgba(255,255,255,0.25)',
            transition: 'all 0.12s',
            transform: s <= (hovered || value) ? 'scale(1.25)' : 'scale(1)',
          }}
        >
          {s <= (hovered || value) ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

// ── Grid poster card ──────────────────────────────────────────────
function MovieCard({ item, state, onToggleSeen, onRate, isNew }) {
  const isSeen = state?.seen;
  const rating = state?.rating || 0;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        aspectRatio: '2/3', background: 'var(--bg-card)', cursor: 'pointer',
        transition: 'transform var(--t-base), box-shadow var(--t-base)',
        transform: hovered ? 'translateY(-3px) scale(1.02)' : 'none',
        boxShadow: isSeen
          ? '0 0 0 2px var(--gold), 0 8px 24px rgba(212,168,67,0.25)'
          : hovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        outline: isSeen ? '2px solid var(--gold)' : 'none',
        animation: isNew ? 'slideUp 0.35s ease both' : 'none',
      }}
      onClick={() => onToggleSeen(item._id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {item.posterPath ? (
        <img src={`${TMDB_IMG}${item.posterPath}`} alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            transition: 'transform var(--t-slow)', transform: hovered ? 'scale(1.05)' : 'scale(1)' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg,var(--bg-elevated),var(--bg-overlay))',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.8rem', opacity: 0.3, color: 'var(--text-muted)', fontStyle: 'italic' }}>No Image</span>
        </div>
      )}

      {/* "NEW" badge for progressively revealed items */}
      {isNew && (
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 5,
          fontSize: '0.5rem', fontWeight: 900, letterSpacing: '0.1em',
          padding: '2px 7px', borderRadius: 99,
          background: 'rgba(212,168,67,0.9)', color: '#0d0a02',
          textTransform: 'uppercase',
        }}>NEW</div>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top,rgba(0,0,0,0.97) 0%,rgba(0,0,0,0.5) 55%,transparent 100%)',
        padding: '10px 8px 8px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#fff', lineHeight: 1.2,
          marginBottom: 2, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{item.title}</div>
        <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.5)' }}>
          {item.releaseYear} · {item.type === 'tv' ? 'Series' : 'Film'}
        </div>
        {isSeen && (
          <div style={{ marginTop: 5 }} onClick={e => e.stopPropagation()}>
            <StarRow value={rating} onChange={r => onRate(item._id, r)} />
            {rating === 0 && (
              <div style={{ fontSize: '0.55rem', color: 'rgba(212,168,67,0.65)',
                textAlign: 'center', marginTop: 2 }}>tap to rate</div>
            )}
          </div>
        )}
      </div>

      {!isSeen && hovered && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(212,168,67,0.6)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d0a02"
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
      )}
      {isSeen && (
        <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22,
          borderRadius: '50%', background: 'var(--gradient-gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 10px rgba(212,168,67,0.6)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0d0a02"
            strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
    </div>
  );
}

// ── Tinder full-poster card ───────────────────────────────────────
function TinderMovieCard({ movie }) {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      background: 'var(--bg-card)',
      boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
    }}>
      {movie.posterPath ? (
        <img src={`${TMDB_IMG}${movie.posterPath}`} alt={movie.title} draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg,var(--bg-elevated),var(--bg-overlay))',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No Image</span>
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top,rgba(0,0,0,0.98) 0%,rgba(0,0,0,0.6) 45%,transparent 100%)',
        padding: '56px 16px 18px' }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', lineHeight: 1.2, marginBottom: 5 }}>{movie.title}</div>
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>
          {movie.releaseYear}{movie.type === 'tv' ? ' · Series' : ' · Film'}
          {movie.rating > 0 ? ` · ★ ${movie.rating.toFixed(1)}` : ''}
        </div>
        {movie.genres && movie.genres.length > 0 && (
          <div style={{ marginTop: 7, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {movie.genres.slice(0, 3).map(g => (
              <span key={g} style={{ fontSize: '0.58rem', padding: '2px 8px', background: 'rgba(255,255,255,0.12)',
                borderRadius: 99, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{g}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Grid / Cards toggle ───────────────────────────────────────────
function ViewToggle({ mode, onChange }) {
  const options = [
    { id: 'grid', label: 'Grid', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: 'tinder', label: 'Cards', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="14" height="18" rx="2"/><rect x="7" y="6" width="14" height="18" rx="2" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5"/></svg> },
  ];
  return (
    <div style={{ display: 'inline-flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 3, gap: 2 }}>
      {options.map(({ id, label, icon }) => (
        <button key={id} type="button" onClick={() => onChange(id)} style={{
          padding: '5px 11px', borderRadius: 6, border: 'none',
          background: mode === id ? 'var(--gold)' : 'transparent',
          color: mode === id ? '#0d0a02' : 'var(--text-muted)',
          cursor: 'pointer', transition: 'all 0.18s', fontSize: '0.7rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>{icon}{label}</button>
      ))}
    </div>
  );
}

// ── Tinder action button ──────────────────────────────────────────
function TinderBtn({ onClick, color, glowColor, label, icon, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      onMouseEnter={() => !disabled && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 60, height: 60, borderRadius: '50%', background: 'var(--bg-elevated)',
        border: `2px solid ${color}`, color, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        boxShadow: hov ? `0 0 26px ${glowColor}` : `0 0 12px ${glowColor}88`,
        transform: hov && !disabled ? 'scale(1.12)' : 'scale(1)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        opacity: disabled ? 0.35 : 1,
      }}>
      {icon}
      <span style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
    </button>
  );
}

// ── Search bar + dropdown ─────────────────────────────────────────
function SearchBar({ onAdd, existingIds }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [added, setAdded]       = useState(null);
  const debounceRef = useRef(null);
  const inputRef    = useRef(null);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await mediaApi.search({ q: q.trim(), limit: 6 });
        const items = (res.data.media || res.data.results || [])
          .filter(m => !existingIds.has(String(m._id)));
        setResults(items.slice(0, 5));
        setOpen(items.length > 0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 380);
  };

  const handleAdd = (item) => {
    onAdd(item);
    setAdded(item._id);
    setTimeout(() => setAdded(null), 1600);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative', marginBottom: 'var(--space-4)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        transition: 'border-color 0.15s',
      }}>
        {loading ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"
            style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="9" strokeOpacity="0.25"/>
            <path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Don't see your favourite? Search movies…"
          style={{
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontSize: '0.82rem',
            width: '100%', fontFamily: 'var(--font-sans)',
          }}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer', padding: '2px', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 50,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
          animation: 'fadeIn 0.15s ease',
        }}>
          {results.map((item, i) => (
            <button
              key={item._id}
              type="button"
              onMouseDown={() => handleAdd(item)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '9px 12px', border: 'none',
                background: added === item._id ? 'rgba(212,168,67,0.12)' : 'transparent',
                cursor: 'pointer', textAlign: 'left',
                borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = added === item._id ? 'rgba(212,168,67,0.12)' : 'transparent'}
            >
              {item.posterPath ? (
                <img src={`${TMDB_IMG}${item.posterPath}`} alt="" style={{ width: 28, height: 42, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 28, height: 42, background: 'var(--bg-overlay)', borderRadius: 4, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{item.releaseYear} · {item.type === 'tv' ? 'Series' : 'Film'}</div>
              </div>
              {added === item._id ? (
                <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>Added ✓</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
export default function OnboardingMovies() {
  const navigate = useNavigate();

  // All fetched movies (pool + visible)
  const [allMovies, setAllMovies]     = useState([]);
  // What's currently visible in the grid / tinder deck
  const [visible, setVisible]         = useState([]);
  // IDs that have been shown (so we don't re-reveal)
  const [shownIds, setShownIds]       = useState(new Set());
  // Track which IDs are newly revealed (for animation)
  const [newIds, setNewIds]           = useState(new Set());

  const [states, setStates]         = useState({});   // { [id]: { seen, rating } }
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');

  // Tinder state
  const [viewMode, setViewMode]         = useState(() => sessionStorage.getItem('ob_view_movies') || 'grid');
  const [tinderIdx, setTinderIdx]       = useState(0);
  const [ratingPending, setRatingPending] = useState(null);

  // ── Load movies ───────────────────────────────────────────────
  useEffect(() => {
    const languages = JSON.parse(sessionStorage.getItem('ob_languages') || '[]').join(',');
    const genres    = JSON.parse(sessionStorage.getItem('ob_genres')    || '[]').join(',');
    onboardingApi.getMovieSuggestions({ languages, genres, limit: 36 })
      .then(res => {
        const movies = res.data.media || [];
        setAllMovies(movies);
        const initial = movies.slice(0, INITIAL_N);
        setVisible(initial);
        setShownIds(new Set(initial.map(m => String(m._id))));
      })
      .catch(() => setError('Could not load suggestions. Check your connection.'))
      .finally(() => setIsFetching(false));
  }, []);

  // ── Progressive reveal ────────────────────────────────────────
  const lastRevealRef = useRef(0);

  const revealMore = useCallback((triggerMovie) => {
    const now = Date.now();
    if (now - lastRevealRef.current < 300) return; // debounce rapid clicks
    lastRevealRef.current = now;

    setShownIds(prevShown => {
      const pool = allMovies.filter(m => !prevShown.has(String(m._id)));
      if (pool.length === 0) return prevShown;
      const picks = findSimilar(pool, prevShown, triggerMovie, REVEAL_N);
      if (picks.length === 0) return prevShown;

      const pickIds = new Set(picks.map(m => String(m._id)));
      setVisible(prev => [...prev, ...picks]);
      setNewIds(pickIds);
      setTimeout(() => setNewIds(new Set()), 2000); // clear "new" badge after 2s

      return new Set([...prevShown, ...pickIds]);
    });
  }, [allMovies]);

  // ── Grid handlers ─────────────────────────────────────────────
  const toggleSeen = useCallback((id) => {
    setStates(prev => {
      const wasSeen = prev[id]?.seen;
      if (!wasSeen) {
        // Just selected — reveal more similar movies
        const movie = visible.find(m => String(m._id) === String(id));
        revealMore(movie);
      }
      return { ...prev, [id]: { seen: !wasSeen, rating: prev[id]?.rating || 0 } };
    });
  }, [visible, revealMore]);

  const setRating = (id, r) =>
    setStates(prev => ({ ...prev, [id]: { ...prev[id], rating: r } }));

  // ── Add from search ───────────────────────────────────────────
  const handleAddFromSearch = useCallback((item) => {
    const idStr = String(item._id);
    if (shownIds.has(idStr)) {
      // Already visible — just select it
      setStates(prev => ({ ...prev, [idStr]: { seen: true, rating: prev[idStr]?.rating || 0 } }));
      return;
    }
    setVisible(prev => [item, ...prev]);
    setShownIds(prev => new Set([...prev, idStr]));
    setNewIds(new Set([idStr]));
    setTimeout(() => setNewIds(new Set()), 2000);
    // Auto-select it
    setStates(prev => ({ ...prev, [idStr]: { seen: true, rating: 0 } }));
    revealMore(item);
  }, [shownIds, revealMore]);

  // ── Tinder handlers ───────────────────────────────────────────
  const tinderRight = useCallback((movie) => {
    setStates(prev => ({ ...prev, [movie._id]: { seen: true, rating: prev[movie._id]?.rating || 0 } }));
    setRatingPending({ id: movie._id, title: movie.title });
    setTinderIdx(i => i + 1);
    revealMore(movie);
  }, [revealMore]);

  const tinderLeft = useCallback(() => {
    setRatingPending(null);
    setTinderIdx(i => i + 1);
  }, []);

  const tinderRate = useCallback((id, r) => {
    setStates(prev => ({ ...prev, [id]: { ...prev[id], rating: r } }));
    setRatingPending(null);
  }, []);

  // ── View toggle ───────────────────────────────────────────────
  const handleViewChange = (mode) => {
    setViewMode(mode);
    sessionStorage.setItem('ob_view_movies', mode);
    if (mode === 'tinder') setTinderIdx(0);
  };

  // ── Confidence score ──────────────────────────────────────────
  const seenItems  = Object.entries(states).filter(([, s]) => s.seen);
  const ratedCount = seenItems.filter(([, s]) => s.rating > 0).length;
  const seenCount  = seenItems.length;
  // genres + languages already added up to ~35%; now movies add up to 30%
  const baseConf   = Number(sessionStorage.getItem('ob_conf_genres') || 0);
  const movieConf  = Math.min(30, seenCount * 4 + ratedCount * 2);
  const confidence = Math.min(65, baseConf + movieConf);

  // Persist for subsequent steps
  if (!isFetching) sessionStorage.setItem('ob_conf_movies', String(movieConf));

  // ── Continue ──────────────────────────────────────────────────
  const handleNext = async () => {
    setIsLoading(true);
    setError('');
    try {
      const ratings = seenItems.map(([id, s]) => ({
        mediaId: id,
        ...(s.rating > 0 ? { rating: s.rating } : { action: 'watched' }),
      }));
      await onboardingApi.saveRatings({ ratings });
      sessionStorage.setItem('ob_watched_ids', JSON.stringify(seenItems.map(([id]) => id)));
      navigate('/onboarding/actors');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save. Try again.');
    } finally { setIsLoading(false); }
  };

  // ── Tinder deck refs ──────────────────────────────────────────
  const card0    = visible[tinderIdx];
  const card1    = visible[tinderIdx + 1];
  const card2    = visible[tinderIdx + 2];
  const tinderDone = !isFetching && tinderIdx >= visible.length;

  const existingIds = new Set(visible.map(m => String(m._id)));

  // ─────────────────────────────────────────────────────────────
  return (
    <OnboardingLayout
      step={4} totalSteps={6}
      title="Films you might have watched"
      subtitle={
        viewMode === 'tinder'
          ? "Swipe right if you've seen it · left to pass · rate after each pick"
          : 'Tap a poster if you\'ve seen it, then rate it. We\'ll surface similar picks as you go.'
      }
      onBack={() => navigate('/onboarding/genres')}
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={seenCount > 0 ? `Continue with ${ratedCount} rating${ratedCount !== 1 ? 's' : ''}` : 'Skip for now'}
      confidence={confidence}
    >
      {error && (
        <div className="info-banner info-banner--error" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── Header: stats + view toggle ─────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {seenCount > 0 ? (
            <span>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{seenCount}</span> seen ·{' '}
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{ratedCount}</span> rated
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'rgba(212,168,67,0.5)', animation: 'pulse 1.5s ease infinite' }} />
              Showing {visible.length} of {allMovies.length} suggestions
            </span>
          )}
        </div>
        {!isFetching && allMovies.length > 0 && (
          <ViewToggle mode={viewMode} onChange={handleViewChange} />
        )}
      </div>

      {/* ── Search bar (grid mode only) ──────────────────────── */}
      {!isFetching && viewMode === 'grid' && (
        <SearchBar onAdd={handleAddFromSearch} existingIds={existingIds} />
      )}

      {/* ── Progressive reveal hint ──────────────────────────── */}
      {!isFetching && viewMode === 'grid' && seenCount === 0 && visible.length === INITIAL_N && (
        <div className="info-banner" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          </svg>
          Tap any poster you've seen — we'll suggest similar movies as you pick
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────── */}
      {isFetching && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 'var(--space-3)' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {/* ════════════════ GRID MODE ════════════════ */}
      {!isFetching && viewMode === 'grid' && visible.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 'var(--space-3)' }}>
          {visible.map(m => (
            <MovieCard
              key={m._id}
              item={m}
              state={states[m._id]}
              onToggleSeen={toggleSeen}
              onRate={setRating}
              isNew={newIds.has(String(m._id))}
            />
          ))}
        </div>
      )}

      {/* ════════════════ TINDER MODE ════════════════ */}
      {!isFetching && viewMode === 'tinder' && visible.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            {tinderDone ? 'All films reviewed' : (
              <><span style={{ color: 'var(--gold)', fontWeight: 700 }}>{tinderIdx + 1}</span> of {visible.length}</>
            )}
          </div>

          {tinderDone ? (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎬</div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginBottom: 8 }}>All films reviewed!</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 22, lineHeight: 1.5 }}>
                {seenCount > 0 ? `Marked ${seenCount} seen${ratedCount > 0 ? `, rated ${ratedCount}` : ''}.` : 'No films marked — switch to Grid to pick some.'}
              </div>
              <button type="button" onClick={() => handleViewChange('grid')} style={{ padding: '8px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                Switch to Grid view
              </button>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', width: CARD_W, height: CARD_H }}>
                {card2 && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', transform: 'rotate(5deg) scale(0.91) translateY(-18px)', filter: 'brightness(0.28)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <TinderMovieCard movie={card2} />
                  </div>
                )}
                {card1 && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', transform: 'rotate(-3.5deg) scale(0.95) translateY(-9px)', filter: 'brightness(0.45)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <TinderMovieCard movie={card1} />
                  </div>
                )}
                {card0 && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
                    <SwipeCard key={card0._id} onSwipeRight={() => tinderRight(card0)} onSwipeLeft={tinderLeft} rightLabel="SEEN ✓" leftLabel="✗ PASS">
                      <TinderMovieCard movie={card0} />
                    </SwipeCard>
                  </div>
                )}
              </div>

              {ratingPending ? (
                <div style={{ width: '100%', maxWidth: CARD_W, background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.25)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', textAlign: 'center', animation: 'fadeIn 0.25s ease' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>You've seen this! Rate it?</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ratingPending.title}</div>
                  <StarRow value={states[ratingPending.id]?.rating || 0} onChange={r => tinderRate(ratingPending.id, r)} size="lg" />
                  <button type="button" onClick={() => setRatingPending(null)} style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--text-disabled)', fontSize: '0.7rem', cursor: 'pointer' }}>Skip rating</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 28, justifyContent: 'center' }}>
                  <TinderBtn onClick={tinderLeft} color="#ef4444" glowColor="#ef444444" label="Pass" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>} />
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-disabled)', textAlign: 'center', lineHeight: 1.5 }}>drag card<br/>or tap</div>
                  <TinderBtn onClick={() => card0 && tinderRight(card0)} color="#22c55e" glowColor="#22c55e44" label="Seen it" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>} />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────── */}
      {!isFetching && visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', margin: '0 auto var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="20" height="20" rx="3"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/>
            </svg>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No films found yet</div>
          <div style={{ fontSize: '0.82rem' }}>The database may still be loading. You can skip this step or search above.</div>
        </div>
      )}
    </OnboardingLayout>
  );
}
