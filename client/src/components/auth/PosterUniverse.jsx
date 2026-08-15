import React, { useEffect, useState, useMemo } from 'react';
import { mediaApi } from '../../services/api';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

const FALLBACK_POSTERS = [
  { id: '1', title: 'K.G.F: Chapter 2', path: '/q6y0Go1tsGEsmtFryDO23R9x05Z.jpg' },
  { id: '2', title: 'RRR', path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg' },
  { id: '3', title: 'Inception', path: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg' },
  { id: '4', title: 'Kantara', path: '/velwePhIrs6ftdd2A8tO8s6jYk5.jpg' },
  { id: '5', title: 'Vikram', path: '/pD6sL4vntU1ldQfeBwoMFiW9Zal.jpg' },
  { id: '6', title: 'Baahubali', path: '/8r28YStGrmuLAkOFxDiWsZvD2u4.jpg' },
  { id: '7', title: 'Interstellar', path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
  { id: '8', title: 'Dangal', path: '/9rL4p560wU1ldQfeBwoMFiW9Zal.jpg' },
  { id: '9', title: 'Spider-Man', path: '/8Gxv8gSFCU0XGDykEGvF8Z1hGKV.jpg' },
  { id: '10', title: 'The Dark Knight', path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg' },
  { id: '11', title: 'Pushpa', path: '/mY792vRmw12goFiZ95vGDvVML9s.jpg' },
  { id: '12', title: 'Avatar', path: '/jRXYjXNEKWStZ2vL8pKVoxeaYYS.jpg' }
];

export default function PosterUniverse() {
  const [posters, setPosters] = useState([]);

  useEffect(() => {
    let isMounted = true;
    mediaApi.list({ limit: 45 })
      .then(res => {
        if (!isMounted) return;
        const media = res.data?.media || [];
        const valid = media
          .filter(m => m && (m.posterPath || m.posterUrl))
          .map(m => ({
            id: m._id || m.id,
            title: m.title || '',
            path: m.posterPath || m.posterUrl
          }));

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

  const itemsList = posters.length > 0 ? posters : FALLBACK_POSTERS;

  // Position items across 3 depth layers with CSS ambient floating
  const layers = useMemo(() => {
    return itemsList.map((item, idx) => {
      const depthGroup = idx % 3; // 0 = Z-Back, 1 = Z-Mid, 2 = Z-Front
      const col = idx % 6;
      const row = Math.floor(idx / 6);

      const left = 5 + (col * 16) + (row % 2 === 0 ? 0 : 4) + (Math.sin(idx) * 2);
      const top = 6 + (row * 24) + (col % 2 === 0 ? 0 : 5) + (Math.cos(idx) * 3);

      let scale = 0.65;
      let opacity = 0.3;
      let zIndex = 1;
      let blur = '3px';

      if (depthGroup === 1) {
        scale = 0.85;
        opacity = 0.55;
        zIndex = 2;
        blur = '1px';
      } else if (depthGroup === 2) {
        scale = 1.05;
        opacity = 0.78;
        zIndex = 3;
        blur = '0px';
      }

      return {
        ...item,
        left: `${left}%`,
        top: `${top}%`,
        scale,
        opacity,
        zIndex,
        blur,
        rawX: left,
        rawY: top
      };
    });
  }, [itemsList]);

  // Generate subtle SVG similarity lines between nodes
  const connectionLines = useMemo(() => {
    if (layers.length < 4) return [];
    const lines = [];
    for (let i = 0; i < layers.length; i += 3) {
      const target = layers[(i + 4) % layers.length];
      if (target) {
        lines.push({
          id: `line-${i}`,
          x1: `${layers[i].rawX + 3}%`,
          y1: `${layers[i].rawY + 6}%`,
          x2: `${target.rawX + 3}%`,
          y2: `${target.rawY + 6}%`
        });
      }
    }
    return lines.slice(0, 8);
  }, [layers]);

  const getPosterUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${TMDB_IMG}${path}`;
  };

  return (
    <div className="poster-universe-container">
      <div className="poster-universe-stage">
        {/* Ambient SVG AI Similarity Lines */}
        <svg className="ai-connections-svg">
          {connectionLines.map(line => (
            <g key={line.id}>
              <line
                x1={line.x1} y1={line.y1}
                x2={line.x2} y2={line.y2}
                className="ai-similarity-line"
              />
              <circle cx={line.x1} cy={line.y1} r="2.5" className="ai-graph-node" />
            </g>
          ))}
        </svg>

        {/* Pure CSS Ambient Floating Poster Nodes */}
        {layers.map((item, idx) => {
          const imgUrl = getPosterUrl(item.path);
          if (!imgUrl) return null;

          return (
            <div
              key={`${item.id}-${idx}`}
              className="universe-poster-card"
              style={{
                left: item.left,
                top: item.top,
                zIndex: item.zIndex,
                opacity: item.opacity,
                filter: `blur(${item.blur}) brightness(0.85)`,
                transform: `scale(${item.scale})`,
                animationDelay: `${(idx % 5) * 0.7}s`
              }}
            >
              <img
                src={imgUrl}
                alt={item.title}
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

      <style>{`
        .poster-universe-container {
          position: absolute;
          inset: -40px;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .poster-universe-stage {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .universe-poster-card {
          position: absolute;
          width: 110px;
          aspect-ratio: 2/3;
          border-radius: 10px;
          overflow: hidden;
          background: rgba(24, 27, 34, 0.8);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          will-change: transform;
          animation: calmAmbientFloat 10s ease-in-out infinite alternate;
        }

        .universe-poster-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* SVG AI Similarity Graph Lines */
        .ai-connections-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .ai-similarity-line {
          stroke: rgba(212, 168, 67, 0.18);
          stroke-width: 1.2;
          stroke-dasharray: 4 6;
          animation: dashMove 25s linear infinite, linePulse 5s ease-in-out infinite alternate;
        }

        .ai-graph-node {
          fill: var(--gold);
          opacity: 0.5;
        }

        @keyframes dashMove {
          to { stroke-dashoffset: -100; }
        }

        @keyframes linePulse {
          0% { stroke: rgba(212, 168, 67, 0.1); }
          100% { stroke: rgba(212, 168, 67, 0.25); }
        }

        @keyframes calmAmbientFloat {
          0% { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-14px) scale(1.02); }
        }

        @media (max-width: 768px) {
          .universe-poster-card {
            width: 80px;
          }
        }
      `}</style>
    </div>
  );
}
