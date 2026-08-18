import React, { useState, useEffect, useMemo, useRef } from 'react';
import { onboardingApi } from '../../services/api';
import PosterStreamRow from './PosterStreamRow';

export default function CinematicPosterWall({ activeLanguage = 'kn', selectedLanguages = [] }) {
  const [posterCache, setPosterCache] = useState({});
  const [currentPosters, setCurrentPosters] = useState([]);
  const [fadeState, setFadeState] = useState('visible'); // 'visible' | 'fading'
  const activeLangRef = useRef(activeLanguage);

  // Fetch and cache language preview posters
  useEffect(() => {
    let isMounted = true;
    const fetchPreviews = async () => {
      try {
        const res = await onboardingApi.getLanguagePreviews({ limit: 24 });
        if (!isMounted) return;

        const rawPosters = res.data?.posters || {};
        const formattedCache = {};

        Object.entries(rawPosters).forEach(([lang, list]) => {
          formattedCache[lang] = list.filter((p) => p.posterPath);
        });

        // Fallback for older response shape if needed
        if (res.data?.previews && Object.keys(formattedCache).length === 0) {
          Object.entries(res.data.previews).forEach(([lang, paths]) => {
            formattedCache[lang] = paths.map((path, idx) => ({
              id: `${lang}-${idx}`,
              posterPath: path,
              title: '',
            }));
          });
        }

        setPosterCache(formattedCache);
      } catch (err) {
        console.error('Failed to load language preview posters:', err);
      }
    };

    fetchPreviews();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute active poster set (prioritize activeLanguage, interleave selectedLanguages)
  const targetPosters = useMemo(() => {
    const activeList = posterCache[activeLanguage] || [];
    if (activeList.length === 0) {
      // If active language not loaded yet, use any available cached language
      const anyLang = Object.keys(posterCache)[0];
      return anyLang ? posterCache[anyLang] : [];
    }

    // If multiple languages are selected, interleave secondary selected languages
    const otherSelected = selectedLanguages.filter((l) => l !== activeLanguage && posterCache[l]?.length > 0);

    if (otherSelected.length === 0) return activeList;

    const merged = [];
    const maxLen = Math.max(activeList.length, 24);

    for (let i = 0; i < maxLen; i++) {
      if (activeList[i]) merged.push(activeList[i]);
      // Every 3rd poster can come from another selected language
      if (i % 2 === 1) {
        const altLang = otherSelected[(i >> 1) % otherSelected.length];
        const altList = posterCache[altLang];
        if (altList && altList[i % altList.length]) {
          merged.push(altList[i % altList.length]);
        }
      }
    }

    return merged.slice(0, 28);
  }, [posterCache, activeLanguage, selectedLanguages]);

  // Smooth Crossfade Transition when Active Language changes
  useEffect(() => {
    if (activeLangRef.current === activeLanguage && currentPosters.length > 0) return;
    activeLangRef.current = activeLanguage;

    if (targetPosters.length > 0) {
      if (currentPosters.length === 0) {
        setCurrentPosters(targetPosters);
      } else {
        setFadeState('fading');
        const timer = setTimeout(() => {
          setCurrentPosters(targetPosters);
          setFadeState('visible');
        }, 220);
        return () => clearTimeout(timer);
      }
    }
  }, [activeLanguage, targetPosters, currentPosters.length]);

  // Partition posters into 3 rows
  const { row1, row2, row3 } = useMemo(() => {
    const list = currentPosters.length > 0 ? currentPosters : targetPosters;
    if (list.length === 0) return { row1: [], row2: [], row3: [] };

    const third = Math.ceil(list.length / 3);
    return {
      row1: list.slice(0, third),
      row2: list.slice(third, third * 2),
      row3: list.slice(third * 2),
    };
  }, [currentPosters, targetPosters]);

  return (
    <div
      className="cinematic-poster-wall-wrapper"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        backgroundColor: '#06080c',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        padding: '50px 0',
        pointerEvents: 'none', // Crucial: lets wheel scrolls pass to the central language thread!
        userSelect: 'none',
      }}
    >
      {/* ── 1. Animated Horizontal Poster Stream Rows ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          opacity: fadeState === 'visible' ? 1 : 0.4,
          transform: fadeState === 'visible' ? 'scale(1)' : 'scale(0.99)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <PosterStreamRow
          rowKey={`row-1-${activeLanguage}`}
          posters={row1}
          duration={58}
          cardWidth={150}
          cardHeight={215}
        />
        <PosterStreamRow
          rowKey={`row-2-${activeLanguage}`}
          posters={row2}
          duration={46}
          cardWidth={165}
          cardHeight={235}
        />
        <PosterStreamRow
          rowKey={`row-3-${activeLanguage}`}
          posters={row3}
          duration={64}
          cardWidth={150}
          cardHeight={215}
          className="poster-stream-row-3"
        />
      </div>

      {/* ── 2. Cinematic Subtle Vignette & Center Focus Backdrop ── */}
      <div
        className="poster-wall-vignette-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at center, rgba(6, 8, 12, 0.12) 0%, rgba(6, 8, 12, 0.42) 60%, rgba(6, 8, 12, 0.78) 100%)',
          boxShadow: 'inset 0 0 80px rgba(0,0,0,0.8)',
        }}
      />
    </div>
  );
}
