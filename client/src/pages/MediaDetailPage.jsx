/**
 * MediaDetailPage.jsx — Full Movie / TV Show Detail
 *
 * Features:
 * - Cinematic hero with backdrop blur + gradient overlay
 * - Full metadata: cast, directors, genres, keywords
 * - Star-based user rating interaction
 * - "Similar Titles" horizontal scroll row
 * - Skeleton loading state
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { mediaApi, recommendationApi, interactionApi } from '../services/api';

const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
const TMDB_POSTER   = 'https://image.tmdb.org/t/p/w342';
const TMDB_PROFILE  = 'https://image.tmdb.org/t/p/w185';

// ── Helpers ────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <div className="star-rating" aria-label="Rate this title">
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`star${display >= n ? ' active' : ''}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          role="button"
          tabIndex={0}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onKeyDown={e => e.key === 'Enter' && onChange(n)}
        >★</span>
      ))}
      {value > 0 && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6, alignSelf: 'center' }}>
          {value}/5
        </span>
      )}
    </div>
  );
}

function GenreBadge({ genre }) {
  return <span className="badge badge--genre">{genre}</span>;
}

function SimilarCard({ item }) {
  const navigate = useNavigate();
  const poster = item.posterPath ? `${TMDB_POSTER}${item.posterPath}` : null;
  return (
    <div
      className="scroll-row__item media-card"
      onClick={() => navigate(`/media/${item._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/media/${item._id}`)}
    >
      <div className="media-card__poster">
        {poster
          ? <img src={poster} alt={item.title} loading="lazy" />
          : <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/></svg>
            </div>
        }
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
        <div className="media-card__meta"><span>{item.releaseYear || '—'}</span></div>
      </div>
    </div>
  );
}

function PersonCard({ person, role }) {
  const img = person.profilePath ? `${TMDB_PROFILE}${person.profilePath}` : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 90, flexShrink: 0 }}>
      <div style={{ width: 70, height: 70, borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-elevated)', border: '2px solid var(--border-default)', flexShrink: 0 }}>
        {img
          ? <img src={img} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
        }
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{person.name}</div>
        {person.character && (
          <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', marginTop: 2 }}>{person.character}</div>
        )}
        {role === 'director' && (
          <div style={{ fontSize: '0.64rem', color: 'var(--gold)', marginTop: 2 }}>Director</div>
        )}
      </div>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div>
      <div className="skeleton" style={{ width: '100%', height: '60vh', borderRadius: 0 }} />
      <div className="container" style={{ marginTop: 'var(--space-8)' }}>
        <div className="skeleton" style={{ width: '55%', height: 36, marginBottom: 'var(--space-3)' }} />
        <div className="skeleton" style={{ width: '30%', height: 18, marginBottom: 'var(--space-6)' }} />
        <div className="skeleton" style={{ width: '100%', height: 100 }} />
      </div>
    </div>
  );
}

function MetaItem({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function MediaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [media, setMedia]         = useState(null);
  const [similar, setSimilar]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setMedia(null); setSimilar([]); setLoading(true); setError(null);
    setUserRating(0); setRatingSubmitted(false);

    (async () => {
      try {
        const res = await mediaApi.getById(id);
        setMedia(res.data.media);
      } catch {
        setError('Could not load this title.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Fetch similar after media loads
  useEffect(() => {
    if (!media?._id) return;
    recommendationApi.getSimilar(media._id, { limit: 12 })
      .then(res => setSimilar(res.data.similar || []))
      .catch(() => {});
  }, [media?._id]);

  const handleRate = async (stars) => {
    setUserRating(stars);
    setRatingLoading(true);
    try {
      await interactionApi.record({ mediaId: id, type: 'rating', rating: stars });
      setRatingSubmitted(true);
    } catch {
      // silent — rating UI still updates
    } finally {
      setRatingLoading(false);
    }
  };

  if (loading) return <SkeletonDetail />;
  if (error || !media) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', color: 'var(--text-muted)' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.35 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p style={{ color: 'var(--text-secondary)' }}>{error || 'Title not found.'}</p>
      <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>← Go back</button>
    </div>
  );

  const backdrop = media.backdropPath ? `${TMDB_BACKDROP}${media.backdropPath}` : null;
  const poster   = media.posterPath   ? `${TMDB_POSTER}${media.posterPath}`     : null;
  const runtime  = media.runtime ? `${Math.floor(media.runtime / 60)}h ${media.runtime % 60}m` : null;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 'var(--space-16)' }}>

      {/* ── Cinematic Hero ──────────────────────────────────── */}
      <div style={{ position: 'relative', width: '100%', minHeight: '65vh', display: 'flex', alignItems: 'flex-end' }}>
        {/* Backdrop */}
        {backdrop ? (
          <>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${backdrop})`, backgroundSize: 'cover', backgroundPosition: 'center top', filter: 'brightness(0.45) saturate(0.9)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(13,15,20,0.2) 0%, rgba(13,15,20,0.6) 55%, var(--bg-base) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(13,15,20,0.85) 0%, transparent 55%)' }} />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, var(--bg-elevated), var(--bg-base))' }} />
        )}

        {/* Content row */}
        <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: 'var(--space-10)', paddingTop: 'var(--space-16)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-end', flexWrap: 'wrap' }}>

            {/* Poster */}
            {poster && (
              <div style={{ flexShrink: 0, width: 160, borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-default)' }}>
                <img src={poster} alt={media.title} style={{ width: '100%', display: 'block' }} />
              </div>
            )}

            {/* Info */}
            <div style={{ flex: 1, minWidth: 240 }}>
              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
                <span className="badge badge--type" style={{ textTransform: 'capitalize' }}>{media.type}</span>
                <span className="badge badge--lang">{media.originalLanguage?.toUpperCase()}</span>
                {media.industry && <span className="badge badge--industry">{media.industry}</span>}
              </div>

              <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(1.8rem,5vw,3.2rem)', marginBottom: 'var(--space-2)', lineHeight: 1.1 }}>
                {media.title}
              </h1>

              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-4)', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {media.releaseYear && <span>{media.releaseYear}</span>}
                {runtime && <><span style={{ color: 'var(--text-muted)' }}>·</span><span>{runtime}</span></>}
                {media.rating > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--gold)', fontWeight: 700 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    {media.rating.toFixed(1)}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.78rem' }}>({media.voteCount?.toLocaleString()} votes)</span>
                  </span>
                )}
              </div>

              {/* Genres */}
              {media.genres?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
                  {media.genres.map(g => <GenreBadge key={g} genre={g} />)}
                </div>
              )}

              {/* Overview */}
              {media.overview && (
                <p style={{ maxWidth: 560, lineHeight: 1.8, color: 'var(--ivory-dim)', fontSize: '0.92rem', marginBottom: 'var(--space-5)' }}>
                  {media.overview}
                </p>
              )}

              {/* Rating CTA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Your Rating</div>
                  <StarRating value={userRating} onChange={handleRate} />
                  {ratingSubmitted && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-success)', marginTop: 6 }}>
                      ✓ Saved — this improves your recommendations
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div className="container" style={{ marginTop: 'var(--space-8)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr min(320px, 30%)', gap: 'var(--space-10)', alignItems: 'start' }}>

          {/* ── Left Column ──────────────────────────────────── */}
          <div>

            {/* Directors */}
            {media.directors?.length > 0 && (
              <div style={{ marginBottom: 'var(--space-8)' }}>
                <div className="cin-divider" style={{ marginTop: 0, marginBottom: 'var(--space-5)' }}>
                  <div className="cin-divider__line" />
                  <span className="cin-divider__label">Directed by</span>
                  <div className="cin-divider__line" />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
                  {media.directors.map(d => <PersonCard key={d.tmdbId} person={d} role="director" />)}
                </div>
              </div>
            )}

            {/* Cast */}
            {media.cast?.length > 0 && (
              <div style={{ marginBottom: 'var(--space-8)' }}>
                <div className="section__header" style={{ marginBottom: 'var(--space-4)' }}>
                  <div className="section__title" style={{ fontSize: '1rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Cast
                  </div>
                </div>
                <div className="scroll-row" style={{ paddingBottom: 'var(--space-4)' }}>
                  {media.cast.map(c => (
                    <div key={c.tmdbId} className="scroll-row__item" style={{ width: 90 }}>
                      <PersonCard person={c} role="actor" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Titles */}
            {similar.length > 0 && (
              <div style={{ marginBottom: 'var(--space-8)' }}>
                <div className="section__header" style={{ marginBottom: 'var(--space-4)' }}>
                  <div className="section__title" style={{ fontSize: '1rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
                    More Like This
                  </div>
                </div>
                <div className="scroll-row">
                  {similar.map(s => <SimilarCard key={s._id} item={s} />)}
                </div>
              </div>
            )}
          </div>

          {/* ── Right Sidebar ─────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <MetaItem label="Status"          value={media.type === 'tv' ? 'TV Series' : 'Movie'} />
              <MetaItem label="Release Year"    value={media.releaseYear} />
              <MetaItem label="Runtime"         value={runtime} />
              <MetaItem label="Language"        value={media.originalLanguage?.toUpperCase()} />
              <MetaItem label="Industry"        value={media.industry} />
              {media.voteCount > 0 && (
                <MetaItem label="TMDB Votes"    value={media.voteCount.toLocaleString()} />
              )}
              {media.popularity > 0 && (
                <MetaItem label="Popularity"    value={media.popularity.toFixed(0)} />
              )}
            </div>

            {/* Keywords */}
            {media.keywords?.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-5)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>Keywords</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {media.keywords.slice(0, 16).map(k => (
                    <button key={k}
                      onClick={() => navigate(`/search?q=${encodeURIComponent(k)}`)}
                      style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 500, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all var(--t-fast)' }}
                      onMouseEnter={e => { e.target.style.borderColor = 'var(--border-gold)'; e.target.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { e.target.style.borderColor = 'var(--border-default)'; e.target.style.color = 'var(--text-muted)'; }}
                    >{k}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Back button */}
            <button className="btn btn--ghost" onClick={() => navigate(-1)} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
