import React, { useMemo } from 'react';
import PaintBrushPoster from './PaintBrushPoster';

export default function PosterStreamRow({
  posters = [],
  duration = 55,
  cardWidth = 150,
  cardHeight = 220,
  rowKey = 'row-1',
  className = '',
}) {
  // Ensure enough posters to seamlessly fill 2x viewport width
  const loopedPosters = useMemo(() => {
    if (!posters || posters.length === 0) return [];
    let list = [...posters];
    while (list.length < 12) {
      list = [...list, ...posters];
    }
    // Duplicate for seamless 50% translation loop
    return [...list, ...list];
  }, [posters]);

  if (loopedPosters.length === 0) return null;

  return (
    <div
      className={`poster-stream-row-container ${className}`}
      style={{
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
        padding: '6px 0',
        pointerEvents: 'none', // Row container lets vertical scroll pass through
      }}
    >
      <div
        className="poster-stream-track"
        style={{
          display: 'flex',
          gap: 16,
          width: 'max-content',
          animation: `streamScrollLeft ${duration}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {loopedPosters.map((poster, idx) => (
          <PaintBrushPoster
            key={`${rowKey}-${poster.id || poster.posterPath}-${idx}`}
            poster={poster}
            width={cardWidth}
            height={cardHeight}
          />
        ))}
      </div>
    </div>
  );
}
