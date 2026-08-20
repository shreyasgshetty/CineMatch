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

  useEffect(() => { setMobileMenuOpen(false); setMenuOpen(false); }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const isActive = (path) => location.pathname === path;
  const navLinks = [
    { path: '/home', label: 'Home' },
    { path: '/recommendations', label: 'For You' },
    { path: '/search', label: 'Browse' },
    { path: '/planner', label: 'Planner' },
  ];

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 'var(--z-nav)',
        background: scrolled ? 'rgba(13,15,20,0.97)' : 'rgba(13,15,20,0.82)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'var(--border-default)' : 'var(--border-subtle)'}`,
        transition: 'all var(--t-base)',
        boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,0.45)' : 'none',
      }} id="main-navbar">
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 62, gap: 'var(--space-5)' }}>

          {/* Logo */}
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-gold)', flexShrink: 0 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#0d0a02">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.12rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
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
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                id="navbar-search"
                type="text"
                placeholder="Search films, actors…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 32, paddingTop: 7, paddingBottom: 7, fontSize: '0.84rem', height: 36 }}
              />
            </div>
          </form>

          {/* User Menu */}
          <div style={{ position: 'relative', flexShrink: 0, marginLeft: 'auto' }}>
            <button id="user-menu-trigger" onClick={() => setMenuOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: menuOpen ? 'rgba(212,168,67,0.10)' : 'rgba(212,168,67,0.05)',
              border: `1px solid ${menuOpen ? 'var(--border-gold)' : 'var(--border-default)'}`,
              borderRadius: 'var(--radius-full)',
              padding: '5px 12px 5px 5px',
              cursor: 'pointer', transition: 'all var(--t-fast)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.background = 'rgba(212,168,67,0.09)'; }}
              onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'rgba(212,168,67,0.05)'; } }}
            >
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.75rem', color: '#0d0a02' }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="3" strokeLinecap="round" style={{ transition: 'transform var(--t-fast)', transform: menuOpen ? 'rotate(180deg)' : 'none' }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {menuOpen && (
              <div className="animate-fade-in-scale" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', minWidth: 180, zIndex: 'var(--z-modal)' }}>
                {[{ label: 'Profile', to: '/profile', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }].map(item => (
                  <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.875rem', transition: 'background var(--t-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-overlay)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
                <div style={{ height: 1, background: 'var(--border-subtle)' }} />
                <button id="logout-btn" onClick={() => { logout(); setMenuOpen(false); navigate('/login'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: '#FCA5A5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', textAlign: 'left', transition: 'background var(--t-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button className="mobile-hamburger" onClick={() => setMobileMenuOpen(o => !o)} style={{ display: 'none', background: 'none', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '7px 9px', color: 'var(--text-primary)', cursor: 'pointer', transition: 'all var(--t-fast)' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
          >
            {mobileMenuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="animate-fade-in" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', padding: 'var(--space-4)' }}>
            {navLinks.map(({ path, label }) => (
              <Link key={path} to={path} style={{ display: 'block', padding: 'var(--space-3) var(--space-4)', color: isActive(path) ? 'var(--gold)' : 'var(--text-secondary)', textDecoration: 'none', fontWeight: isActive(path) ? 600 : 400, borderRadius: 'var(--radius-md)', background: isActive(path) ? 'rgba(212,168,67,0.07)' : 'transparent', marginBottom: 'var(--space-1)', transition: 'all var(--t-fast)' }}>
                {label}
              </Link>
            ))}
            <form onSubmit={handleSearch} style={{ marginTop: 'var(--space-3)' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input type="text" placeholder="Search films…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)} className="form-input"
                  style={{ fontSize: '0.875rem', paddingLeft: 32 }} />
              </div>
            </form>
            <div style={{ height: 1, background: 'var(--border-subtle)', margin: 'var(--space-3) 0' }} />
            <button onClick={() => { logout(); navigate('/login'); }} style={{ width: '100%', textAlign: 'left', padding: 'var(--space-3) var(--space-4)', color: '#FCA5A5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', borderRadius: 'var(--radius-md)' }}>
              Sign Out
            </button>
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
    <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', padding: 'var(--space-6) 0' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#0d0a02">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Cine<span style={{ color: 'var(--gold)' }}>Match</span>
          </span>
          <span style={{ color: 'var(--text-disabled)', fontSize: '0.7rem' }}>AI-Powered Recommendations</span>
        </div>
        <div className="tmdb-attribution">
          <span>Powered by</span>
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">
            <img src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
              alt="TMDB" style={{ height: 13, opacity: 0.65 }} />
          </a>
          <span style={{ color: 'var(--text-disabled)' }}>· Not endorsed by TMDB.</span>
        </div>
      </div>
    </footer>
  );
}
