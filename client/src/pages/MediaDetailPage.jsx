/**
 * MediaDetailPage.jsx — Cinematic Dossier Layout
 *
 * Structure (3 Acts):
 *   ACT I  — THE TITLE: Immersive hero, poster, metadata dateline, dual rating, insight, actions
 *   ACT II — THE PEOPLE: Cinematic cast & director lineup
 *   ACT III— MORE LIKE THIS: Contextual recommendations
 *
 * Rating System:
 *   - Community rating (cmRating / cmVoteCount) from CineMatch backend
 *   - User rating: upsert via POST /api/interactions (no duplicate vote inflation)
 *   - Frontend updates immediately after successful POST without page reload
 *
 * Preserved: all existing API calls, auth flow, navigation, recommendations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mediaApi, recommendationApi, interactionApi } from '../services/api';

const TMDB_BACKDROP = 'https://image.tmdb.org/t/p/w1280';
const TMDB_POSTER   = 'https://image.tmdb.org/t/p/w500';
const TMDB_PROFILE  = 'https://image.tmdb.org/t/p/w185';

// ── Circular Rating Arc ────────────────────────────────────────
function RatingArc({ value, max = 5 }) {
  const r = 38;
  const cx = 48;
  const cy = 48;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);
  const display = value > 0 ? value.toFixed(1) : '—';

  return (
    <div className="mdp-rating-arc-wrap">
      <svg className="mdp-rating-arc-svg" viewBox="0 0 96 96">
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9983A" />
            <stop offset="50%" stopColor="#EFC45A" />
            <stop offset="100%" stopColor="#D4A843" />
          </linearGradient>
        </defs>
        <circle className="mdp-rating-arc-track" cx={cx} cy={cy} r={r}
          strokeDasharray={circumference} strokeDashoffset={0} />
        <circle className="mdp-rating-arc-fill" cx={cx} cy={cy} r={r}
          strokeDasharray={circumference}
          strokeDashoffset={value > 0 ? offset : circumference} />
      </svg>
      <div className="mdp-rating-arc-center">
        <span className="mdp-rating-numeral">{display}</span>
        {value > 0 && <span className="mdp-rating-star-icon">★</span>}
      </div>
    </div>
  );
}

// ── Verdict Stars ──────────────────────────────────────────────
function VerdictStars({ value, onRate, loading }) {
  const [hovered, setHovered] = useState(0);
  const [popping, setPopping] = useState(0);

  const handleClick = useCallback((n) => {
    if (loading) return;
    setPopping(n);
    setTimeout(() => setPopping(0), 450);
    onRate(n);
  }, [loading, onRate]);

  const display = hovered || value;

  return (
    <div className="mdp-stars-row" role="group" aria-label="Rate this title">
      {[1, 2, 3, 4, 5].map(n => {
        const isActive  = display >= n;
        const isHovered = hovered >= n && hovered > 0;
        const isPop     = popping === n;
        return (
          <span
            key={n}
            className={[
              'mdp-star',
              isActive ? 'active' : '',
              isHovered && !value ? 'hovered' : '',
              isPop ? 'popping' : '',
            ].join(' ')}
            onClick={() => handleClick(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            role="button"
            tabIndex={0}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onKeyDown={e => e.key === 'Enter' && handleClick(n)}
          >★</span>
        );
      })}
    </div>
  );
}

// ── Cast Card ──────────────────────────────────────────────────
function CastCard({ person, isDirector }) {
  const img = person.profilePath ? `${TMDB_PROFILE}${person.profilePath}` : null;
  return (
    <div className="mdp-cast-card">
      <div className="mdp-cast-portrait-wrap">
        {img
          ? <img src={img} alt={person.name} className="mdp-cast-portrait" loading="lazy" />
          : (
            <div className="mdp-cast-portrait-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )
        }
        {isDirector && (
          <span className="mdp-cast-role-badge">Director</span>
        )}
      </div>
      <div>
        <div className="mdp-cast-name">{person.name}</div>
        {person.character && !isDirector && (
          <div className="mdp-cast-character">{person.character}</div>
        )}
      </div>
    </div>
  );
}

// ── Similar Card ───────────────────────────────────────────────
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
          : (
            <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" />
              </svg>
            </div>
          )
        }
        <div className="media-card__overlay" />
        {item.rating > 0 && (
          <div className="media-card__badge">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
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

// ── Skeleton ───────────────────────────────────────────────────
function SkeletonDetail() {
  return (
    <div className="mdp-skeleton-stage">
      <div className="skeleton" style={{ width: '100%', height: '100vh', borderRadius: 0 }} />
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div className="mdp-section-header">
      <span className="mdp-section-title">{title}</span>
      <div className="mdp-section-line" />
      {sub && <span className="mdp-section-sub">{sub}</span>}
    </div>
  );
}

// ── Meta Item ──────────────────────────────────────────────────
function MetaItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="mdp-meta-item">
      <span className="mdp-meta-label">{label}</span>
      <span className="mdp-meta-value">{value}</span>
    </div>
  );
}

// ── Insight Panel ──────────────────────────────────────────────
function InsightPanel({ media }) {
  // Build themes from real metadata only
  const themes = [];
  if (media.genres?.length > 0) {
    themes.push(...media.genres.slice(0, 3).map(g => g));
  }
  if (media.keywords?.length > 0) {
    const keyThemes = media.keywords
      .slice(0, 3)
      .map(k => k.charAt(0).toUpperCase() + k.slice(1));
    // Add keywords that don't duplicate genres
    for (const kt of keyThemes) {
      if (!themes.some(t => t.toLowerCase() === kt.toLowerCase())) {
        themes.push(kt);
      }
    }
  }
  if (themes.length === 0) return null;
  return (
    <div className="mdp-insight">
      <span className="mdp-insight-icon">✦</span>
      <div className="mdp-insight-body">
        <span className="mdp-insight-title">CineMatch Insight — Why you might like this</span>
        <div className="mdp-insight-themes">
          {themes.slice(0, 6).map(t => (
            <span key={t} className="mdp-insight-tag">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function MediaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [media, setMedia]               = useState(null);
  const [similar, setSimilar]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // User rating state
  const [userRating, setUserRating]     = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading]     = useState(false);

  // Community rating state (live-updated after user rates)
  const [cmRating, setCmRating]         = useState(0);
  const [cmVoteCount, setCmVoteCount]   = useState(0);

  // Action states
  const [watchlisted, setWatchlisted]   = useState(false);
  const [watched, setWatched]           = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setMedia(null);
    setSimilar([]);
    setLoading(true);
    setError(null);
    setUserRating(0);
    setRatingSubmitted(false);
    setWatchlisted(false);
    setWatched(false);

    (async () => {
      try {
        const [mediaRes, interactionRes] = await Promise.all([
          mediaApi.getById(id),
          interactionApi.getForMedia(id),
        ]);

        const m = mediaRes.data.media;
        setMedia(m);

        // Initialize community rating from backend
        setCmRating(m.cmRating || 0);
        setCmVoteCount(m.cmVoteCount || 0);

        // Restore previously saved rating
        const saved = interactionRes.data.interaction;
        if (saved?.rating) {
          setUserRating(saved.rating);
          setRatingSubmitted(true);
        }
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

  // ── Rating handler ─────────────────────────────────────────
  const handleRate = useCallback(async (stars) => {
    setUserRating(stars);
    setRatingLoading(true);
    try {
      const res = await interactionApi.record({ mediaId: id, action: 'rated', rating: stars });
      setRatingSubmitted(true);
      // Update community rating immediately from backend response
      if (res.data.cmRating !== undefined) setCmRating(res.data.cmRating);
      if (res.data.cmVoteCount !== undefined) setCmVoteCount(res.data.cmVoteCount);
    } catch {
      // silent — rating UI still updates
    } finally {
      setRatingLoading(false);
    }
  }, [id]);

  // ── Action handlers ─────────────────────────────────────────
  const handleWatchlist = useCallback(async () => {
    if (actionLoading === 'watchlist') return;
    setWatchlisted(prev => !prev);
    setActionLoading('watchlist');
    try {
      await interactionApi.record({ mediaId: id, action: 'interested' });
    } catch {
      setWatchlisted(prev => !prev); // revert on error
    } finally {
      setActionLoading('');
    }
  }, [id, actionLoading]);

  const handleWatched = useCallback(async () => {
    if (actionLoading === 'watched') return;
    setWatched(prev => !prev);
    setActionLoading('watched');
    try {
      await interactionApi.record({ mediaId: id, action: 'watched' });
    } catch {
      setWatched(prev => !prev); // revert on error
    } finally {
      setActionLoading('');
    }
  }, [id, actionLoading]);

  if (loading) return <SkeletonDetail />;
  if (error || !media) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', color: 'var(--text-muted)' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.35 }}>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p style={{ color: 'var(--text-secondary)' }}>{error || 'Title not found.'}</p>
      <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)}>← Go back</button>
    </div>
  );

  // ── Derived values ─────────────────────────────────────────
  const backdrop = media.backdropPath ? `${TMDB_BACKDROP}${media.backdropPath}` : null;
  const poster   = media.posterPath   ? `${TMDB_POSTER}${media.posterPath}` : null;
  const runtime  = media.runtime ? `${Math.floor(media.runtime / 60)}h ${media.runtime % 60}m` : null;

  const typeLabel = media.type === 'tv' ? 'Series' : 'Film';
  const langLabel = media.originalLanguage?.toUpperCase();
  const genreLabel = media.genres?.slice(0, 2).join(' / ') || null;

  // Community rating to display: prefer cmRating if non-zero, fall back to TMDB
  const displayCmRating = cmRating > 0 ? cmRating : (media.rating ? (media.rating / 2) : 0);
  const displayCmVotes  = cmVoteCount > 0 ? cmVoteCount : media.voteCount;

  const ratingMessages = [
    '', // 0
    'Not your thing.',     // 1
    'Could be better.',    // 2
    'Pretty decent.',      // 3
    'Really good taste!',  // 4
    'A cinematic gem!',    // 5
  ];

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ════════════════════════════════════════════════════════
          ACT I — THE TITLE
          ════════════════════════════════════════════════════════ */}
      <div className="mdp-stage">

        {/* Backdrop */}
        {backdrop ? (
          <>
            <div
              className="mdp-backdrop"
              style={{ backgroundImage: `url(${backdrop})` }}
            />
            <div className="mdp-backdrop-gradient" />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, var(--bg-elevated), var(--bg-base))' }} />
        )}

        {/* Film grain */}
        <div className="mdp-grain" aria-hidden="true" />

        {/* Back nav */}
        <button className="mdp-back" onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        {/* Hero content */}
        <div className="mdp-hero-content">
          <div className="mdp-inner">

            {/* ── Floating Poster ── */}
            <div className="mdp-poster-wrap">
              {poster
                ? <img src={poster} alt={media.title} className="mdp-poster-img" />
                : (
                  <div className="mdp-poster-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="m8 21 4-4 4 4" /><line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </div>
                )
              }
            </div>

            {/* ── Title Zone ── */}
            <div className="mdp-title-zone">

              <span className="mdp-act-label">{typeLabel}</span>

              <h1 className="mdp-title">{media.title}</h1>

              {/* Dateline metadata */}
              <div className="mdp-dateline">
                {media.releaseYear && <span>{media.releaseYear}</span>}
                {runtime && (
                  <>
                    <span className="mdp-dateline-sep">·</span>
                    <span>{runtime}</span>
                  </>
                )}
                {langLabel && (
                  <>
                    <span className="mdp-dateline-sep">·</span>
                    <span>{langLabel}</span>
                  </>
                )}
                {media.industry && (
                  <>
                    <span className="mdp-dateline-sep">·</span>
                    <span>{media.industry}</span>
                  </>
                )}
                {genreLabel && (
                  <>
                    <span className="mdp-dateline-sep">·</span>
                    <span className="mdp-dateline-accent">{genreLabel}</span>
                  </>
                )}
              </div>

              {/* Overview */}
              {media.overview && (
                <p className="mdp-overview">{media.overview}</p>
              )}

              {/* CineMatch Insight Panel */}
              <InsightPanel media={media} />

              {/* Action buttons */}
              <div className="mdp-actions">
                <button
                  id="mdp-watchlist-btn"
                  className={`mdp-action-btn${watchlisted ? ' active' : ''}`}
                  onClick={handleWatchlist}
                  disabled={actionLoading === 'watchlist'}
                  aria-pressed={watchlisted}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={watchlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  {watchlisted ? 'Watchlisted' : '+ Watchlist'}
                </button>
                <button
                  id="mdp-watched-btn"
                  className={`mdp-action-btn${watched ? ' active' : ''}`}
                  onClick={handleWatched}
                  disabled={actionLoading === 'watched'}
                  aria-pressed={watched}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {watched
                      ? <polyline points="20 6 9 17 4 12" />
                      : <><circle cx="12" cy="12" r="10" /><polyline points="12 8 12 12 14 14" /></>
                    }
                  </svg>
                  {watched ? 'Watched' : 'Mark Watched'}
                </button>
              </div>

              {/* ── Dual Rating Module ── */}
              <div className="mdp-rating-module">

                {/* Community Rating */}
                <div className="mdp-community-rating">
                  <RatingArc value={displayCmRating} max={5} />
                  <div className="mdp-community-meta">
                    <span className="mdp-community-label">Community Rating</span>
                    {displayCmRating > 0 && (
                      <span className="mdp-community-subtitle">
                        {cmVoteCount > 0 ? 'CineMatch users' : 'TMDB average'}
                      </span>
                    )}
                    {displayCmVotes > 0 && (
                      <span className="mdp-community-votes">
                        {displayCmVotes.toLocaleString()} {cmVoteCount > 0 ? 'ratings' : 'votes'}
                      </span>
                    )}
                    {displayCmRating === 0 && (
                      <span className="mdp-community-subtitle" style={{ fontStyle: 'italic' }}>No ratings yet</span>
                    )}
                  </div>
                </div>

                <div className="mdp-rating-divider" aria-hidden="true" />

                {/* Your Verdict */}
                <div className="mdp-verdict">
                  <span className="mdp-verdict-label">Your Verdict</span>
                  <VerdictStars
                    value={userRating}
                    onRate={handleRate}
                    loading={ratingLoading}
                  />
                  {!ratingSubmitted && userRating === 0 && (
                    <span className="mdp-verdict-hint">Tap a star to rate</span>
                  )}
                  {ratingSubmitted && userRating > 0 && (
                    <div className="mdp-verdict-confirm">
                      <span style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>✦</span>
                      <span className="mdp-verdict-confirm-text">
                        {ratingMessages[userRating]}
                      </span>
                      <span className="mdp-verdict-score">{userRating}/5</span>
                    </div>
                  )}
                  {ratingLoading && (
                    <span className="mdp-verdict-hint">Saving…</span>
                  )}
                </div>

              </div>
              {/* End Rating Module */}

            </div>
            {/* End Title Zone */}

          </div>
          {/* End .mdp-inner */}
        </div>
        {/* End Hero Content */}

      </div>
      {/* End ACT I Stage */}


      {/* ════════════════════════════════════════════════════════
          BODY — Acts II & III
          ════════════════════════════════════════════════════════ */}
      <div className="mdp-body">

        {/* ── Metadata Strip ── */}
        <div className="mdp-meta-strip">
          <MetaItem label="Format" value={typeLabel} />
          <MetaItem label="Year" value={media.releaseYear} />
          <MetaItem label="Runtime" value={runtime} />
          <MetaItem label="Language" value={langLabel} />
          <MetaItem label="Industry" value={media.industry} />
          {media.voteCount > 0 && (
            <MetaItem label="TMDB Votes" value={media.voteCount.toLocaleString()} />
          )}
          {media.rating > 0 && (
            <MetaItem label="TMDB Rating" value={`${media.rating.toFixed(1)} / 10`} />
          )}
          {media.popularity > 0 && (
            <MetaItem label="Popularity" value={media.popularity.toFixed(0)} />
          )}
        </div>

        {/* ── All Genres ── */}
        {media.genres?.length > 0 && (
          <div className="mdp-section" style={{ marginBottom: 'var(--space-8)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {media.genres.map(g => (
                <span key={g} style={{
                  padding: '4px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(212,168,67,0.22)',
                  color: 'var(--gold)',
                  background: 'rgba(212,168,67,0.06)',
                }}>{g}</span>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            ACT II — THE PEOPLE
            ════════════════════════════════════ */}

        {/* Directors */}
        {media.directors?.length > 0 && (
          <div className="mdp-section">
            <SectionHeader title="Direction" />
            <div className="mdp-cast-scroll">
              {media.directors.map(d => (
                <CastCard key={d.tmdbId} person={d} isDirector />
              ))}
            </div>
          </div>
        )}

        {/* Cast */}
        {media.cast?.length > 0 && (
          <div className="mdp-section">
            <SectionHeader title="Cast" sub={`${media.cast.length} featured`} />
            <div className="mdp-cast-scroll">
              {media.cast.map(c => (
                <CastCard key={c.tmdbId} person={c} isDirector={false} />
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {media.keywords?.length > 0 && (
          <div className="mdp-section" style={{ marginBottom: 'var(--space-8)' }}>
            <SectionHeader title="Themes & Keywords" />
            <div className="mdp-keywords">
              {media.keywords.slice(0, 20).map(k => (
                <button
                  key={k}
                  className="mdp-keyword-btn"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(k)}`)}
                  aria-label={`Search for ${k}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            ACT III — MORE LIKE THIS
            ════════════════════════════════════ */}
        {similar.length > 0 && (
          <div className="mdp-section">
            <div className="mdp-section-header">
              <span className="mdp-section-title">More Like This</span>
              <div className="mdp-section-line" />
            </div>
            <div style={{ marginBottom: 'var(--space-2)', paddingLeft: 0 }}>
              <p style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                marginBottom: 'var(--space-5)',
                fontStyle: 'italic',
              }}>
                Because you're viewing <span style={{ color: 'var(--ivory-dim)', fontStyle: 'normal' }}>{media.title}</span>
              </p>
            </div>
            <div className="mdp-similar-scroll">
              {similar.map(s => (
                <div key={s._id} className="scroll-row__item">
                  <SimilarCard item={s} />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      {/* End Body */}

    </div>
  );
}
