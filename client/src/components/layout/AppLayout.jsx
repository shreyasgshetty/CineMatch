import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const isActive = (path) => location.pathname === path;
  const navLinks = [
    { path: '/home', label: 'Home' },
    { path: '/recommendations', label: 'For You' },
    { path: '/search', label: 'Browse' },
  ];

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 'var(--z-nav)',
        background: scrolled ? 'rgba(5,8,15,0.97)' : 'rgba(5,8,15,0.80)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'var(--border-default)' : 'var(--border-subtle)'}`,
        transition: 'all var(--t-base)',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.5)' : 'none',
      }} id="main-navbar">
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 60, gap: 'var(--space-6)' }}>

          {/* Logo */}
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'var(--gradient-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, boxShadow: 'var(--shadow-gold)',
            }}>🎬</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Cine<span style={{ color: 'var(--gold)' }}>Match</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="desktop-nav" style={{ display: 'flex', gap: 2 }}>
            {navLinks.map(({ path, label }) => (
              <Link key={path} to={path} className={`nav-link ${isActive(path) ? 'active' : ''}`}>
                {label}
              </Link>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="nav-search" style={{ flex: 1, maxWidth: 300 }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13, pointerEvents: 'none' }}>🔍</span>
              <input
                id="navbar-search"
                type="text"
                placeholder="Search films, actors…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 34, paddingTop: 7, paddingBottom: 7, fontSize: '0.85rem', height: 36 }}
              />
            </div>
          </form>

          {/* User Menu */}
          <div style={{ position: 'relative', flexShrink: 0, marginLeft: 'auto' }}>
            <button id="user-menu-trigger" onClick={() => setMenuOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-full)',
              padding: '5px 12px 5px 6px',
              cursor: 'pointer', transition: 'all var(--t-fast)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.background = 'rgba(201,168,76,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'rgba(201,168,76,0.06)'; }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--gradient-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.75rem', color: '#0a0805',
              }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: '0.825rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-fast)' }}>▼</span>
            </button>

            {menuOpen && (
              <div className="animate-fade-in-scale" style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)', minWidth: 180, zIndex: 'var(--z-modal)',
              }}>
                {[{ label: '👤 Profile', to: '/profile' }].map(item => (
                  <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} style={{
                    display: 'flex', alignItems: 'center', padding: '11px 16px',
                    color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.875rem',
                    transition: 'background var(--t-fast)',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-overlay)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >{item.label}</Link>
                ))}
                <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                <button id="logout-btn" onClick={() => { logout(); setMenuOpen(false); navigate('/login'); }} style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  padding: '11px 16px', color: '#FCA5A5',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.875rem', textAlign: 'left', transition: 'background var(--t-fast)',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >🚪 Sign Out</button>
              </div>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button className="mobile-hamburger" onClick={() => setMobileMenuOpen(o => !o)} style={{
            display: 'none', background: 'none', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', padding: 8, color: 'var(--text-primary)', cursor: 'pointer',
          }}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="animate-fade-in" style={{
            background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)',
            padding: 'var(--space-4) var(--space-4)',
          }}>
            {navLinks.map(({ path, label }) => (
              <Link key={path} to={path} style={{
                display: 'block', padding: 'var(--space-3) var(--space-4)',
                color: isActive(path) ? 'var(--gold)' : 'var(--text-secondary)',
                textDecoration: 'none', fontWeight: isActive(path) ? 600 : 400,
                borderRadius: 'var(--radius-md)',
                background: isActive(path) ? 'rgba(201,168,76,0.08)' : 'transparent',
                marginBottom: 'var(--space-1)',
              }}>{label}</Link>
            ))}
            <form onSubmit={handleSearch} style={{ marginTop: 'var(--space-3)' }}>
              <input type="text" placeholder="Search films…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} className="form-input"
                style={{ fontSize: '0.875rem' }} />
            </form>
          </div>
        )}
      </nav>

      {/* Click outside to close menus */}
      {(menuOpen || mobileMenuOpen) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 'calc(var(--z-nav) - 1)' }}
          onClick={() => { setMenuOpen(false); setMobileMenuOpen(false); }} />
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .nav-search   { display: none !important; }
          .mobile-hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}

function AppFooter() {
  return (
    <footer style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-subtle)',
      padding: 'var(--space-6) 0',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            🎬 Cine<span style={{ color: 'var(--gold)' }}>Match</span>
          </span>
          <span style={{ color: 'var(--text-disabled)', fontSize: '0.72rem' }}>AI-Powered Recommendations</span>
        </div>
        <div className="tmdb-attribution">
          <span>Powered by</span>
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
            <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
              alt="TMDB" style={{ height: 13, opacity: 0.7 }} />
          </a>
          <span style={{ color: 'var(--text-disabled)' }}>· Not endorsed by TMDB.</span>
        </div>
      </div>
    </footer>
  );
}
