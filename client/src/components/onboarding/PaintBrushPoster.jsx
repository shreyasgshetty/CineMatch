import React, { useRef, useCallback, useEffect } from 'react';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';
const TRAIL_LIFETIME = 2000; // Trail fades over 2.0 seconds

export default function PaintBrushPoster({ poster, width = 160, height = 230 }) {
  const cardRef = useRef(null);
  const colorLayerRef = useRef(null);
  const colorImgRef = useRef(null);
  const glassRimRef = useRef(null);
  const titleMetaRef = useRef(null);

  // Animation & Trail State
  const animFrameRef = useRef(null);
  const moveStopTimerRef = useRef(null);
  const trailRef = useRef([]); // [{ x, y, birth, radius }]

  const stateRef = useRef({
    isMoving: false,
    pointerInside: false,
    targetX: width / 2,
    targetY: height / 2,
    currentX: width / 2,
    currentY: height / 2,
    lastTrailX: -999,
    lastTrailY: -999,
    lastTime: performance.now(),
    vx: 0,
    vy: 0,
    lerpVx: 0,
    lerpVy: 0,
    lensRadius: Math.min(width, height) * 0.62, // Large organic bubble (~100-130px radius, 200-260px diameter)
  });

  const imgUrl = poster?.posterPath
    ? (poster.posterPath.startsWith('http') ? poster.posterPath : `${TMDB_IMAGE_BASE}${poster.posterPath}`)
    : null;

  // Render Loop (Active ONLY while moving or while trail is fading)
  const render = useCallback(() => {
    const s = stateRef.current;
    const now = performance.now();
    const trail = trailRef.current;

    // Fast, highly responsive tracking (0.65 lerp factor — no noticeable lag)
    const LERP_FACTOR = 0.65;
    s.currentX += (s.targetX - s.currentX) * LERP_FACTOR;
    s.currentY += (s.targetY - s.currentY) * LERP_FACTOR;

    // Velocity interpolation
    s.lerpVx += (s.vx - s.lerpVx) * 0.35;
    s.lerpVy += (s.vy - s.lerpVy) * 0.35;
    s.vx *= 0.7;
    s.vy *= 0.7;

    const curX = Math.round(s.currentX);
    const curY = Math.round(s.currentY);

    // 1. Update and prune fading trail points
    for (let i = trail.length - 1; i >= 0; i--) {
      const age = now - trail[i].birth;
      if (age >= TRAIL_LIFETIME) {
        trail.splice(i, 1);
      }
    }

    // 2. Build composite mask: Active Bubble + Fading Trail
    const maskGradients = [];
    let hasVisibleContent = false;

    // A. Active Bubble (Visible ONLY while actively moving inside poster)
    if (s.isMoving && s.pointerInside) {
      hasVisibleContent = true;
      const speed = Math.hypot(s.lerpVx, s.lerpVy);
      const stretch = 1 + Math.min(0.8, speed * 0.04);
      const rx = Math.round(s.lensRadius * stretch);
      const ry = Math.round(s.lensRadius / Math.sqrt(stretch));
      const wobble = Math.sin(now * 0.009) * 7;

      // Primary fluid liquid bubble
      maskGradients.push(
        `radial-gradient(ellipse ${(rx + wobble).toFixed(1)}px ${ry.toFixed(1)}px at ${curX}px ${curY}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 50%, rgba(0,0,0,0.2) 80%, transparent 100%)`
      );

      // Glass rim follows the active bubble
      if (glassRimRef.current) {
        const rim = glassRimRef.current;
        rim.style.transform = `translate3d(${curX}px, ${curY}px, 0) translate(-50%, -50%)`;
        rim.style.width = `${(rx + wobble) * 2}px`;
        rim.style.height = `${ry * 2}px`;
        rim.style.opacity = '1';
      }

      // Optical 1.04x magnification anchored under active cursor
      if (colorImgRef.current) {
        colorImgRef.current.style.transformOrigin = `${curX}px ${curY}px`;
        colorImgRef.current.style.transform = `scale(1.045)`;
      }

      if (titleMetaRef.current) {
        titleMetaRef.current.style.opacity = '1';
      }
    } else {
      // Bubble disappears immediately when stopped / left
      if (glassRimRef.current) {
        glassRimRef.current.style.opacity = '0';
      }
      if (titleMetaRef.current && trail.length === 0) {
        titleMetaRef.current.style.opacity = '0';
      }
    }

    // B. Soft Color Trail (Path history fading smoothly over 2s)
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const age = now - p.birth;
      const progress = age / TRAIL_LIFETIME;
      const alpha = Math.max(0, (1 - progress) * 0.78);

      if (alpha > 0.01) {
        hasVisibleContent = true;
        maskGradients.push(
          `radial-gradient(circle ${p.radius}px at ${p.x}px ${p.y}px, rgba(0,0,0,${alpha.toFixed(3)}) 0%, rgba(0,0,0,${(alpha * 0.72).toFixed(3)}) 42%, rgba(0,0,0,${(alpha * 0.15).toFixed(3)}) 70%, transparent 100%)`
        );
      }
    }

    // 3. Apply mask to color layer
    if (colorLayerRef.current) {
      if (hasVisibleContent && maskGradients.length > 0) {
        const maskStr = maskGradients.join(', ');
        colorLayerRef.current.style.webkitMaskImage = maskStr;
        colorLayerRef.current.style.maskImage = maskStr;
        colorLayerRef.current.style.opacity = '1';
      } else {
        colorLayerRef.current.style.opacity = '0';
      }
    }

    // 4. Stop RAF loop if no active bubble and all trails have faded out
    if (!hasVisibleContent && !s.isMoving && trail.length === 0) {
      if (colorLayerRef.current) colorLayerRef.current.style.opacity = '0';
      if (glassRimRef.current) glassRimRef.current.style.opacity = '0';
      if (titleMetaRef.current) titleMetaRef.current.style.opacity = '0';
      animFrameRef.current = null;
      return;
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, []);

  const startLoop = useCallback(() => {
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(render);
    }
  }, [render]);

  // Record a trail point when cursor moves
  const addTrailPoint = useCallback((x, y) => {
    const s = stateRef.current;
    const dist = Math.hypot(x - s.lastTrailX, y - s.lastTrailY);

    if (dist >= 10) {
      s.lastTrailX = x;
      s.lastTrailY = y;

      const trail = trailRef.current;
      if (trail.length >= 16) {
        trail.shift();
      }

      trail.push({
        x,
        y,
        birth: performance.now(),
        radius: Math.round(s.lensRadius * 0.82),
      });
    }
  }, []);

  // Pointer Interaction Handlers
  const handlePointerEnter = useCallback((e) => {
    const s = stateRef.current;
    s.pointerInside = true;
    s.isMoving = true;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    s.targetX = x;
    s.targetY = y;
    s.currentX = x;
    s.currentY = y;
    s.lastTime = performance.now();
    s.vx = 0;
    s.vy = 0;

    addTrailPoint(x, y);
    startLoop();

    // Bubble disappears immediately when stopped (>90ms without movement)
    if (moveStopTimerRef.current) clearTimeout(moveStopTimerRef.current);
    moveStopTimerRef.current = setTimeout(() => {
      s.isMoving = false;
    }, 90);
  }, [addTrailPoint, startLoop]);

  const handlePointerMove = useCallback((e) => {
    const s = stateRef.current;
    s.pointerInside = true;
    s.isMoving = true;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const now = performance.now();
    const dt = Math.max(1, now - s.lastTime);

    s.vx = ((x - s.targetX) / dt) * 16;
    s.vy = ((y - s.targetY) / dt) * 16;

    s.targetX = x;
    s.targetY = y;
    s.lastTime = now;

    addTrailPoint(x, y);
    startLoop();

    // Bubble disappears immediately when stopped (>90ms without movement)
    if (moveStopTimerRef.current) clearTimeout(moveStopTimerRef.current);
    moveStopTimerRef.current = setTimeout(() => {
      s.isMoving = false;
    }, 90);
  }, [addTrailPoint, startLoop]);

  const handlePointerLeave = useCallback(() => {
    const s = stateRef.current;
    s.pointerInside = false;
    s.isMoving = false; // Bubble disappears immediately on leave
    if (moveStopTimerRef.current) clearTimeout(moveStopTimerRef.current);
    startLoop(); // Ensures trail continues fading smoothly
  }, [startLoop]);

  // Touch Support
  const handleTouchStart = useCallback((e) => {
    if (!e.touches?.[0]) return;
    const s = stateRef.current;
    s.pointerInside = true;
    s.isMoving = true;

    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(touch.clientX - rect.left);
    const y = Math.round(touch.clientY - rect.top);

    s.targetX = x;
    s.targetY = y;
    s.currentX = x;
    s.currentY = y;
    s.lastTime = performance.now();
    s.vx = 0;
    s.vy = 0;

    addTrailPoint(x, y);
    startLoop();
  }, [addTrailPoint, startLoop]);

  const handleTouchMove = useCallback((e) => {
    if (!e.touches?.[0]) return;
    const s = stateRef.current;
    s.pointerInside = true;
    s.isMoving = true;

    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(touch.clientX - rect.left);
    const y = Math.round(touch.clientY - rect.top);
    const now = performance.now();
    const dt = Math.max(1, now - s.lastTime);

    s.vx = ((x - s.targetX) / dt) * 16;
    s.vy = ((y - s.targetY) / dt) * 16;
    s.targetX = x;
    s.targetY = y;
    s.lastTime = now;

    addTrailPoint(x, y);
    startLoop();

    if (moveStopTimerRef.current) clearTimeout(moveStopTimerRef.current);
    moveStopTimerRef.current = setTimeout(() => {
      s.isMoving = false;
    }, 110);
  }, [addTrailPoint, startLoop]);

  const handleTouchEnd = useCallback(() => {
    const s = stateRef.current;
    s.pointerInside = false;
    s.isMoving = false;
    if (moveStopTimerRef.current) clearTimeout(moveStopTimerRef.current);
    startLoop();
  }, [startLoop]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (moveStopTimerRef.current) {
        clearTimeout(moveStopTimerRef.current);
      }
    };
  }, []);

  if (!imgUrl) return null;

  return (
    <div
      ref={cardRef}
      className="paintbrush-poster-card"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        width,
        height,
        flexShrink: 0,
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'crosshair',
        backgroundColor: '#0a0d14',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
        userSelect: 'none',
        pointerEvents: 'auto',
        touchAction: 'none',
      }}
    >
      {/* ── 1. Base Layer: 100% Black & White Grayscale Poster ── */}
      <img
        src={imgUrl}
        alt={poster.title || 'Movie poster'}
        loading="lazy"
        draggable={false}
        className="poster-img-bw"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          filter: 'grayscale(100%) contrast(1.12) brightness(0.85)',
          pointerEvents: 'none',
        }}
      />

      {/* ── 2. Color Reveal Layer: Original Full Color Poster masked by Active Bubble + Trail ── */}
      <div
        ref={colorLayerRef}
        className="poster-color-reveal-layer"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0,
          willChange: 'mask-image, -webkit-mask-image, opacity',
        }}
      >
        <img
          ref={colorImgRef}
          src={imgUrl}
          alt={poster.title || 'Movie poster color'}
          loading="lazy"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: 'none',
            pointerEvents: 'none',
            willChange: 'transform',
            transition: 'transform 0.08s ease-out',
          }}
        />
      </div>

      {/* ── 3. Active Liquid Glass Rim (Visible ONLY while moving) ── */}
      <div
        ref={glassRimRef}
        className="liquid-glass-lens-rim"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          opacity: 0,
          borderRadius: '46% 54% 50% 50% / 50% 48% 52% 50%',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow:
            'inset 0 0 16px rgba(255, 255, 255, 0.2), inset 0 2px 6px rgba(255, 255, 255, 0.35), 0 0 14px rgba(212, 168, 67, 0.22), 0 4px 18px rgba(0, 0, 0, 0.45)',
          background:
            'radial-gradient(ellipse at 35% 30%, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.04) 42%, transparent 72%)',
          willChange: 'transform, opacity, width, height',
        }}
      />

      {/* ── 4. Film Title Badge ── */}
      <div
        ref={titleMetaRef}
        className="poster-meta-tag"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '24px 8px 8px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          opacity: 0,
          transition: 'opacity 0.25s ease',
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            color: '#fff',
            fontSize: '0.68rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          }}
        >
          {poster.title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {poster.releaseYear ? (
            <span style={{ color: 'var(--gold)', fontSize: '0.58rem', fontWeight: 600 }}>
              {poster.releaseYear}
            </span>
          ) : <span />}
          {poster.rating ? (
            <span style={{ color: '#fbbf24', fontSize: '0.58rem', fontWeight: 700 }}>
              ★ {poster.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
