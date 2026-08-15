import React, { useEffect, useState } from 'react';
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

export default function FilmStrip() {
  const [validPosters, setValidPosters] = useState([]);

  useEffect(() => {
    let isMounted = true;
    mediaApi.list({ limit: 30 })
      .then(res => {
        if (!isMounted) return;
        const media = res.data?.media || [];
        // Strictly filter items that actually have a poster path string
        const valid = media
          .map(m => m.posterPath || m.posterUrl)
          .filter(path => typeof path === 'string' && path.trim().length > 0);

        if (valid.length >= 6) {
          setValidPosters(valid.slice(0, 16));
        } else {
          setValidPosters(FALLBACK_POSTERS);
        }
      })
      .catch(() => {
        if (isMounted) setValidPosters(FALLBACK_POSTERS);
      });

    return () => { isMounted = false; };
  }, []);

  const postersToUse = validPosters.length > 0 ? validPosters : FALLBACK_POSTERS;
  // Duplicate valid posters for continuous infinite scrolling track
  const scrollingPosters = [...postersToUse, ...postersToUse];

  const getPosterUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${TMDB_IMG}${path}`;
  };

  return (
    <div className="filmstrip-subtle-container">
      <div className="filmstrip-sprockets" />

      <div className="filmstrip-track">
        {scrollingPosters.map((path, idx) => {
          const imgUrl = getPosterUrl(path);
          if (!imgUrl) return null;

          return (
            <div key={idx} className="filmstrip-frame">
              <img
                src={imgUrl}
                alt=""
                loading="lazy"
                decoding="async"
                className="filmstrip-img"
                onError={(e) => {
                  const frame = e.target.closest('.filmstrip-frame');
                  if (frame) frame.style.display = 'none';
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="filmstrip-sprockets" />

      <style>{`
        .filmstrip-subtle-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 46px;
          background: rgba(8, 10, 14, 0.7);
          border-top: 1px solid rgba(212, 168, 67, 0.15);
          backdrop-filter: blur(8px);
          overflow: hidden;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          opacity: 0.65;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }

        .filmstrip-sprockets {
          height: 5px;
          width: 100%;
          background-image: radial-gradient(circle, rgba(212, 168, 67, 0.3) 1.5px, transparent 1.5px);
          background-size: 12px 5px;
          opacity: 0.5;
        }

        .filmstrip-track {
          display: flex;
          align-items: center;
          gap: 8px;
          width: max-content;
          animation: scrollFilmStrip 50s linear infinite;
          will-change: transform;
        }

        .filmstrip-frame {
          height: 32px;
          width: 23px;
          background: #111;
          border: 1px solid rgba(212, 168, 67, 0.25);
          border-radius: 3px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .filmstrip-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        @keyframes scrollFilmStrip {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          .filmstrip-subtle-container {
            height: 36px;
            opacity: 0.45;
          }
          .filmstrip-frame {
            height: 24px;
            width: 17px;
          }
        }
      `}</style>
    </div>
  );
}
