import React, { useEffect, useState, useMemo } from 'react';
import { mediaApi } from '../../services/api';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

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
  '/mY792vRmw12goFiZ95vGDvVML9s.jpg',
  '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  '/jRXYjXNEKWStZ2vL8pKVoxeaYYS.jpg'
];

export default function FullPosterUniverse({ formProgress = 0 }) {
  const [posters, setPosters] = useState([]);

  useEffect(() => {
    let isMounted = true;
    mediaApi.list({ limit: 45 })
      .then(res => {
        if (!isMounted) return;
        const media = res.data?.media || [];
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

  // Generate 5 distinct poster lanes spanning the full screen
  const lanes = useMemo(() => {
    const split = Math.ceil(items.length / 5);
    const l1 = items.slice(0, split);
    const l2 = items.slice(split, split * 2);
    const l3 = items.slice(split * 2, split * 3);
    const l4 = items.slice(split * 3, split * 4);
    const l5 = items.slice(split * 4);

    return [
      { id: 1, items: [...l1, ...l1, ...l1], class: 'lane-back-1', speed: '90s', dir: 'right' },
      { id: 2, items: [...l2, ...l2, ...l2], class: 'lane-mid-1', speed: '70s', dir: 'left' },
      { id: 3, items: [...l3, ...l3, ...l3], class: 'lane-back-2', speed: '85s', dir: 'right' },
      { id: 4, items: [...l4, ...l4, ...l4], class: 'lane-front-1', speed: '60s', dir: 'left' },
      { id: 5, items: [...l5, ...l5, ...l5], class: 'lane-mid-2', speed: '75s', dir: 'right' }
    ];
  }, [items]);

  const getPosterUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${TMDB_IMG}${path}`;
  };

  // Glow intensifies as user completes registration fields
  const glowOpacity = 0.12 + (formProgress * 0.14);

  return (
    <div className="full-universe-container">
      {/* Dynamic Center Radial Glow (Responds to Form Completion) */}
      <div
        className="universe-center-glow"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(212, 168, 67, ${glowOpacity}) 0%, rgba(212, 168, 67, 0.03) 50%, transparent 80%)`
        }}
      />

      {/* 5 Full Viewport Diagonal Poster Lanes */}
      <div className="universe-lanes-stage">
        {lanes.map((lane) => (
          <div key={lane.id} className={`universe-lane ${lane.class}`}>
            <div className={`lane-track scroll-${lane.dir}`} style={{ animationDuration: lane.speed }}>
              {lane.items.map((path, idx) => {
                const imgUrl = getPosterUrl(path);
                if (!imgUrl) return null;

                return (
                  <div key={`${lane.id}-${idx}`} className="universe-poster-card">
                    <img
                      src={imgUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="universe-poster-img"
                      onError={(e) => {
                        const card = e.target.closest('.universe-poster-card');
                        if (card) card.style.display = 'none';
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Central Vignette Focus Zone */}
      <div className="universe-vignette-mask" />

      <style>{`
        .full-universe-container {
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          background: #06080e;
        }

        .universe-center-glow {
          position: absolute;
          inset: 0;
          z-index: 1;
          transition: background 0.6s ease;
        }

        .universe-lanes-stage {
          position: absolute;
          inset: -150px -100px;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          transform: rotate(-6deg) scale(1.08);
          z-index: 0;
        }

        .universe-lane {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        /* Depth Layers & Sizes */
        .lane-back-1, .lane-back-2 {
          opacity: 0.35;
          filter: blur(2px) brightness(0.7);
        }
        .lane-back-1 .universe-poster-card, .lane-back-2 .universe-poster-card {
          width: 150px;
        }

        .lane-mid-1, .lane-mid-2 {
          opacity: 0.58;
          filter: blur(0.5px) brightness(0.85);
        }
        .lane-mid-1 .universe-poster-card, .lane-mid-2 .universe-poster-card {
          width: 190px;
        }

        .lane-front-1 {
          opacity: 0.8;
          filter: blur(0px) brightness(0.95);
        }
        .lane-front-1 .universe-poster-card {
          width: 240px;
        }

        .lane-track {
          display: flex;
          align-items: center;
          gap: 24px;
          width: max-content;
          will-change: transform;
        }

        .scroll-right {
          animation: laneScrollRight linear infinite;
        }

        .scroll-left {
          animation: laneScrollLeft linear infinite;
        }

        .universe-poster-card {
          aspect-ratio: 2/3;
          border-radius: 14px;
          overflow: hidden;
          background: rgba(18, 22, 30, 0.8);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .universe-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Central Vignette Focus Zone Mask */
        .universe-vignette-mask {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: radial-gradient(
            circle at 50% 50%,
            rgba(6, 8, 14, 0.6) 0%,
            rgba(6, 8, 14, 0.85) 55%,
            rgba(6, 8, 14, 0.96) 100%
          );
        }

        @keyframes laneScrollRight {
          0% { transform: translateX(-33.333%); }
          100% { transform: translateX(0%); }
        }

        @keyframes laneScrollLeft {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333%); }
        }

        @media (max-width: 992px) {
          .universe-lanes-stage {
            transform: rotate(-3deg) scale(1.04);
          }
          .lane-front-1 .universe-poster-card {
            width: 170px;
          }
          .lane-mid-1 .universe-poster-card {
            width: 140px;
          }
        }
      `}</style>
    </div>
  );
}
