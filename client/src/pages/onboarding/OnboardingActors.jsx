/**
 * OnboardingActors — Step 5 of 6
 *
 * Features & Fixes:
 *  1. State Persistence — `prefs` saved to `sessionStorage` (`ob_actor_prefs`).
 *     Navigating Back/Next keeps all likes/dislikes and confidence intact.
 *  2. Unreviewed Filter in Tinder Deck — Cards mode deck automatically filters out
 *     actors already decided (liked/disliked/loved) in Grid or Cards mode.
 *  3. Like / Dislike — Grid cards have ❤ Love / 👎 Not-for-me buttons.
 *  4. Progressive Reveal & Search to Add.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi, mediaApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import SwipeCard from '../../components/onboarding/SwipeCard';
import { resetDownstreamOnboarding } from '../../utils/onboardingHelper';

const TMDB_FACE    = 'https://image.tmdb.org/t/p/w185';
const ACTOR_CARD_W = 280;
const ACTOR_CARD_H = 340;
const INITIAL_N    = 5;
const REVEAL_N     = 4;

const PREF = { LOVE: 'love', LIKE: 'like', DISLIKE: 'dislike', NONE: null };

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function findSimilarPeople(pool, shownIds) {
  return pool.filter(p => !shownIds.has(String(p.tmdbId))).slice(0, REVEAL_N);
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

function PersonCard({ person, pref, onPref, isNew }) {
  const [hovered, setHovered] = useState(false);
  const liked    = pref === PREF.LIKE || pref === PREF.LOVE;
  const loved    = pref === PREF.LOVE;
  const disliked = pref === PREF.DISLIKE;

  return (
    <div
      style={{
        position: 'relative', textAlign: 'center',
        animation: isNew ? 'slideUp 0.35s ease both' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Portrait circle */}
      <div
        onClick={() => onPref(person.tmdbId, liked ? PREF.NONE : PREF.LIKE)}
        style={{
          position: 'relative', width: '100%', aspectRatio: '1',
          maxWidth: 96, margin: '0 auto', borderRadius: '50%', overflow: 'hidden',
          background: 'var(--bg-overlay)', cursor: 'pointer',
          border: loved
            ? '3px solid #f472b6'
            : liked
              ? '3px solid var(--gold)'
              : disliked
                ? '3px solid rgba(239,68,68,0.4)'
                : hovered ? '3px solid rgba(212,168,67,0.35)' : '3px solid var(--border-subtle)',
          boxShadow: loved
            ? '0 0 22px rgba(244,114,182,0.55)'
            : liked
              ? '0 0 22px rgba(212,168,67,0.45)'
              : disliked
                ? '0 0 8px rgba(239,68,68,0.25)'
                : 'none',
          transition: 'border-color var(--t-base), box-shadow var(--t-base)',
          transform: liked ? 'scale(1.04)' : hovered ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {person.profilePath ? (
          <img src={`${TMDB_FACE}${person.profilePath}`} alt={person.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover',
              filter: disliked ? 'grayscale(80%) brightness(0.6)' : 'none',
              transition: 'filter 0.2s, transform var(--t-slow)',
              transform: hovered ? 'scale(1.07)' : 'scale(1)' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(145deg,var(--bg-elevated),var(--bg-overlay))' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        )}

        {isNew && (
          <div style={{ position: 'absolute', top: 4, right: 4, fontSize: '0.45rem', fontWeight: 900, padding: '1px 5px', borderRadius: 99, background: 'rgba(212,168,67,0.9)', color: '#0d0a02', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NEW</div>
        )}
      </div>

      {/* ❤ / 👎 micro buttons */}
      <div style={{
        display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6,
        opacity: hovered || liked || disliked ? 1 : 0,
        transition: 'opacity 0.15s',
        pointerEvents: hovered || liked || disliked ? 'auto' : 'none',
      }}>
        <button
          type="button" title="Love"
          onClick={() => onPref(person.tmdbId, pref === PREF.LOVE ? PREF.LIKE : PREF.LOVE)}
          style={{
            width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
            background: loved ? '#ec4899' : 'rgba(255,255,255,0.07)',
            boxShadow: loved ? '0 0 8px rgba(236,72,153,0.6)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', transform: loved ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill={loved ? '#fff' : 'rgba(236,72,153,0.8)'} stroke={loved ? 'none' : 'rgba(236,72,153,0.8)'} strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        <button
          type="button" title="Not for me"
          onClick={() => onPref(person.tmdbId, pref === PREF.DISLIKE ? PREF.NONE : PREF.DISLIKE)}
          style={{
            width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
            background: disliked ? '#ef4444' : 'rgba(255,255,255,0.07)',
            boxShadow: disliked ? '0 0 8px rgba(239,68,68,0.5)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', transform: disliked ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={disliked ? '#fff' : 'rgba(239,68,68,0.8)'} strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div style={{
        marginTop: liked || disliked ? 2 : 6,
        fontWeight: 700, fontSize: '0.72rem', lineHeight: 1.2,
        color: loved ? '#f472b6' : liked ? 'var(--gold)' : disliked ? 'rgba(239,68,68,0.7)' : hovered ? 'var(--text-primary)' : 'var(--text-secondary)',
        transition: 'color var(--t-fast)',
      }}>
        {person.name}
      </div>
      {person.knownFor && (
        <div style={{ fontSize: '0.58rem', color: 'var(--text-disabled)', marginTop: 2, lineHeight: 1.3 }}>
          {person.knownFor}
        </div>
      )}
      {(liked || disliked) && (
        <div style={{ fontSize: '0.55rem', marginTop: 2, fontWeight: 700, letterSpacing: '0.04em',
          color: loved ? '#f472b6' : liked ? 'rgba(212,168,67,0.7)' : 'rgba(239,68,68,0.6)' }}>
          {loved ? '❤ Love' : liked ? '✓ Liked' : '✗ Not for me'}
        </div>
      )}
    </div>
  );
}

// ── Tinder actor card content ─────────────────────────────────────
function TinderActorCard({ person }) {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
      background: 'linear-gradient(145deg, var(--bg-elevated) 0%, var(--bg-overlay) 100%)',
      boxShadow: '0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 18, padding: '24px 16px 20px',
    }}>
      <div style={{ width: 160, height: 160, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '3px solid rgba(255,255,255,0.08)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', background: 'var(--bg-card)' }}>
        {person.profilePath ? (
          <img src={`${TMDB_FACE}${person.profilePath}`} alt={person.name} draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', padding: '0 8px' }}>
        <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>{person.name}</div>
        {person.knownFor && (
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>Known for: {person.knownFor}</div>
        )}
      </div>
    </div>
  );
}

// ── View toggle ───────────────────────────────────────────────────
function ViewToggle({ mode, onChange }) {
  const options = [
    { id: 'grid', label: 'Grid', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: 'tinder', label: 'Cards', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="14" height="18" rx="2"/><rect x="7" y="6" width="14" height="18" rx="2" fill="currentColor" fillOpacity="0.25" strokeWidth="1.5"/></svg> },
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
        transition: 'transform 0.15s, box-shadow 0.15s', opacity: disabled ? 0.35 : 1,
      }}>
      {icon}
      <span style={{ fontSize: '0.5rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
    </button>
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
        const res = await mediaApi.searchPeople({ q: q.trim(), role: 'actor', limit: 6 });
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
        {loading ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
            <circle cx="12" cy="12" r="9" strokeOpacity="0.25"/><path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        )}
        <input value={query} onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Don't see your favourite? Search actors…"
          style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.82rem', width: '100%', fontFamily: 'var(--font-sans)' }} />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setResults([]); setOpen(false); }} style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer', padding: '2px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 50, boxShadow: '0 12px 40px rgba(0,0,0,0.6)', animation: 'fadeInD 0.15s ease' }}>
          {results.map((item, i) => (
            <button key={item.tmdbId} type="button" onMouseDown={() => handleAdd(item)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', border: 'none', background: added === item.tmdbId ? 'rgba(212,168,67,0.12)' : 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = added === item.tmdbId ? 'rgba(212,168,67,0.12)' : 'transparent'}
            >
              {item.profilePath ? (
                <img src={`${TMDB_FACE}${item.profilePath}`} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 32, height: 32, background: 'var(--bg-overlay)', borderRadius: '50%', flexShrink: 0 }} />
              )}
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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInD { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────
export default function OnboardingActors() {
  const navigate = useNavigate();
  const cardRef  = useRef(null);

  const [allPeople, setAllPeople]   = useState([]);
  const [visible, setVisible]       = useState([]);
  const [shownIds, setShownIds]     = useState(new Set());
  const [newIds, setNewIds]         = useState(new Set());

  // Restore prefs from sessionStorage so going back/forward preserves user picks!
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('ob_actor_prefs') || '{}');
    } catch { return {}; }
  });

  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');

  // Tinder state
  const [viewMode, setViewMode]   = useState(() => sessionStorage.getItem('ob_view_actors') || 'grid');

  // Save prefs to sessionStorage on every update and invalidate downstream Directors step
  useEffect(() => {
    sessionStorage.setItem('ob_actor_prefs', JSON.stringify(prefs));
    if (Object.keys(prefs).length > 0) {
      resetDownstreamOnboarding(5);
    }
  }, [prefs]);

  // ── Load actors ───────────────────────────────────────────────
  useEffect(() => {
    const mediaIds  = JSON.parse(sessionStorage.getItem('ob_watched_ids') || '[]').join(',');
    const languages = JSON.parse(sessionStorage.getItem('ob_languages')   || '[]').join(',');
    onboardingApi.getPeopleSuggestions({ mediaIds, languages, role: 'actor', limit: 40 })
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
      .catch(() => setError('Could not load actor suggestions.'))
      .finally(() => setIsFetching(false));
  }, []);

  // ── Progressive reveal ────────────────────────────────────────
  const revealMore = useCallback(() => {
    setShownIds(prevShown => {
      const picks = findSimilarPeople(allPeople, prevShown);
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
    if (shownIds.has(idStr)) {
      setPref(idStr, PREF.LIKE);
      return;
    }
    setVisible(prev => [item, ...prev]);
    setShownIds(prev => new Set([...prev, idStr]));
    setNewIds(new Set([idStr]));
    setTimeout(() => setNewIds(new Set()), 2000);
    setPref(idStr, PREF.LIKE);
  }, [shownIds, setPref]);

  // ── Tinder deck (only UNREVIEWED actors) ─────────────────────
  const unreviewedPeople = visible.filter(p => !prefs[String(p.tmdbId)]);

  const tinderRight = useCallback((person) => {
    setPref(person.tmdbId, PREF.LIKE);
  }, [setPref]);

  const tinderLeft = useCallback((person) => {
    setPref(person.tmdbId, PREF.DISLIKE);
  }, [setPref]);

  const handleViewChange = (mode) => {
    setViewMode(mode);
    sessionStorage.setItem('ob_view_actors', mode);
  };

  // ── Continue ──────────────────────────────────────────────────
  const handleNext = async () => {
    setIsLoading(true); setError('');
    try {
      const actors = visible
        .filter(p => prefs[String(p.tmdbId)] && prefs[String(p.tmdbId)] !== PREF.NONE)
        .map(p => ({ tmdbId: p.tmdbId, name: p.name, preference: prefs[String(p.tmdbId)] }));
      await onboardingApi.saveActors({ actors });
      navigate('/onboarding/directors');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save. Try again.');
    } finally { setIsLoading(false); }
  };

  // ── Confidence ────────────────────────────────────────────────
  const liked    = Object.values(prefs).filter(p => p === PREF.LIKE || p === PREF.LOVE).length;
  const disliked = Object.values(prefs).filter(p => p === PREF.DISLIKE).length;
  const baseConf   = Number(sessionStorage.getItem('ob_conf_movies') || 60);
  const actorAdd   = Math.min(20, liked * 3 + disliked * 1);
  const confidence = Math.min(85, baseConf + actorAdd);

  if (!isFetching) sessionStorage.setItem('ob_conf_actors', String(confidence));

  const selCount   = liked;
  const actor0     = unreviewedPeople[0];
  const actor1     = unreviewedPeople[1];
  const actor2     = unreviewedPeople[2];
  const tinderDone = !isFetching && unreviewedPeople.length === 0;
  const existingIds = new Set(visible.map(p => String(p.tmdbId)));

  // ─────────────────────────────────────────────────────────────
  return (
    <OnboardingLayout
      step={5} totalSteps={6}
      title="Actors you enjoy watching"
      subtitle={
        viewMode === 'tinder'
          ? 'Swipe right to like · left means not for you · we learn from both'
          : 'Tap a portrait to like · use the heart to love · X to pass — we\'ll suggest more as you choose'
      }
      onBack={() => navigate('/onboarding/movies')}
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={selCount > 0 ? `Continue with ${selCount} actor${selCount > 1 ? 's' : ''}` : 'Skip this step'}
      confidence={confidence}
    >
      {error && (
        <div className="info-banner info-banner--error" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {selCount > 0 ? (
            <span>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{selCount}</span> liked
              {disliked > 0 && <span> · <span style={{ color: 'rgba(239,68,68,0.7)', fontWeight: 700 }}>{disliked}</span> passed</span>}
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(212,168,67,0.5)', display: 'inline-block', animation: 'pulse 1.5s ease infinite' }} />
              Showing {visible.length} of {allPeople.length}
            </span>
          )}
        </div>
        {!isFetching && allPeople.length > 0 && (
          <ViewToggle mode={viewMode} onChange={handleViewChange} />
        )}
      </div>

      {/* Search bar (grid mode) */}
      {!isFetching && viewMode === 'grid' && (
        <SearchBar onAdd={handleAddFromSearch} existingIds={existingIds} />
      )}

      {/* Hint */}
      {!isFetching && viewMode === 'grid' && selCount === 0 && visible.length === INITIAL_N && (
        <div className="info-banner" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          Tap a portrait to like · use ❤ to love · ✗ to say "not for me" · more will appear as you choose
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

      {/* ════════════════ GRID MODE ════════════════ */}
      {!isFetching && viewMode === 'grid' && visible.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 'var(--space-5)' }}>
          {visible.map(p => (
            <PersonCard
              key={p.tmdbId}
              person={p}
              pref={prefs[String(p.tmdbId)] || PREF.NONE}
              onPref={setPref}
              isNew={newIds.has(String(p.tmdbId))}
            />
          ))}
        </div>
      )}

      {/* ════════════════ TINDER MODE ════════════════ */}
      {!isFetching && viewMode === 'tinder' && visible.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            {tinderDone ? 'All actors reviewed' : (
              <>Unreviewed: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{unreviewedPeople.length}</span></>
            )}
          </div>

          {tinderDone ? (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎭</div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginBottom: 8 }}>All actors reviewed!</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 22, lineHeight: 1.5 }}>
                {selCount > 0 ? `Liked ${selCount} actor${selCount !== 1 ? 's' : ''}.` : 'No actors liked — switch to Grid to pick some.'}
              </div>
              <button type="button" onClick={() => handleViewChange('grid')} style={{ padding: '8px 18px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                Switch to Grid view
              </button>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative', width: ACTOR_CARD_W, height: ACTOR_CARD_H }}>
                {actor2 && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', transform: 'rotate(5deg) scale(0.91) translateY(-14px)', filter: 'brightness(0.28)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <TinderActorCard person={actor2} />
                  </div>
                )}
                {actor1 && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', transform: 'rotate(-3.5deg) scale(0.95) translateY(-7px)', filter: 'brightness(0.45)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <TinderActorCard person={actor1} />
                  </div>
                )}
                {actor0 && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
                    <SwipeCard
                      ref={cardRef}
                      key={actor0.tmdbId}
                      onSwipeRight={() => tinderRight(actor0)}
                      onSwipeLeft={() => tinderLeft(actor0)}
                      rightLabel="❤ LIKE" leftLabel="PASS"
                      rightColor="236,72,153" leftColor="148,163,184">
                      <TinderActorCard person={actor0} />
                    </SwipeCard>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 28, justifyContent: 'center' }}>
                <TinderBtn
                  onClick={() => cardRef.current?.swipeLeft()}
                  color="#94a3b8" glowColor="#94a3b844" label="Pass"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                />
                <div style={{ fontSize: '0.6rem', color: 'var(--text-disabled)', textAlign: 'center', lineHeight: 1.5 }}>drag card<br/>or tap</div>
                <TinderBtn
                  onClick={() => cardRef.current?.swipeRight()}
                  color="#ec4899" glowColor="#ec489944" label="Like"
                  icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isFetching && visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--text-muted)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', margin: '0 auto var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No actor data yet</div>
          <div style={{ fontSize: '0.82rem' }}>Try going back and rating more movies, or search for your favourites above.</div>
        </div>
      )}
    </OnboardingLayout>
  );
}
