import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * AppLayout — Main authenticated layout
 *
 * Wraps all main app pages with:
 * - Top navigation bar
 * - Main content area
 * - Footer with TMDB attribution (required)
 */
export default function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────
function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        position: 'sticky', top: 0, zIndex: 'var(--z-nav)',
        background: scrolled
          ? 'rgba(10, 10, 15, 0.95)'
          : 'linear-gradient(180deg, rgba(10,10,15,0.9) 0%, transparent 100%)',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border-subtle)' : 'none',
        transition: 'all var(--transition-base)',
      }}
      id="main-navbar"
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: '64px', gap: 'var(--space-6)' }}>

        {/* Logo */}
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-brand)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-brand)', fontSize: '18px',
          }}>
            🎬
          </div>
          <span style={{
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Cine<span style={{ color: 'var(--color-brand-primary)' }}>Match</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div style={{ display: 'flex', gap: 'var(--space-1)', marginLeft: 'var(--space-4)' }} className="nav-links">
          {[
            { path: '/home', label: 'Home' },
            { path: '/recommendations', label: 'For You' },
            { path: '/search', label: 'Browse' },
          ].map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-md)',
                color: isActive(path) ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                background: isActive(path) ? 'rgba(232,87,42,0.1)' : 'transparent',
                fontWeight: isActive(path) ? 600 : 400,
                fontSize: 'var(--text-sm)', textDecoration: 'none',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={e => { if (!isActive(path)) e.currentTarget.style.color = 'var(--color-text-primary)'; }}
              onMouseLeave={e => { if (!isActive(path)) e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 320, margin: '0 auto' }}>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '12px', top: '50%',
              transform: 'translateY(-50%)', color: 'var(--color-text-muted)',
              pointerEvents: 'none', fontSize: '14px',
            }}>🔍</span>
            <input
              type="text"
              id="navbar-search"
              placeholder="Search movies, shows, actors…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px',
                fontSize: 'var(--text-sm)', height: '38px',
              }}
            />
          </div>
        </form>

        {/* User Menu */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            id="user-menu-trigger"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px 6px 8px',
              cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '12px', color: '#fff',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', transition: 'transform var(--transition-fast)', transform: menuOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border-default)',
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                boxShadow: 'var(--shadow-xl)', minWidth: 180,
                zIndex: 'var(--z-dropdown)',
              }}
              className="animate-fade-in-scale"
            >
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: 'var(--text-sm)', transition: 'background var(--transition-fast)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span>👤</span> Profile
              </Link>
              <div style={{ height: '1px', background: 'var(--color-border-subtle)' }} />
              <button
                id="logout-btn"
                onClick={() => { logout(); setMenuOpen(false); navigate('/login'); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'var(--text-sm)', textAlign: 'left', transition: 'background var(--transition-fast)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-overlay)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Footer ────────────────────────────────────────────────────
function AppFooter() {
  return (
    <footer style={{
      background: 'var(--color-bg-surface)',
      borderTop: '1px solid var(--color-border-subtle)',
      padding: 'var(--space-6) 0',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text-muted)' }}>
            🎬 CineMatch
          </span>
          <span style={{ color: 'var(--color-text-disabled)', fontSize: 'var(--text-xs)' }}>
            AI-Powered Recommendations
          </span>
        </div>

        {/* TMDB Attribution — Required by TMDB API Terms */}
        <div className="tmdb-attribution">
          <span>Powered by</span>
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)' }}
          >
            <img
              src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
              alt="TMDB Logo"
              style={{ height: 14 }}
            />
          </a>
          <span style={{ color: 'var(--color-text-disabled)' }}>· This product uses the TMDB API but is not endorsed or certified by TMDB.</span>
        </div>
      </div>
    </footer>
  );
}
