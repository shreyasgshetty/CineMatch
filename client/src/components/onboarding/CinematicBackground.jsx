import React from 'react';

const VARIANTS = {
  genres: {
    base: '#050608',
    glow1: 'radial-gradient(ellipse at 30% 20%, rgba(212,168,67,0.12) 0%, transparent 65%)',
    glow2: 'radial-gradient(ellipse at 70% 80%, rgba(122,24,37,0.08) 0%, transparent 65%)',
  },
  movies: {
    base: '#040507',
    glow1: 'radial-gradient(ellipse at 80% 20%, rgba(58,68,96,0.12) 0%, transparent 65%)',
    glow2: 'radial-gradient(ellipse at 20% 80%, rgba(212,168,67,0.08) 0%, transparent 65%)',
  },
  vibe: {
    base: '#060405',
    glow1: 'radial-gradient(ellipse at 50% 50%, rgba(122,24,37,0.12) 0%, transparent 65%)',
    glow2: 'radial-gradient(ellipse at 80% 80%, rgba(58,68,96,0.08) 0%, transparent 65%)',
  },
  languages: {
    base: '#040506',
    glow1: 'radial-gradient(ellipse at 50% 40%, rgba(212,168,67,0.1) 0%, transparent 65%)',
    glow2: 'radial-gradient(ellipse at 50% 80%, rgba(255,255,255,0.03) 0%, transparent 65%)',
  },
  actors: {
    base: '#050505',
    glow1: 'radial-gradient(ellipse at 50% -10%, rgba(212,168,67,0.14) 0%, transparent 65%)',
    glow2: 'radial-gradient(ellipse at 50% 110%, rgba(212,168,67,0.05) 0%, transparent 65%)',
  },
  directors: {
    base: '#030303',
    glow1: 'radial-gradient(ellipse at 20% 20%, rgba(122,24,37,0.1) 0%, transparent 65%)',
    glow2: 'radial-gradient(ellipse at 80% 80%, rgba(212,168,67,0.06) 0%, transparent 65%)',
  },
  default: {
    base: '#050608',
    glow1: 'radial-gradient(ellipse at 30% 20%, rgba(212,168,67,0.1) 0%, transparent 65%)',
    glow2: 'radial-gradient(ellipse at 70% 80%, rgba(58,68,96,0.08) 0%, transparent 65%)',
  }
};

export default function CinematicBackground({ variant = 'default', children }) {
  if (variant === 'languages') {
    return (
      <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'transparent', overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, pointerEvents: 'none' }}>
          {children}
        </div>
      </div>
    );
  }

  const theme = VARIANTS[variant] || VARIANTS.default;

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.base, overflow: 'hidden' }}>
      {/* Background Layers */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        
        {/* Cinematic Light 1 */}
        <div 
          className="cinematic-bg-layer"
          style={{ 
            position: 'absolute', inset: '-20%', 
            background: theme.glow1, 
            filter: 'blur(60px)',
            animation: 'cinematic-drift-1 25s ease-in-out infinite alternate' 
          }} 
        />
        
        {/* Cinematic Light 2 */}
        <div 
          className="cinematic-bg-layer"
          style={{ 
            position: 'absolute', inset: '-20%', 
            background: theme.glow2, 
            filter: 'blur(70px)',
            animation: 'cinematic-drift-2 30s ease-in-out infinite alternate'
          }} 
        />

        {/* Atmospheric Texture (Grain) */}
        <div 
          style={{
            position: 'absolute', inset: 0,
            opacity: 0.15,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            mixBlendMode: 'overlay',
          }}
        />

        {/* Vignette */}
        <div 
          style={{
            position: 'absolute', inset: 0,
            boxShadow: 'inset 0 0 150px rgba(0,0,0,0.9), inset 0 0 300px rgba(0,0,0,0.5)'
          }}
        />
      </div>

      {/* Content wrapper */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {children}
      </div>
    </div>
  );
}
