import React, { useEffect, useState, useMemo } from 'react';
import { mediaApi } from '../../services/api';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

// Fallback high quality movie poster paths if database is initializing
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
  '/7WsyChLLEzcqIFv23G5tWvT1dO.jpg',
  '/iu16S6942z6127ZefAStL02z9q2vB.jpg',
  '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
  '/rC24cKZGIBxSpvYoxt5NNC3W9xZ.jpg',
  '/62HCiowqzUt8d0rcGjOPmDLSuTq.jpg',
  '/a2oE21pU2oBvG524V3C23a.jpg'
];

export default function PosterWall() {
  const [posters, setPosters] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    mediaApi.list({ limit: 60 })
      .then(res => {
        if (!isMounted) return;
        const media = res.data?.media || [];
        const validPosters = media
          .map(m => m.posterPath || m.posterUrl)
          .filter(Boolean);

        if (validPosters.length >= 10) {
          setPosters(validPosters);
        } else if (validPosters.length > 0) {
          // Combine fetched with fallback to ensure rich grid
          setPosters([...validPosters, ...FALLBACK_POSTERS]);
        } else {
          setPosters(FALLBACK_POSTERS);
        }
        setLoaded(true);
      })
      .catch(() => {
        if (isMounted) {
          setPosters(FALLBACK_POSTERS);
          setLoaded(true);
        }
      });

    return () => { isMounted = false; };
  }, []);

  // Split posters into 6 columns for dense grid layout
  const columns = useMemo(() => {
    const list = posters.length > 0 ? posters : FALLBACK_POSTERS;
    const numCols = 6;
    const cols = Array.from({ length: numCols }, () => []);

    list.forEach((poster, idx) => {
      cols[idx % numCols].push(poster);
    });

    // Ensure each column has enough posters and duplicate for seamless infinite loop
    return cols.map(col => {
      let fullCol = col;
      while (fullCol.length < 8) {
        fullCol = [...fullCol, ...col];
      }
      return [...fullCol, ...fullCol];
    });
  }, [posters]);

  const getPosterUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${TMDB_IMG}${path}`;
  };

  const durations = ['42s', '52s', '36s', '48s', '40s', '54s'];

  return (
    <div className="poster-wall-container" style={{ opacity: loaded ? 1 : 0, transition: 'opacity 1s ease-out' }}>
      <div className="poster-wall-grid">
        {columns.map((colPosters, colIdx) => {
          const isUp = colIdx % 2 === 0;
          return (
            <div key={colIdx} className={`poster-col ${colIdx >= 4 ? 'col-desktop-only' : colIdx >= 3 ? 'col-tablet-hide' : ''}`}>
              <div
                className="poster-col-track"
                style={{
                  animation: `${isUp ? 'scrollPosterUp' : 'scrollPosterDown'} ${durations[colIdx]} linear infinite`
                }}
              >
                {colPosters.map((path, idx) => (
                  <div key={`${colIdx}-${idx}`} className="poster-card-wrapper">
                    <img
                      src={getPosterUrl(path)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="poster-card-img"
                      onError={(e) => {
                        e.target.style.opacity = '0';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .poster-wall-container {
          position: absolute;
          inset: -40px;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .poster-wall-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
          width: 100%;
          height: 100%;
          transform: rotate(-2.5deg) scale(1.06);
        }

        .poster-col {
          position: relative;
          height: 100%;
          overflow: hidden;
        }

        .poster-col-track {
          display: flex;
          flex-direction: column;
          gap: 16px;
          will-change: transform;
        }

        .poster-card-wrapper {
          width: 100%;
          aspect-ratio: 2/3;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(22, 25, 33, 0.7);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: transform 0.3s ease;
        }

        .poster-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: brightness(0.85) contrast(1.08);
        }

        @keyframes scrollPosterUp {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }

        @keyframes scrollPosterDown {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }

        @media (max-width: 1024px) {
          .poster-wall-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .col-desktop-only { display: none; }
        }

        @media (max-width: 640px) {
          .poster-wall-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
          }
          .poster-col-track { gap: 10px; }
          .col-tablet-hide { display: none; }
        }
      `}</style>
    </div>
  );
}
