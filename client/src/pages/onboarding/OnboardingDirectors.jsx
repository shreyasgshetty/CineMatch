import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

const TMDB_FACE = 'https://image.tmdb.org/t/p/w185';

function DirectorCard({ person, selected, onToggle }) {
  return (
    <button
      id={`director-${person.tmdbId}`}
      type="button"
      onClick={() => onToggle(person.tmdbId)}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'center', width: '100%' }}
    >
      <div style={{ position: 'relative', transition: 'transform 0.18s', transform: selected ? 'scale(1.04)' : 'scale(1)' }}>
        <div style={{
          width: '100%', aspectRatio: '1', borderRadius: '50%', overflow: 'hidden',
          background: 'var(--bg-overlay)', maxWidth: 100, margin: '0 auto',
          border: selected ? '3px solid var(--gold)' : '3px solid var(--border-subtle)',
          boxShadow: selected ? '0 0 20px rgba(201,168,76,0.4)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}>
          {person.profilePath ? (
            <img src={`${TMDB_FACE}${person.profilePath}`} alt={person.name}
              style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', background:'var(--bg-elevated)' }}>🎬</div>
          )}
        </div>
        {selected && (
          <div style={{ position:'absolute', bottom:4, right:'50%', transform:'translateX(50%)', width:22, height:22, borderRadius:'50%', background:'var(--gradient-gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.6rem', color:'#0a0805', fontWeight:900, boxShadow:'0 0 8px rgba(201,168,76,0.6)' }}>🎬</div>
        )}
      </div>
      <div style={{ marginTop:'var(--space-2)', fontWeight:700, fontSize:'0.78rem', color: selected ? 'var(--gold)' : 'var(--text-primary)', lineHeight:1.2, transition:'color 0.15s' }}>{person.name}</div>
      {person.knownFor && (
        <div style={{ fontSize:'0.62rem', color:'var(--text-disabled)', marginTop:2, lineHeight:1.3 }}>{person.knownFor}</div>
      )}
    </button>
  );
}

