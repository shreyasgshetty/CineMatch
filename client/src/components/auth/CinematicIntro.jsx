import React, { useEffect, useState } from 'react';

export default function CinematicIntro({ onComplete }) {
  const [stage, setStage] = useState('active'); // 'active' | 'fading' | 'done'

  useEffect(() => {
    // Check prefers-reduced-motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete();
      return;
    }

    // 3.4s start fading out stage, 3.8s complete
    const fadeTimer = setTimeout(() => setStage('fading'), 3200);
    const endTimer = setTimeout(() => {
      setStage('done');
      onComplete();
    }, 3800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setStage('done');
    onComplete();
  };

  if (stage === 'done') return null;

  return (
    <div
      className={`cinematic-studio-intro ${stage === 'fading' ? 'intro-fading' : ''}`}
      onClick={handleSkip}
    >
      {/* Top & Bottom Cinematic Letterbox Matte Bars */}
      <div className="letterbox-bar letterbox-top" />
      <div className="letterbox-bar letterbox-bottom" />

      {/* Central Projector Lens Flare Glow */}
      <div className="projector-lens-beam" />
      <div className="anamorphic-flare-line" />

      {/* Main Studio Title & Subtitle Block */}
      <div className="studio-brand-container">
        <div className="studio-pill-badge">
          <span>CINEMATCH ORIGINALS</span>
        </div>

        <h1 className="studio-logo-text">CINEMATCH</h1>

        <div className="studio-tagline-wrapper">
          <span className="tagline-line" />
          <p className="studio-tagline-text">EVERY GREAT STORY STARTS SOMEWHERE</p>
          <span className="tagline-line" />
        </div>
      </div>

      {/* Unobtrusive Skip Hint */}
      <div className="intro-skip-button">Click to skip</div>

      <style>{`
        .cinematic-studio-intro {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #040508;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          user-select: none;
          overflow: hidden;
          opacity: 1;
          transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .cinematic-studio-intro.intro-fading {
          opacity: 0;
          pointer-events: none;
        }

        /* Letterbox Bars */
        .letterbox-bar {
          position: absolute;
          left: 0;
          right: 0;
          height: 9vh;
          background: #000;
          z-index: 10;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .letterbox-top { top: 0; }
        .letterbox-bottom { bottom: 0; }

        /* Projector Radial Lens Aperture */
        .projector-lens-beam {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212, 168, 67, 0.2) 0%, rgba(212, 168, 67, 0.04) 45%, transparent 70%);
          animation: lensPulse 3.8s ease-in-out forwards;
          pointer-events: none;
        }

        /* Anamorphic Flare Line */
        .anamorphic-flare-line {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 235, 175, 0.85) 50%, transparent 100%);
          box-shadow: 0 0 24px #D4A843, 0 0 48px #EFC45A;
          transform: translateY(-50%) scaleX(0);
          animation: flareSweep 3.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          pointer-events: none;
        }

        /* Studio Brand Text Container */
        .studio-brand-container {
          position: relative;
          z-index: 5;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: titleZoom3D 3.8s cubic-bezier(0.1, 1, 0.1, 1) forwards;
        }

        .studio-pill-badge {
          display: inline-block;
          padding: 5px 16px;
          background: rgba(212, 168, 67, 0.1);
          border: 1px solid rgba(212, 168, 67, 0.3);
          border-radius: 100px;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.3em;
          color: var(--gold, #D4A843);
          margin-bottom: 14px;
          opacity: 0;
          animation: badgeFadeIn 1s ease 0.4s forwards;
        }

        .studio-logo-text {
          font-family: var(--font-display), 'Cinzel', serif;
          font-weight: 900;
          font-size: clamp(1.8rem, 6.5vw, 5rem);
          letter-spacing: 0.2em;
          color: #FFF;
          background: linear-gradient(135deg, #FFFFFF 0%, #F5E5BE 40%, #D4A843 75%, #F0C865 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 60px rgba(212, 168, 67, 0.35);
          margin-bottom: 12px;
          opacity: 0;
          animation: textReveal 1.2s ease 0.6s forwards;
        }

        .studio-tagline-wrapper {
          display: flex;
          align-items: center;
          gap: 16px;
          opacity: 0;
          animation: taglineFadeIn 1.2s ease 1.2s forwards;
        }

        .tagline-line {
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212, 168, 67, 0.6));
        }

        .tagline-line:last-child {
          background: linear-gradient(90deg, rgba(212, 168, 67, 0.6), transparent);
        }

        .studio-tagline-text {
          font-size: clamp(0.68rem, 1.4vw, 0.85rem);
          font-weight: 700;
          letter-spacing: 0.45em;
          color: rgba(212, 168, 67, 0.85);
          text-transform: uppercase;
        }

        .intro-skip-button {
          position: absolute;
          bottom: 28px;
          z-index: 15;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          transition: color 0.2s ease;
        }

        .intro-skip-button:hover {
          color: var(--gold, #D4A843);
        }

        /* Animation Keyframes */
        @keyframes lensPulse {
          0% { transform: scale(0.4); opacity: 0; }
          30% { transform: scale(1); opacity: 0.9; }
          80% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        @keyframes flareSweep {
          0% { transform: translateY(-50%) scaleX(0); opacity: 0; }
          25% { transform: translateY(-50%) scaleX(0.4); opacity: 1; }
          70% { transform: translateY(-50%) scaleX(1); opacity: 0.8; }
          100% { transform: translateY(-50%) scaleX(1.4); opacity: 0; }
        }

        @keyframes titleZoom3D {
          0% { transform: scale(0.92); }
          100% { transform: scale(1.06); }
        }

        @keyframes badgeFadeIn {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes textReveal {
          0% { opacity: 0; filter: blur(10px); }
          100% { opacity: 1; filter: blur(0px); }
        }

        @keyframes taglineFadeIn {
          0% { opacity: 0; letter-spacing: 0.15em; }
          100% { opacity: 1; letter-spacing: 0.35em; }
        }

        /* Mobile Screen Adjustments */
        @media (max-width: 600px) {
          .studio-brand-container {
            padding: 0 16px;
            max-width: 100vw;
          }

          .studio-logo-text {
            font-size: clamp(1.5rem, 6.8vw, 2.2rem);
            letter-spacing: 0.14em;
            margin-bottom: 8px;
          }

          .studio-tagline-text {
            font-size: 0.62rem;
            letter-spacing: 0.18em;
          }

          .tagline-line {
            width: 20px;
          }

          .studio-pill-badge {
            font-size: 0.58rem;
            letter-spacing: 0.2em;
            padding: 4px 10px;
          }

          .letterbox-bar {
            height: 6vh;
          }
        }
      `}</style>
    </div>
  );
}
