import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../../services/api';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const TMDB_IMG    = 'https://image.tmdb.org/t/p/w342';
const TMDB_SMALL  = 'https://image.tmdb.org/t/p/w185';

function StarRow({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onClick={e => { e.stopPropagation(); onChange(s); }}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{ background:'none', border:'none', cursor:'pointer', padding:'1px', fontSize:'1.1rem', color: s <= (hovered||value) ? (hovered ? '#F5C842' : 'var(--gold)') : 'rgba(255,255,255,0.3)', transition:'all 0.12s', transform: s <= (hovered||value) ? 'scale(1.2)' : 'scale(1)' }}
        >★</button>
      ))}
    </div>
  );
}

function MovieCard({ item, state, onToggleSeen, onRate }) {
  // state: 'unseen' | 'seen'
  const isSeen = state?.seen;
  const rating = state?.rating || 0;

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '2/3', background: '#111', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: isSeen ? '0 0 0 2.5px var(--gold), 0 0 20px rgba(201,168,76,0.25)' : '0 2px 12px rgba(0,0,0,0.5)' }}
      onClick={() => onToggleSeen(item._id)}
      onMouseEnter={e => { if (!isSeen) e.currentTarget.style.transform = 'scale(1.03) translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {/* Poster */}
      <img src={`${TMDB_IMG}${item.posterPath}`} alt={item.title}
        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />

      {/* Bottom gradient always */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(to top,rgba(0,0,0,0.95) 0%,rgba(0,0,0,0.5) 55%,transparent 100%)', padding:'10px 8px 8px' }}>
        <div style={{ fontWeight:700, fontSize:'0.72rem', color:'#fff', lineHeight:1.2, marginBottom:2, textShadow:'0 1px 3px rgba(0,0,0,0.8)' }}>{item.title}</div>
        <div style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.55)' }}>{item.releaseYear} · {item.type === 'tv' ? 'Series' : 'Film'}</div>

        {/* Star rating — only when seen */}
        {isSeen && (
          <div style={{ marginTop: 5 }} onClick={e => e.stopPropagation()}>
            <StarRow value={rating} onChange={r => onRate(item._id, r)} />
            {rating === 0 && <div style={{ fontSize:'0.58rem', color:'rgba(201,168,76,0.7)', textAlign:'center', marginTop:2 }}>tap to rate</div>}
          </div>
        )}
      </div>

      {/* Unseen hover overlay */}
      {!isSeen && (
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.2s' }}
          className="movie-hover-overlay">
          <div style={{ background:'rgba(201,168,76,0.9)', borderRadius:'50%', width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' }}>✓</div>
        </div>
      )}

      {/* Seen checkmark */}
      {isSeen && (
        <div style={{ position:'absolute', top:8, right:8, width:22, height:22, borderRadius:'50%', background:'var(--gradient-gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:900, color:'#0a0805', boxShadow:'0 0 10px rgba(201,168,76,0.6)' }}>✓</div>
      )}
    </div>
  );
}

export default function OnboardingMovies() {
  const navigate = useNavigate();

  const [movies, setMovies]     = useState([]);
  const [states, setStates]     = useState({}); // {id: {seen,rating}}
  const [isLoading, setIsLoading]     = useState(false);
  const [isFetching, setIsFetching]   = useState(true);
  const [error, setError]             = useState('');

  useEffect(() => {
    const languages = JSON.parse(sessionStorage.getItem('ob_languages') || '[]').join(',');
    const genres    = JSON.parse(sessionStorage.getItem('ob_genres') || '[]').join(',');

    onboardingApi.getMovieSuggestions({ languages, genres, limit: 36 })
      .then(res => setMovies(res.data.media || []))
      .catch(() => setError('Could not load suggestions. Check your connection.'))
      .finally(() => setIsFetching(false));
  }, []);

  const toggleSeen  = (id) => setStates(prev => ({ ...prev, [id]: { seen: !prev[id]?.seen, rating: prev[id]?.rating || 0 } }));
  const setRating   = (id, r) => setStates(prev => ({ ...prev, [id]: { ...prev[id], rating: r } }));

  const seenItems   = Object.entries(states).filter(([, s]) => s.seen);
  const ratedCount  = seenItems.filter(([, s]) => s.rating > 0).length;

  const handleNext = async () => {
    setIsLoading(true);
    setError('');
    try {
      const ratings = seenItems.map(([id, s]) => ({
        mediaId: id,
        ...(s.rating > 0 ? { rating: s.rating } : { action: 'watched' }),
      }));
      await onboardingApi.saveRatings({ ratings });

      const watchedIds = seenItems.map(([id]) => id);
      sessionStorage.setItem('ob_watched_ids', JSON.stringify(watchedIds));
      navigate('/onboarding/actors');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save. Try again.');
    } finally { setIsLoading(false); }
  };

  const seenCount = seenItems.length;

  return (
    <OnboardingLayout
      step={3} totalSteps={5}
      title="Movies you might have watched"
      subtitle="Based on your languages & genres — tap a poster if you've seen it, then rate it"
      onBack={() => navigate('/onboarding/genres')}
      onNext={handleNext}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={seenCount > 0 ? `Continue with ${ratedCount} rating${ratedCount !== 1 ? 's' : ''} →` : 'Skip for now →'}
    >
      {/* Hover overlay CSS */}
      <style>{`.movie-hover-overlay:hover { opacity: 1 !important; }`}</style>

      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'var(--radius-md)', padding:'var(--space-3) var(--space-4)', marginBottom:'var(--space-5)', color:'#FCA5A5', fontSize:'0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats bar */}
      {seenCount > 0 && (
        <div style={{ display:'flex', gap:'var(--space-6)', padding:'var(--space-3) var(--space-4)', background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:'var(--radius-md)', marginBottom:'var(--space-5)', fontSize:'0.8rem' }}>
          <span><span style={{ color:'var(--gold)', fontWeight:700 }}>{seenCount}</span> <span style={{ color:'var(--text-muted)' }}>marked seen</span></span>
          <span><span style={{ color:'var(--gold)', fontWeight:700 }}>{ratedCount}</span> <span style={{ color:'var(--text-muted)' }}>rated</span></span>
          <span style={{ color:'var(--text-disabled)', marginLeft:'auto', fontSize:'0.72rem' }}>tap poster = seen · tap stars = rate</span>
        </div>
      )}

      {/* Hint when nothing selected */}
      {seenCount === 0 && !isFetching && (
        <div style={{ padding:'var(--space-3) var(--space-4)', background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'var(--radius-md)', marginBottom:'var(--space-5)', fontSize:'0.78rem', color:'var(--text-muted)', display:'flex', gap:8, alignItems:'center' }}>
          <span>💡</span>
          <span>Tap any poster you've seen — a ★ rating overlay will appear so you can rate it. You can skip this step.</span>
        </div>
      )}

      {/* Loading skeleton */}
      {isFetching && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:'var(--space-3)' }}>
          {[...Array(18)].map((_,i) => (
            <div key={i} style={{ aspectRatio:'2/3', borderRadius:'var(--radius-lg)', background:'var(--bg-card)', animation:'shimmer 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {/* Movie grid */}
      {!isFetching && movies.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:'var(--space-3)' }}>
          {movies.map(m => (
            <MovieCard
              key={m._id} item={m}
              state={states[m._id]}
              onToggleSeen={toggleSeen}
              onRate={setRating}
            />
          ))}
        </div>
      )}

      {!isFetching && movies.length === 0 && (
        <div style={{ textAlign:'center', padding:'var(--space-12)', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'var(--space-3)' }}>🎬</div>
          <div style={{ fontWeight:700, marginBottom:6 }}>No movies found yet</div>
          <div style={{ fontSize:'0.82rem' }}>The database may still be loading. You can skip this step.</div>
        </div>
      )}
    </OnboardingLayout>
  );
}
