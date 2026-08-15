import React, { useEffect, useState, useMemo } from 'react';
import { mediaApi } from '../../services/api';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

const FALLBACK_POSTERS = [
  '/q6y0Go1tsGEsmtFryDO23R9x05Z.jpg',
  '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
  '/velwePhIrs6ftdd2A8tO8s6jYk5.jpg',
  '/pD6sL4vntU1ldQfeBwoMFiW9Zal.jpg',
  '/8r28YStGrmuLAkOFxDiWsZvD2u4.jpg',
  '/h8gWvRj696f8T631.jpg',
  '/qhb1qYGlZSexZefAStL02z9q2vB.jpg',
  '/8Gxv8gSFCU0XGDykEGvF8Z1hGKV.jpg',
  '/mY792vRmw12goFiZ95vGDvVML9s.jpg'
];

export default function RegisterPosterStream() {
  const [posters, setPosters] = useState([]);

  useEffect(() => {
    let isMounted = true;
    mediaApi.list({ limit: 45 })
      .then(res => {
        if (!isMounted) return;
        const media = res.data?.media || [];
        // Strictly filter movies with valid poster paths
        const valid = media
          .map(m => m.posterPath || m.posterUrl)
          .filter(path => typeof path === 'string' && path.trim().length > 0);

        if (valid.length >= 8) {
          setPosters(valid);
        } else {
          setPosters(FALLBACK_POSTERS);
        }
      })
      .catch(() => {
        if (isMounted) setPosters(FALLBACK_POSTERS);
      });

    return () => { isMounted = false; };
  }, []);

  const items = posters.length > 0 ? posters : FALLBACK_POSTERS;

  // Split posters into 2 distinct horizontal streams and duplicate for seamless looping
  const lane1 = useMemo(() => {
    const subset = items.slice(0, Math.ceil(items.length / 2));
    return [...subset, ...subset, ...subset];
  }, [items]);

  const lane2 = useMemo(() => {
    const subset = items.slice(Math.ceil(items.length / 2));
    return [...subset, ...subset, ...subset];
  }, [items]);

  const getPosterUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${TMDB_IMG}${path}`;
  };

  return (
    <div className="register-stream-container">
      {/* Warm Ambient Screen Lighting */}
      <div className="cinema-screen-glow" />

      {/* Lane 1: Scrolling Left to Right */}
      <div className="stream-lane lane-top">
        <div className="stream-track scroll-right">
          {lane1.map((path, idx) => {
            const imgUrl = getPosterUrl(path);
            if (!imgUrl) return null;
            return (
              <div key={`lane1-${idx}`} className="stream-poster-card">
                <img
                  src={imgUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="stream-poster-img"
                  onError={(e) => {
                    const card = e.target.closest('.stream-poster-card');
                    if (card) card.style.display = 'none';
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Lane 2: Scrolling Right to Left */}
      <div className="stream-lane lane-bottom">
        <div className="stream-track scroll-left">
          {lane2.map((path, idx) => {
            const imgUrl = getPosterUrl(path);
            if (!imgUrl) return null;
            return (
              <div key={`lane2-${idx}`} className="stream-poster-card card-mid">
                <img
                  src={imgUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="stream-poster-img"
                  onError={(e) => {
                    const card = e.target.closest('.stream-poster-card');
                    if (card) card.style.display = 'none';
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .register-stream-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 5vh 0;
          mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.85) 85%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 15%, rgba(0,0,0,0.85) 85%, transparent 100%);
        }

        .cinema-screen-glow {
          position: absolute;
          top: -20%;
          left: 10%;
          right: 10%;
          height: 60%;
          background: radial-gradient(ellipse at center top, rgba(212, 168, 67, 0.16) 0%, rgba(212, 168, 67, 0.04) 50%, transparent 80%);
          pointer-events: none;
        }

        .stream-lane {
          position: relative;
          width: 100%;
          overflow: hidden;
          opacity: 0.45;
        }

        .lane-top {
          transform: rotate(-1.5deg) scale(1.04);
        }

        .lane-bottom {
          transform: rotate(1.5deg) scale(1.04);
        }

        .stream-track {
          display: flex;
          align-items: center;
          gap: 16px;
          width: max-content;
          will-change: transform;
        }

        .scroll-right {
          animation: streamScrollRight 65s linear infinite;
        }

        .scroll-left {
          animation: streamScrollLeft 60s linear infinite;
        }

        .stream-poster-card {
          width: 130px;
          aspect-ratio: 2/3;
          border-radius: 10px;
          overflow: hidden;
          background: rgba(20, 24, 32, 0.7);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .stream-poster-card.card-mid {
          width: 115px;
          opacity: 0.85;
        }

        .stream-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: brightness(0.9) contrast(1.05);
        }

        @keyframes streamScrollRight {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0%); }
        }

        @keyframes streamScrollLeft {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }

        @media (max-width: 768px) {
          .register-stream-container {
            opacity: 0.25;
          }
          .stream-poster-card {
            width: 90px;
          }
          .stream-poster-card.card-mid {
            width: 80px;
          }
        }
      `}</style>
    </div>
  );
}
