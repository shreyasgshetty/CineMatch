import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mediaApi, onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w92';

// ── Star Rating Component ─────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '2px 1px', fontSize: '1.05rem', lineHeight: 1,
            color: star <= (hovered || value)
              ? (hovered ? '#F5C842' : 'var(--gold)')
              : 'var(--border-default)',
            transition: 'color 0.15s, transform 0.1s',
            transform: star <= (hovered || value) ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Rated Media Card ──────────────────────────────────────────
function RatedCard({ item, onRemove, onChangeRating }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)',
      borderRadius: 'var(--radius-md)', padding: 'var(--space-3)',
      transition: 'border-color 0.2s',
    }}>
      {/* Poster */}
      <div style={{
        width: 44, height: 60, borderRadius: 6, overflow: 'hidden',
        background: 'var(--bg-overlay)', flexShrink: 0,
        border: '1px solid var(--border-subtle)',
      }}>
        {item.posterPath ? (
          <img
            src={`${TMDB_IMG}${item.posterPath}`}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            🎬
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.title}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>
          {item.year} · {item.mediaType === 'tv' ? 'TV Show' : 'Movie'}
        </div>
        <StarRating value={item.rating} onChange={(r) => onChangeRating(item._id, r)} />
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(item._id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-disabled)', fontSize: '1rem',
          padding: 4, borderRadius: 4, flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#FCA5A5'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}
      >
        ✕
      </button>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function OnboardingMovies() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [rated, setRated] = useState([]); // [{ _id, title, year, posterPath, mediaType, rating }]
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const debounceRef = useRef(null);

  // ── Debounced search ────────────────────────────────────────
  const handleSearch = useCallback((q) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await mediaApi.search({ q, limit: 8 });
        setResults(res.data.media || []);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 380);
  }, []);

  // ── Add to rated ─────────────────────────────────────────────
  const addMedia = (item) => {
    if (rated.find(r => r._id === item._id)) return;
    setRated(prev => [...prev, {
      _id: item._id,
      title: item.title,
      year: item.releaseYear || item.year || '—',
      posterPath: item.posterPath,
      mediaType: item.mediaType,
      rating: 0,
    }]);
    setQuery('');
    setResults([]);
  };

  const removeMedia = (id) => setRated(prev => prev.filter(r => r._id !== id));
  const changeRating = (id, rating) => setRated(prev => prev.map(r => r._id === id ? { ...r, rating } : r));

  // ── Submit ───────────────────────────────────────────────────
  const handleNext = async () => {
    setIsLoading(true);
    setError('');
    try {
      const ratings = rated.map(r => ({
        mediaId: r._id,
        ...(r.rating > 0 ? { rating: r.rating } : { action: 'skipped' }),
      }));
      await onboardingApi.saveRatings({ ratings });
      navigate('/onboarding/genres');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save ratings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const ratedCount = rated.filter(r => r.rating > 0).length;

  return (
    <OnboardingLayout
      step={2} totalSteps={5}
      title="Tell us what you've watched"
      subtitle="Search for movies or TV shows you've seen and rate them — this trains your personal taste engine"
      onBack={() => navigate('/onboarding/languages')}
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={ratedCount > 0 ? `Continue with ${ratedCount} rating${ratedCount > 1 ? 's' : ''} →` : 'Skip this step →'}
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

      {/* ── Search Box ─────────────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-5)' }}>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 'var(--space-4)', top: '50%', transform: 'translateY(-50%)',
            fontSize: '1rem', pointerEvents: 'none', color: 'var(--text-muted)',
          }}>🔍</span>
          <input
            id="movie-search"
            type="text"
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search movies, web series, TV shows..."
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

        {/* ── Search Dropdown ──────────────────────────────────── */}
        {results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}>
            {results.map(item => {
              const alreadyAdded = rated.find(r => r._id === item._id);
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => !alreadyAdded && addMedia(item)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-3)', background: 'none',
                    border: 'none', borderBottom: '1px solid var(--border-subtle)',
                    cursor: alreadyAdded ? 'not-allowed' : 'pointer',
                    textAlign: 'left', transition: 'background 0.15s',
                    opacity: alreadyAdded ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!alreadyAdded) e.currentTarget.style.background = 'var(--bg-overlay)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >
                  {/* Mini poster */}
                  <div style={{
                    width: 32, height: 44, borderRadius: 4, overflow: 'hidden',
                    background: 'var(--bg-overlay)', flexShrink: 0,
                  }}>
                    {item.posterPath ? (
                      <img src={`${TMDB_IMG}${item.posterPath}`} alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🎬</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {item.releaseYear || item.year || '—'} · {item.mediaType === 'tv' ? '📺 TV' : '🎬 Movie'} · {item.originalLanguage?.toUpperCase()}
                    </div>
                  </div>
                  {alreadyAdded ? (
                    <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700 }}>Added ✓</span>
                  ) : (
                    <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>+</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Tip / empty state ─────────────────────────────────── */}
      {rated.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 'var(--space-10) var(--space-6)',
          background: 'var(--bg-card)', border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>⭐</div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Search &amp; rate movies you've watched</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 340, margin: '0 auto' }}>
            Rating just 3–5 films helps CineMatch understand your taste. You can also skip this step.
          </div>
        </div>
      )}

      {/* ── Rated list ────────────────────────────────────────── */}
      {rated.length > 0 && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 'var(--space-3)',
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              {rated.length} added · {ratedCount} rated
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              ★ tap stars to rate
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {rated.map(item => (
              <RatedCard
                key={item._id}
                item={item}
                onRemove={removeMedia}
                onChangeRating={changeRating}
              />
            ))}
          </div>

          {/* Legend */}
          <div style={{
            marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)',
            background: 'rgba(201,168,76,0.04)', borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(201,168,76,0.1)',
            display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap',
          }}>
            {[['★', 'Hated it'], ['★★', "Didn't like"], ['★★★', 'It was ok'], ['★★★★', 'Liked it'], ['★★★★★', 'Loved it']].map(([stars, label]) => (
              <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--gold)', fontSize: '0.75rem' }}>{stars}</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
}
