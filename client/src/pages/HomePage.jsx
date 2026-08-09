/**
 * HomePage — /home
 *
 * The main dashboard after onboarding. Shows:
 * - Personalized recommendations ("For You")
 * - Because You Liked... sections
 * - Continue Exploring (language-based)
 * - Top Picks (popular + rating match)
 *
 * Full implementation in Phase 10.
 * This placeholder ensures routing works in Phase 1.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) 0' }}>
      <div className="container">
        <div className="animate-fade-in">
          <h1 style={{ marginBottom: 'var(--space-2)' }}>
            Welcome back, <span style={{ color: 'var(--color-brand-primary)' }}>{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ marginBottom: 'var(--space-8)' }}>
            Your personalized CineMatch dashboard is being built in Phase 10.
            Onboarding is complete — your preference vector is saved!
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            {[
              { emoji: '🎯', title: 'For You', desc: 'AI-generated personal picks', link: '/recommendations' },
              { emoji: '🔍', title: 'Browse', desc: 'Explore all movies & shows', link: '/search' },
              { emoji: '👤', title: 'Profile', desc: 'Your preferences & history', link: '/profile' },
            ].map(item => (
              <Link key={item.link} to={item.link} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>{item.emoji}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    {item.desc}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 'var(--space-8)', padding: 'var(--space-6)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-subtle)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)' }}>🚧 Phase Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[
                '✅ Phase 1: Project setup & structure',
                '✅ Phase 2: TMDB ingestion script ready',
                '✅ Phase 3: MongoDB models (User, Media, Interaction, Recommendation)',
                '✅ Phase 4: Authentication (JWT + bcrypt)',
                '⏳ Phase 5: Language/industry onboarding UI',
                '⏳ Phase 6: Movie rating onboarding',
                '⏳ Phase 7: Genre/actor/director preferences',
                '⏳ Phase 8: Python ML recommendation engine',
              ].map((phase, i) => (
                <div key={i} style={{ fontSize: 'var(--text-sm)', color: phase.startsWith('✅') ? 'var(--color-success)' : 'var(--color-text-muted)', padding: 'var(--space-2) var(--space-3)', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)' }}>
                  {phase}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