export default function OnboardingDirectors() {
  const navigate     = useNavigate();
  const { updateUser } = useAuth();

  const [people, setPeople]         = useState([]);
  const [selected, setSelected]     = useState(new Set());
  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    const mediaIds  = JSON.parse(sessionStorage.getItem('ob_watched_ids') || '[]').join(',');
    const languages = JSON.parse(sessionStorage.getItem('ob_languages') || '[]').join(',');
    onboardingApi.getPeopleSuggestions({ mediaIds, languages, role: 'director', limit: 30 })
      .then(res => setPeople(res.data.people || []))
      .catch(() => setError('Could not load director suggestions.'))
      .finally(() => setIsFetching(false));
  }, []);

  const toggle = (tmdbId) => setSelected(prev => {
    const next = new Set(prev);
    next.has(tmdbId) ? next.delete(tmdbId) : next.add(tmdbId);
    return next;
  });

  const handleFinish = async () => {
    setIsLoading(true);
    setError('');
    try {
      const directors = people
        .filter(p => selected.has(p.tmdbId))
        .map(p => ({ tmdbId: p.tmdbId, name: p.name, preference: 'like' }));
      const res = await onboardingApi.saveDirectors({ directors });
      if (res.data.user) updateUser(res.data.user);

      // Clear sessionStorage onboarding context
      ['ob_languages','ob_genres','ob_watched_ids'].forEach(k => sessionStorage.removeItem(k));

      setSuccess(true);
      setTimeout(() => navigate('/home'), 1600);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete onboarding.');
    } finally { setIsLoading(false); }
  };

  if (success) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg-void)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'var(--space-5)', padding:'var(--space-8)', textAlign:'center', position:'relative' }}>
        <div style={{ position:'fixed', inset:0, pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:'20%', left:'20%', width:'60%', height:'60%', background:'radial-gradient(ellipse,rgba(201,168,76,0.2) 0%,transparent 65%)', filter:'blur(80px)' }} />
        </div>
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:'4rem', marginBottom:'var(--space-4)' }}>🎬</div>
          <h1 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(1.8rem,5vw,2.8rem)', color:'var(--gold)', marginBottom:'var(--space-3)' }}>Your CineMatch is ready!</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'1.05rem', maxWidth:380, margin:'0 auto' }}>Taking you to your personalised recommendations…</p>
          <div style={{ marginTop:'var(--space-8)', display:'flex', gap:8, justifyContent:'center' }}>
            {[...Array(5)].map((_,i) => (
              <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'var(--gold)', opacity:0.2+i*0.2, animation:`pulse 1.2s ease-in-out ${i*0.15}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selCount = selected.size;

  return (
    <OnboardingLayout
      step={5} totalSteps={5}
      title="Directors you admire"
      subtitle="These filmmakers made the movies you've watched — select the ones whose style you love"
      onBack={() => navigate('/onboarding/actors')}
      onNext={handleFinish}
      isLoading={isLoading}
      canProceed={true}
      nextLabel={selCount > 0 ? `🎬 Finish setup (${selCount} director${selCount > 1 ? 's' : ''})` : '🎬 Finish setup'}
    >
      {error && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:'var(--radius-md)', padding:'var(--space-3) var(--space-4)', marginBottom:'var(--space-5)', color:'#FCA5A5', fontSize:'0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Profile summary */}
      <div style={{ background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:'var(--radius-lg)', padding:'var(--space-4)', marginBottom:'var(--space-6)', display:'flex', flexWrap:'wrap', gap:'var(--space-4)' }}>
        <div style={{ fontSize:'0.7rem', fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--gold)', width:'100%', marginBottom:4 }}>🎯 Your taste profile</div>
        {[['🌐','Languages picked'],['🎭','Genres set'],['⭐','Movies rated'],['🎭','Actors selected'],['🎬','Directors — this step']].map(([icon,label],i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', color: i < 4 ? 'var(--text-secondary)' : 'var(--gold)', fontWeight: i === 4 ? 700 : 400 }}>
            <span style={{ color: i < 4 ? 'var(--gold)' : 'var(--gold)' }}>{i < 4 ? '✓' : '●'}</span> {icon} {label}
          </div>
        ))}
      </div>

      {selCount > 0 && (
        <div style={{ padding:'var(--space-2) var(--space-4)', background:'rgba(201,168,76,0.05)', border:'1px solid rgba(201,168,76,0.15)', borderRadius:'var(--radius-md)', marginBottom:'var(--space-5)', fontSize:'0.8rem', color:'var(--gold)', fontWeight:600 }}>
          🎬 {selCount} director{selCount > 1 ? 's' : ''} selected
        </div>
      )}

      {isFetching && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:'var(--space-5)' }}>
          {[...Array(12)].map((_,i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              <div style={{ width:80, height:80, borderRadius:'50%', background:'var(--bg-card)', animation:'shimmer 1.5s ease-in-out infinite' }} />
              <div style={{ width:60, height:10, borderRadius:4, background:'var(--bg-card)' }} />
            </div>
          ))}
        </div>
      )}

      {!isFetching && people.length === 0 && (
        <div style={{ textAlign:'center', padding:'var(--space-10)', color:'var(--text-muted)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'var(--space-3)' }}>🎬</div>
          <div style={{ fontWeight:700, marginBottom:6 }}>No directors extracted yet</div>
          <div style={{ fontSize:'0.82rem' }}>Try going back and marking more movies as seen. You can also skip this step.</div>
        </div>
      )}

      {!isFetching && people.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:'var(--space-5)' }}>
          {people.map(p => (
            <DirectorCard key={p.tmdbId} person={p} selected={selected.has(p.tmdbId)} onToggle={toggle} />
          ))}
        </div>
      )}
    </OnboardingLayout>
  );
}
