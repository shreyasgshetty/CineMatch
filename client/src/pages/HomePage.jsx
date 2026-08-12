import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_CARDS = [
  {
    title: 'For You',
    desc: 'AI-generated personal picks based on your taste',
    link: '/recommendations',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    accent: 'var(--crimson-mid)',
    accentBg: 'rgba(158,32,48,0.10)',
  },
  {
    title: 'Browse',
    desc: 'Explore all movies and shows across every industry',
    link: '/search',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    accent: '#7da0f0',
    accentBg: 'rgba(99,130,210,0.10)',
  },
  {
    title: 'Profile',
    desc: 'Your preferences, ratings, and watch history',
    link: '/profile',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    accent: 'var(--gold)',
    accentBg: 'rgba(212,168,67,0.10)',
  },
];

const PHASES = [
  { done: true,  label: 'Project setup and structure' },
  { done: true,  label: 'TMDB ingestion — 23,000+ titles across 14 languages' },
  { done: true,  label: 'MongoDB models (User, Media, Interaction, Recommendation)' },
  { done: true,  label: 'Authentication (JWT + bcrypt)' },
  { done: true,  label: 'Language and industry onboarding UI' },
  { done: true,  label: 'Movie rating onboarding' },
  { done: true,  label: 'Genre, actor, director preferences' },
  { done: true,  label: 'Search & Browse page with filters and pagination' },
  { done: true,  label: 'Media detail page with cast, similar titles, user rating' },
  { done: true,  label: 'Recommendations page with match scores and reason tags' },
  { done: false, label: 'Python ML recommendation engine (TF-IDF / collaborative)' },
  { done: false, label: 'Profile page — history, ratings, preference editor' },
];

export default function HomePage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-10) 0 var(--space-16)', position: 'relative', overflow: 'hidden' }}>

      {/* Ambient background blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '45%', height: '45%', background: 'radial-gradient(ellipse,rgba(212,168,67,0.07) 0%,transparent 65%)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '40%', height: '40%', background: 'radial-gradient(ellipse,rgba(122,24,37,0.07) 0%,transparent 65%)', filter: 'blur(60px)' }} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="animate-fade-in">

          {/* ── Hero greeting ────────────────────────────────── */}
          <div style={{ marginBottom: 'var(--space-10)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', background: 'rgba(212,168,67,0.07)', border: '1px solid rgba(212,168,67,0.18)', borderRadius: 'var(--radius-full)', marginBottom: 'var(--space-4)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', boxShadow: '0 0 5px var(--gold)' }} />
              <span style={{ fontSize: '0.67rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>Dashboard</span>
            </div>

            <h1 style={{ marginBottom: 'var(--space-2)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(2rem,5vw,3rem)' }}>
              Welcome back, <span style={{ color: 'var(--gold)' }}>{firstName}</span>
            </h1>
            <p style={{ marginBottom: 0, color: 'var(--text-secondary)', maxWidth: 520, lineHeight: 1.7 }}>
              Your personalized CineMatch dashboard is coming in the next phase.
              Onboarding is complete — your preference vector is saved.
            </p>
          </div>

          {/* ── Navigation cards ─────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-12)' }}>
            {NAV_CARDS.map(item => (
              <NavCard key={item.link} item={item} />
            ))}
          </div>

          {/* ── Phase status ─────────────────────────────────── */}
          <div>
            {/* Divider header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(212,168,67,0.35),transparent)' }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)' }}>Build Status</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(270deg,rgba(212,168,67,0.35),transparent)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 'var(--space-2)' }}>
              {PHASES.map((phase, i) => (
                <PhaseRow key={i} phase={phase} index={i} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function NavCard({ item }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Link to={item.link} style={{ textDecoration: 'none' }}>
      <div
        style={{
          padding: 'var(--space-6)',
          background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
          border: `1px solid ${hovered ? 'var(--border-gold)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--radius-xl)',
          transition: 'all var(--t-base)',
          transform: hovered ? 'translateY(-4px)' : 'none',
          boxShadow: hovered ? 'var(--shadow-lg)' : 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {/* Icon */}
        <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-lg)', background: item.accentBg, border: `1px solid ${item.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)', color: item.accent, transition: 'transform var(--t-base)' }}>
          {item.icon}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 'var(--space-2)', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {item.title}
        </div>
        <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {item.desc}
        </div>
        {/* Arrow */}
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 6, color: item.accent, fontSize: '0.78rem', fontWeight: 600 }}>
          <span>Open</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </div>
    </Link>
  );
}

function PhaseRow({ phase, index }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', transition: 'background var(--t-fast)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.035)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
    >
      <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1, background: phase.done ? 'var(--gradient-gold)' : 'var(--bg-elevated)', border: `1.5px solid ${phase.done ? 'var(--gold)' : 'var(--border-default)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {phase.done ? (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0d0a02" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-disabled)' }} />
        )}
      </div>
      <div>
        <span style={{ fontSize: '0.75rem', fontWeight: 500, letterSpacing: '0.02em', color: phase.done ? 'var(--text-secondary)' : 'var(--text-disabled)' }}>
          Phase {index + 1}
        </span>
        <div style={{ fontSize: '0.82rem', color: phase.done ? 'var(--text-primary)' : 'var(--text-muted)', marginTop: 1 }}>
          {phase.label}
        </div>
      </div>
    </div>
  );
}
