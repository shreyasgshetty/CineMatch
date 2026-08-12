/**
 * SearchPage.jsx — Browse & Search
 *
 * Features:
 * - Debounced full-text search against GET /api/media/search
 * - Filter chips: Language, Genre, Type, Min Rating, Year range
 * - Paginated media card grid with skeleton loaders
 * - Empty state and error state handling
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mediaApi } from '../services/api';

// ── Constants ──────────────────────────────────────────────────
const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

const LANGUAGES = [
  { code: 'kn', label: 'Kannada' }, { code: 'te', label: 'Telugu' },
  { code: 'ta', label: 'Tamil'   }, { code: 'ml', label: 'Malayalam' },
  { code: 'hi', label: 'Hindi'   }, { code: 'bn', label: 'Bengali' },
  { code: 'mr', label: 'Marathi' }, { code: 'pa', label: 'Punjabi' },
  { code: 'en', label: 'English' }, { code: 'ko', label: 'Korean' },
  { code: 'ja', label: 'Japanese'},{ code: 'zh', label: 'Chinese' },
  { code: 'es', label: 'Spanish' }, { code: 'fr', label: 'French'  },
];

const GENRES = [
  'Action','Adventure','Animation','Comedy','Crime','Documentary',
  'Drama','Family','Fantasy','History','Horror','Music','Mystery',
  'Romance','Sci-Fi','Thriller','War','Western',
];

const RATING_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '6+',  value: '6' },
  { label: '7+',  value: '7' },
  { label: '8+',  value: '8' },
];

// ── Helpers ────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Sub-components ─────────────────────────────────────────────
function MediaCard({ item }) {
  const navigate = useNavigate();
  const poster = item.posterPath
    ? `${TMDB_IMG}${item.posterPath}`
    : null;

  return (
    <div
      className="media-card"
      onClick={() => navigate(`/media/${item._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/media/${item._id}`)}
    >
      <div className="media-card__poster">
        {poster ? (
          <img src={poster} alt={item.title} loading="lazy" />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)',
            gap: 8, color: 'var(--text-muted)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span style={{ fontSize: '0.65rem' }}>No poster</span>
          </div>
        )}
        <div className="media-card__overlay" />
        {item.rating > 0 && (
          <div className="media-card__badge">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {item.rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="media-card__info">
        <div className="media-card__title">{item.title}</div>
        <div className="media-card__meta">
          <span>{item.releaseYear || '—'}</span>
          <span style={{ color: 'var(--border-gold)' }}>·</span>
          <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
          {item.originalLanguage && (
            <>
              <span style={{ color: 'var(--border-gold)' }}>·</span>
              <span style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>{item.originalLanguage}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="media-card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton skeleton-poster" />
      <div className="media-card__info" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="skeleton" style={{ height: 13, width: '80%' }} />
        <div className="skeleton" style={{ height: 10, width: '50%' }} />
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 14px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.78rem',
        fontWeight: 600,
        border: `1px solid ${active ? 'var(--gold)' : 'var(--border-default)'}`,
        background: active ? 'rgba(212,168,67,0.12)' : 'transparent',
        color: active ? 'var(--gold)' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all var(--t-fast)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function SectionDivider({ label }) {
  return (
    <div className="cin-divider">
      <div className="cin-divider__line" />
      <span className="cin-divider__label">{label}</span>
      <div className="cin-divider__line" />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state
  const [query, setQuery]       = useState(searchParams.get('q') || '');
  const [language, setLanguage] = useState(searchParams.get('lang') || '');
  const [genre, setGenre]       = useState(searchParams.get('genre') || '');
  const [type, setType]         = useState(searchParams.get('type') || '');
  const [minRating, setMinRating] = useState(searchParams.get('rating') || '');
  const [page, setPage]         = useState(1);

  // Data state
  const [results, setResults]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // UI state
  const [showLangFilter, setShowLangFilter] = useState(false);
  const [showGenreFilter, setShowGenreFilter] = useState(false);

  const debouncedQuery = useDebounce(query, 380);
  const inputRef = useRef(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 24 };
      if (debouncedQuery) params.q = debouncedQuery;
      if (language)       params.language = language;
      if (genre)          params.genre = genre;
      if (type)           params.type = type;
      if (minRating)      params.minRating = minRating;

      const res = await mediaApi.search(params);
      setResults(res.data.media || []);
      setTotal(res.data.pagination?.total || 0);
      setTotalPages(res.data.pagination?.pages || 0);
    } catch (err) {
      setError('Failed to load results. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, language, genre, type, minRating, page]);

  // Sync URL params
  useEffect(() => {
    const p = {};
    if (debouncedQuery) p.q    = debouncedQuery;
    if (language)       p.lang = language;
    if (genre)          p.genre = genre;
    if (type)           p.type = type;
    if (minRating)      p.rating = minRating;
    setSearchParams(p, { replace: true });
  }, [debouncedQuery, language, genre, type, minRating]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [debouncedQuery, language, genre, type, minRating]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const hasFilters = language || genre || type || minRating;
  const activeFilterCount = [language, genre, type, minRating].filter(Boolean).length;

  const clearAll = () => {
    setLanguage(''); setGenre(''); setType(''); setMinRating('');
    setQuery('');
  };

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) 0 var(--space-16)', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: '30%', width: '40%', height: '35%', background: 'radial-gradient(ellipse,rgba(99,130,210,0.05) 0%,transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '35%', height: '35%', background: 'radial-gradient(ellipse,rgba(212,168,67,0.05) 0%,transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="animate-fade-in" style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', background: 'rgba(99,130,210,0.07)', border: '1px solid rgba(99,130,210,0.18)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-4)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7da0f0', display: 'inline-block', boxShadow: '0 0 5px #7da0f0' }} />
            <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7da0f0' }}>Browse</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginBottom: 'var(--space-2)', fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>
            Discover <span style={{ color: 'var(--gold)' }}>Cinema</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, lineHeight: 1.7, marginBottom: 0 }}>
            Search across {total > 0 ? total.toLocaleString() : '23,000+'} titles spanning 14 languages and industries.
          </p>
        </div>

        {/* ── Search Bar ─────────────────────────────────────── */}
        <div className="animate-fade-in" style={{ position: 'relative', marginBottom: 'var(--space-5)', animationDelay: '80ms' }}>
          <div style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            ref={inputRef}
            id="search-input"
            className="form-input"
            type="text"
            placeholder="Search titles, genres, actors…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ paddingLeft: 50, paddingRight: query ? 44 : 18, fontSize: '1rem', height: 52, borderRadius: 'var(--radius-xl)' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* ── Filter Bar ─────────────────────────────────────── */}
        <div className="animate-fade-in" style={{ marginBottom: 'var(--space-6)', animationDelay: '120ms' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>

            {/* Type */}
            <FilterChip label="All" active={!type} onClick={() => setType('')} />
            <FilterChip label="Movies" active={type === 'movie'} onClick={() => setType(type === 'movie' ? '' : 'movie')} />
            <FilterChip label="TV Shows" active={type === 'tv'} onClick={() => setType(type === 'tv' ? '' : 'tv')} />

            <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 4px' }} />

            {/* Language dropdown trigger */}
            <div style={{ position: 'relative' }}>
              <FilterChip
                label={language ? (LANGUAGES.find(l => l.code === language)?.label || language) : 'Language ▾'}
                active={!!language}
                onClick={() => { setShowLangFilter(v => !v); setShowGenreFilter(false); }}
              />
              {showLangFilter && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-2)',
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, width: 280,
                  boxShadow: 'var(--shadow-xl)',
                }}>
                  <button onClick={() => { setLanguage(''); setShowLangFilter(false); }} style={{ gridColumn: '1/-1', padding: '6px 10px', borderRadius: 'var(--radius-md)', background: !language ? 'rgba(212,168,67,0.10)' : 'transparent', border: `1px solid ${!language ? 'var(--border-gold)' : 'transparent'}`, color: !language ? 'var(--gold)' : 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginBottom: 4 }}>All Languages</button>
                  {LANGUAGES.map(l => (
                    <button key={l.code} onClick={() => { setLanguage(l.code); setShowLangFilter(false); }} style={{ padding: '5px 8px', borderRadius: 'var(--radius-md)', background: language === l.code ? 'rgba(212,168,67,0.10)' : 'transparent', border: `1px solid ${language === l.code ? 'var(--border-gold)' : 'transparent'}`, color: language === l.code ? 'var(--gold)' : 'var(--text-secondary)', fontSize: '0.73rem', fontWeight: 500, cursor: 'pointer', transition: 'all var(--t-fast)', textAlign: 'center' }}
                      onMouseEnter={e => { if (language !== l.code) { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.color = 'var(--text-primary)'; }}}
                      onMouseLeave={e => { if (language !== l.code) { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}}
                    >{l.label}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Genre dropdown trigger */}
            <div style={{ position: 'relative' }}>
              <FilterChip
                label={genre || 'Genre ▾'}
                active={!!genre}
                onClick={() => { setShowGenreFilter(v => !v); setShowLangFilter(false); }}
              />
              {showGenreFilter && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)', padding: 'var(--space-2)',
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, width: 310,
                  boxShadow: 'var(--shadow-xl)',
                }}>
                  <button onClick={() => { setGenre(''); setShowGenreFilter(false); }} style={{ gridColumn: '1/-1', padding: '6px 10px', borderRadius: 'var(--radius-md)', background: !genre ? 'rgba(212,168,67,0.10)' : 'transparent', border: `1px solid ${!genre ? 'var(--border-gold)' : 'transparent'}`, color: !genre ? 'var(--gold)' : 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginBottom: 4 }}>All Genres</button>
                  {GENRES.map(g => (
                    <button key={g} onClick={() => { setGenre(g); setShowGenreFilter(false); }} style={{ padding: '5px 8px', borderRadius: 'var(--radius-md)', background: genre === g ? 'rgba(212,168,67,0.10)' : 'transparent', border: `1px solid ${genre === g ? 'var(--border-gold)' : 'transparent'}`, color: genre === g ? 'var(--gold)' : 'var(--text-secondary)', fontSize: '0.73rem', fontWeight: 500, cursor: 'pointer', textAlign: 'center', transition: 'all var(--t-fast)' }}
                      onMouseEnter={e => { if (genre !== g) { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.color = 'var(--text-primary)'; }}}
                      onMouseLeave={e => { if (genre !== g) { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-secondary)'; }}}
                    >{g}</button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ width: 1, height: 20, background: 'var(--border-subtle)', margin: '0 4px' }} />

            {/* Rating */}
            {RATING_OPTIONS.map(r => (
              <FilterChip key={r.label} label={r.label === 'Any' ? 'Rating' : `★ ${r.label}`} active={minRating === r.value && r.value !== ''} onClick={() => setMinRating(r.value)} />
            ))}

            {activeFilterCount > 0 && (
              <button onClick={clearAll} style={{ padding: '5px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.06)', color: '#f87171', cursor: 'pointer', marginLeft: 4 }}>
                Clear all ({activeFilterCount})
              </button>
            )}
          </div>
        </div>

        {/* ── Results Header ──────────────────────────────────── */}
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {total > 0
                ? <>{total.toLocaleString()} result{total !== 1 ? 's' : ''}{debouncedQuery ? ` for "${debouncedQuery}"` : ''}</>
                : 'No results found'
              }
            </span>
            {totalPages > 1 && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
            )}
          </div>
        )}

        {/* ── Error ──────────────────────────────────────────── */}
        {error && (
          <div className="info-banner info-banner--error" style={{ marginBottom: 'var(--space-6)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* ── Grid ───────────────────────────────────────────── */}
        {loading ? (
          <div className="grid-auto">
            {Array.from({ length: 24 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : results.length > 0 ? (
          <div className="grid-auto animate-fade-in">
            {results.map(item => <MediaCard key={item._id} item={item} />)}
          </div>
        ) : !error ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-20) 0', color: 'var(--text-muted)' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p style={{ fontSize: '1rem', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>No titles found</p>
            <p style={{ fontSize: '0.85rem' }}>Try adjusting your search or removing some filters.</p>
            {hasFilters && (
              <button className="btn btn--ghost btn--sm" onClick={clearAll} style={{ marginTop: 'var(--space-4)' }}>Clear filters</button>
            )}
          </div>
        ) : null}

        {/* ── Pagination ─────────────────────────────────────── */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-10)' }}>
            <button
              className="btn btn--ghost btn--sm"
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page <= 1}
              style={{ opacity: page <= 1 ? 0.35 : 1 }}
            >
              ← Prev
            </button>

            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let p;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <button key={p} onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', border: `1px solid ${p === page ? 'var(--gold)' : 'var(--border-default)'}`, background: p === page ? 'rgba(212,168,67,0.12)' : 'transparent', color: p === page ? 'var(--gold)' : 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: p === page ? 700 : 500, cursor: 'pointer', transition: 'all var(--t-fast)' }}>
                  {p}
                </button>
              );
            })}

            <button
              className="btn btn--ghost btn--sm"
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page >= totalPages}
              style={{ opacity: page >= totalPages ? 0.35 : 1 }}
            >
              Next →
            </button>
          </div>
        )}

      </div>

      {/* Click-outside to close dropdowns */}
      {(showLangFilter || showGenreFilter) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => { setShowLangFilter(false); setShowGenreFilter(false); }} />
      )}
    </div>
  );
}
