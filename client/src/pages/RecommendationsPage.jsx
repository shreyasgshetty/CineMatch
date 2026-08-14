/**
 * RecommendationsPage.jsx — "For You" Personalized Feed
 *
 * Features:
 * - Calls GET /api/recommendations with limit control
 * - Reason tags per card ("Matches your genre", "Highly rated", etc.)
 * - Source badge: ml-service vs fallback
 * - Refresh button to regenerate
 * - Empty / first-use state
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { recommendationApi, interactionApi } from '../services/api';

const TMDB_POSTER = 'https://image.tmdb.org/t/p/w342';

// ── Sub-components ──────────────────────────────────────────────
function ReasonTag({ text }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 'var(--radius-full)',
      fontSize: '0.68rem', fontWeight: 600,
      background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(212,168,67,0.18)',
      color: 'var(--gold)', lineHeight: 1.5,
    }}>{text}</span>
  );
}

function ScoreBar({ score }) {
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? 'var(--gold)' : pct >= 50 ? '#7da0f0' : 'var(--text-muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 3, background: 'var(--bg-overlay)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 'var(--radius-full)', transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

function RecommendationCard({ item, index, onFeedback }) {
  const navigate = useNavigate();

  const media = item.media || item;
  const poster = media.posterPath
    ? `${TMDB_POSTER}${media.posterPath}`
    : null;

  const reasons = item.reasons || [];
  const score = item.score || 0;

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleFeedback = async (action, event) => {
    // Prevent clicking the card and navigating to Media Details
    event.stopPropagation();

    if (submitting || feedback) return;

    try {
      setSubmitting(true);

      await interactionApi.record({
        mediaId: media._id,
        action,
      });

      setFeedback(action);

      // Small delay so user can see confirmation
      setTimeout(() => {
        onFeedback(media._id);
      }, 500);

    } catch (error) {
      console.error('Failed to record interaction:', error);
      alert('Could not save your feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          padding: 'var(--space-4)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          cursor: 'pointer',
          transition: 'all var(--t-base)',
        }}
        onClick={() => navigate(`/media/${media._id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          e.key === 'Enter' && navigate(`/media/${media._id}`)
        }
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-gold)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >

        {/* Rank */}
        <div
          style={{
            flexShrink: 0,
            width: 28,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: 4,
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color:
                index < 3
                  ? 'var(--gold)'
                  : 'var(--text-disabled)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* Poster */}
        <div
          style={{
            flexShrink: 0,
            width: 70,
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            aspectRatio: '2/3',
            background: 'var(--bg-elevated)',
          }}
        >
          {poster ? (
            <img
              src={poster}
              alt={media.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              loading="lazy"
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <h3
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {media.title}
            </h3>

            {media.rating > 0 && (
              <span
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--gold)',
                }}
              >
                ⭐ {media.rating.toFixed(1)}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-2)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            {media.releaseYear && <span>{media.releaseYear}</span>}
            {media.type && (
              <>
                <span>·</span>
                <span style={{ textTransform: 'capitalize' }}>
                  {media.type}
                </span>
              </>
            )}
            {media.originalLanguage && (
              <>
                <span>·</span>
                <span style={{ textTransform: 'uppercase' }}>
                  {media.originalLanguage}
                </span>
              </>
            )}
          </div>

          {/* Match score */}
          <div style={{ marginBottom: 'var(--space-2)' }}>
            <div
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 4,
              }}
            >
              Match
            </div>

            <ScoreBar score={score} />
          </div>

          {/* Reasons */}
          {reasons.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 5,
                flexWrap: 'wrap',
                marginBottom: 'var(--space-3)',
              }}
            >
              {reasons.map((r, i) => (
                <ReasonTag key={i} text={r} />
              ))}
            </div>
          )}

          {/* Feedback Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-3)',
            }}
          >
            <button
              type="button"
              disabled={submitting || feedback}
              onClick={(e) => handleFeedback('interested', e)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(52,211,153,0.3)',
                background:
                  feedback === 'interested'
                    ? 'rgba(52,211,153,0.15)'
                    : 'transparent',
                color: 'var(--color-success)',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor:
                  submitting || feedback
                    ? 'default'
                    : 'pointer',
              }}
            >
              {feedback === 'interested'
                ? '✓ Interested'
                : submitting
                  ? 'Saving...'
                  : '👍 Interested'}
            </button>

            <button
              type="button"
              disabled={submitting || feedback}
              onClick={(e) => handleFeedback('not_interested', e)}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(239,68,68,0.3)',
                background:
                  feedback === 'not_interested'
                    ? 'rgba(239,68,68,0.12)'
                    : 'transparent',
                color: '#ef4444',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor:
                  submitting || feedback
                    ? 'default'
                    : 'pointer',
              }}
            >
              {feedback === 'not_interested'
                ? '✓ Not interested'
                : submitting
                  ? 'Saving...'
                  : '👎 Not Interested'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)' }}>
      <div className="skeleton" style={{ width: 28, height: 20, borderRadius: 4, flexShrink: 0 }} />
      <div className="skeleton" style={{ width: 70, aspectRatio: '2/3', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton" style={{ height: 18, width: '70%' }} />
        <div className="skeleton" style={{ height: 12, width: '40%' }} />
        <div className="skeleton" style={{ height: 8, width: '100%' }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 'var(--radius-full)' }} />
          <div className="skeleton" style={{ height: 20, width: 100, borderRadius: 'var(--radius-full)' }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function RecommendationsPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('');
  const [limit, setLimit] = useState(20);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await recommendationApi.get({ limit });
      setRecs(res.data.recommendations || []);
      setSource(res.data.source || '');
    } catch (err) {
      setError('Could not load recommendations. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [limit, refreshKey]);

  const handleFeedback = async (mediaId) => {
    // Remove the movie immediately from the current list
    setRecs((current) =>
      current.filter((item) => {
        const media = item.media || item;
        return media._id !== mediaId;
      })
    );

    // Refresh recommendations after preferences were updated
    setTimeout(() => {
      setRefreshKey((k) => k + 1);
    }, 600);
  };

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) 0 var(--space-16)', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-5%', left: '20%', width: '50%', height: '40%', background: 'radial-gradient(ellipse,rgba(122,24,37,0.06) 0%,transparent 70%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '5%', width: '40%', height: '40%', background: 'radial-gradient(ellipse,rgba(212,168,67,0.06) 0%,transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: 860 }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="animate-fade-in" style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', background: 'rgba(158,32,48,0.08)', border: '1px solid rgba(158,32,48,0.22)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-4)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--crimson-mid)', display: 'inline-block', boxShadow: '0 0 5px var(--crimson-mid)' }} />
            <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--crimson-mid)' }}>For You</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginBottom: 'var(--space-2)', fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>
                Curated for <span style={{ color: 'var(--gold)' }}>{firstName}</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 0 }}>
                Personalized picks based on your language preferences, genre choices, and ratings.
              </p>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexShrink: 0 }}>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => setRefreshKey(k => k + 1)}
                disabled={loading}
                title="Refresh recommendations"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.5s', transform: loading ? 'rotate(360deg)' : 'none' }}>
                  <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Source info */}
          {!loading && source && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 'var(--space-3)', padding: '3px 12px', borderRadius: 'var(--radius-full)', background: source === 'ml-service' ? 'rgba(52,211,153,0.08)' : 'rgba(212,168,67,0.06)', border: `1px solid ${source === 'ml-service' ? 'rgba(52,211,153,0.2)' : 'rgba(212,168,67,0.15)'}` }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: source === 'ml-service' ? 'var(--color-success)' : 'var(--gold)', display: 'inline-block' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: source === 'ml-service' ? 'var(--color-success)' : 'var(--text-muted)' }}>
                {source === 'ml-service' ? 'Powered by ML engine' : 'Preference-based fallback · ML engine starting up'}
              </span>
            </div>
          )}
        </div>

        {/* ── Error ──────────────────────────────────────────── */}
        {error && (
          <div className="info-banner info-banner--error animate-fade-in" style={{ marginBottom: 'var(--space-6)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
            <button className="btn btn--ghost btn--sm" onClick={() => setRefreshKey(k => k + 1)} style={{ marginLeft: 'auto' }}>Retry</button>
          </div>
        )}

        {/* ── List ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : recs.length > 0
              ? recs.map((item, i) => (
                <RecommendationCard
                  key={item.media?._id || i}
                  item={item}
                  index={i}
                  onFeedback={handleFeedback}
                />
              ))
              : !error && (
                <div style={{ textAlign: 'center', padding: 'var(--space-20) 0', color: 'var(--text-muted)' }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto var(--space-4)', opacity: 0.3 }}>
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: 'var(--space-2)' }}>No recommendations yet</p>
                  <p style={{ fontSize: '0.85rem' }}>Rate some movies to help us learn your taste.</p>
                </div>
              )
          }
        </div>

        {/* ── Load More ──────────────────────────────────────── */}
        {!loading && recs.length >= limit && (
          <div style={{ textAlign: 'center', marginTop: 'var(--space-8)' }}>
            <button
              className="btn btn--outline-gold"
              onClick={() => setLimit(l => l + 20)}
            >
              Load more recommendations
            </button>
          </div>
        )}

      </div>
    </div>
  );
}