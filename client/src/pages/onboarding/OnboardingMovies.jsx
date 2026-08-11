import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

function StarRow({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onClick={e => { e.stopPropagation(); onChange(s); }}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '1px',
            fontSize: '1rem',
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

function MovieCard({ item, state, onToggleSeen, onRate }) {
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
      }}
      onClick={() => onToggleSeen(item._id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      {item.posterPath ? (
        <img src={`${TMDB_IMG}${item.posterPath}`} alt={item.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform var(--t-slow)', transform: hovered ? 'scale(1.05)' : 'scale(1)' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(145deg,var(--bg-elevated),var(--bg-overlay))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '2rem', opacity: 0.3, color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.8rem' }}>No Image</span>
        </div>
      )}

      {/* Bottom gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.97) 0%,rgba(0,0,0,0.5) 55%,transparent 100%)', padding: '10px 8px 8px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.7rem', color: '#fff', lineHeight: 1.2, marginBottom: 2, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{item.title}</div>
        <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.5)' }}>{item.releaseYear} · {item.type === 'tv' ? 'Series' : 'Film'}</div>

        {isSeen && (
          <div style={{ marginTop: 5 }} onClick={e => e.stopPropagation()}>
            <StarRow value={rating} onChange={r => onRate(item._id, r)} />
            {rating === 0 && <div style={{ fontSize: '0.55rem', color: 'rgba(212,168,67,0.65)', textAlign: 'center', marginTop: 2 }}>tap to rate</div>}
          </div>
        )}
      </div>

      {/* Hover overlay */}
      {!isSeen && hovered && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity var(--t-fast)' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--gradient-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(212,168,67,0.6)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d0a02" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
      )}

      {/* Seen badge */}
      {isSeen && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--gradient-gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 10px rgba(212,168,67,0.6)',
        }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0d0a02" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )}
    </div>
  );
}

export default function OnboardingMovies() {
  const navigate = useNavigate();
  const [movies, setMovies]         = useState([]);
  const [states, setStates]         = useState({});
  const [isLoading, setIsLoading]   = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    const languages = JSON.parse(sessionStorage.getItem('ob_languages') || '[]').join(',');
    const genres    = JSON.parse(sessionStorage.getItem('ob_genres') || '[]').join(',');
    onboardingApi.getMovieSuggestions({ languages, genres, limit: 36 })
      .then(res => setMovies(res.data.media || []))
      .catch(() => setError('Could not load suggestions. Check your connection.'))
      .finally(() => setIsFetching(false));
  }, []);

  const toggleSeen = (id) => setStates(prev => ({ ...prev, [id]: { seen: !prev[id]?.seen, rating: prev[id]?.rating || 0 } }));
  const setRating  = (id, r) => setStates(prev => ({ ...prev, [id]: { ...prev[id], rating: r } }));

  const seenItems  = Object.entries(states).filter(([, s]) => s.seen);
  const ratedCount = seenItems.filter(([, s]) => s.rating > 0).length;

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

  const seenCount = seenItems.length;

  return (
    <OnboardingLayout
      step={3} totalSteps={5}
      title="Films you might have watched"
      subtitle="Based on your languages and genres — tap a poster if you've seen it, then rate it"
      onBack={() => navigate('/onboarding/genres')}
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={seenCount > 0 ? `Continue with ${ratedCount} rating${ratedCount !== 1 ? 's' : ''}` : 'Skip for now'}
    >
      {error && (
        <div className="info-banner info-banner--error" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          {error}
        </div>
      )}

      {seenCount > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-6)', padding: 'var(--space-3) var(--space-4)', background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.15)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-5)', fontSize: '0.8rem' }}>
          <span><span style={{ color: 'var(--gold)', fontWeight: 700 }}>{seenCount}</span> <span style={{ color: 'var(--text-muted)' }}>marked seen</span></span>
          <span><span style={{ color: 'var(--gold)', fontWeight: 700 }}>{ratedCount}</span> <span style={{ color: 'var(--text-muted)' }}>rated</span></span>
          <span style={{ color: 'var(--text-disabled)', marginLeft: 'auto', fontSize: '0.7rem' }}>tap poster = seen · tap stars = rate</span>
        </div>
      )}

      {seenCount === 0 && !isFetching && (
        <div className="info-banner" style={{ marginBottom: 'var(--space-5)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
          Tap any poster you've seen — a star rating will appear. You can skip this step.
        </div>
      )}

      {isFetching && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 'var(--space-3)' }}>
          {[...Array(18)].map((_,i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '2/3', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      )}

      {!isFetching && movies.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 'var(--space-3)' }}>
          {movies.map(m => (
            <MovieCard key={m._id} item={m} state={states[m._id]} onToggleSeen={toggleSeen} onRate={setRating} />
          ))}
        </div>
      )}

      {!isFetching && movies.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', margin: '0 auto var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="3"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          </div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>No films found yet</div>
          <div style={{ fontSize: '0.82rem' }}>The database may still be loading. You can skip this step.</div>
        </div>
      )}
    </OnboardingLayout>
  );
}
