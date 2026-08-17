/**
 * SwipeCard — Reusable Tinder-style gesture wrapper with custom cinematic animations:
 *  1. PASS (Left): real pixel disintegration — html2canvas captures the card's actual
 *     rendered content, then it dissolves into true-color particles.
 *     Pick the physics with `passEffect`:
 *       'dust'  (default) — sine-wave drift + fade, right-to-left wave
 *       'burst'            — radial explosion, every pixel flies outward at once
 *     (see disintegrateEngine.js)
 *  2. SEEN IT (Right): Rocket Warp — brief dip, then rips off-screen with
 *     motion blur, trailing speed lines, and a small clean "seen" checkmark
 *     (no more gold sparkle overload)
 *
 * Requires: npm install html2canvas
 */

import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { disintegrateElement } from './disintegrateEngine';

const THRESHOLD = 85;   // px drag needed to trigger swipe
const ROT_FACTOR = 0.07; // rotation per px

// Generate speed-line streaks for the SEEN IT rocket warp
function generateSpeedLines() {
  return Array.from({ length: 7 }, (_, i) => ({
    id: i,
    top: 8 + Math.random() * 84, // % vertical position
    delay: i * 0.02 + Math.random() * 0.05,
    width: 30 + Math.random() * 30, // % of card width
  }));
}

const SwipeCard = forwardRef(function SwipeCard({
  onSwipeLeft,
  onSwipeRight,
  disabled = false,
  rightLabel = 'SEEN ✓',
  leftLabel = '✗ PASS',
  rightColor = '212,168,67',
  leftColor = '239,68,68',
  borderRadius = 'var(--radius-lg)',
  passEffect = 'dust', // 'dust' | 'burst' — see disintegrateEngine.js
  style = {},
  children,
}, ref) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flyDir, setFlyDir] = useState(null); // 'left' | 'right' | null
  const [disintegrated, setDisintegrated] = useState(false); // true once the real DOM is hidden mid-dissolve
  const [speedLines, setSpeedLines] = useState([]);

  const startX = useRef(0);
  const contentRef = useRef(null);
  const isAnimatingRef = useRef(false);

  const finishSwipe = useCallback((dir) => {
    setFlyDir(null);
    setDisintegrated(false);
    setSpeedLines([]);
    setDragX(0);
    isAnimatingRef.current = false;
    if (dir === 'right') onSwipeRight?.();
    else onSwipeLeft?.();
  }, [onSwipeLeft, onSwipeRight]);

  const triggerFly = useCallback((dir) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setFlyDir(dir);

    if (dir === 'left') {
      setSpeedLines([]);
      const node = contentRef.current;

      disintegrateElement(node, {
        duration: passEffect === 'burst' ? 550 : 700,
        sampleStep: 5,
        waveMs: 180,
        windX: -420, // blows the whole particle cloud left as it dissolves, in sync with the card
        particleType: passEffect,
        onCaptured: () => setDisintegrated(true), // hide the real card the instant particles take over
      })
        .catch(() => {
          // html2canvas failed (e.g. tainted canvas from a cross-origin image
          // without CORS headers) — fall back to a plain fade, still looks fine.
          setDisintegrated(true);
        })
        .finally(() => finishSwipe('left'));
    } else {
      setSpeedLines(generateSpeedLines());
      const duration = 580;
      setTimeout(() => finishSwipe('right'), duration);
    }
  }, [finishSwipe, passEffect]);

  // Imperative handle for parent buttons
  useImperativeHandle(ref, () => ({
    swipeRight: () => triggerFly('right'),
    swipeLeft: () => triggerFly('left'),
  }), [triggerFly]);

  // ── Pointer handlers ───────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (disabled || flyDir || isAnimatingRef.current) return;
    startX.current = e.clientX;
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { }
  }, [disabled, flyDir]);

  const onPointerMove = useCallback((e) => {
    if (!dragging) return;
    setDragX(e.clientX - startX.current);
  }, [dragging]);

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);

    if (dragX > THRESHOLD) {
      triggerFly('right');
    } else if (dragX < -THRESHOLD) {
      triggerFly('left');
    } else {
      setDragX(0);
    }
  }, [dragging, dragX, triggerFly]);

  // ── Visual calculations ────────────────────────────────────────
  const rightAlpha = Math.max(0, Math.min(dragX / THRESHOLD, 1));
  const leftAlpha = Math.max(0, Math.min(-dragX / THRESHOLD, 1));

  const rot = dragX * ROT_FACTOR;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        userSelect: 'none',
        touchAction: 'none',
        cursor: disabled ? 'default' : dragging ? 'grabbing' : 'grab',
        perspective: '1200px',
        transformStyle: 'preserve-3d',
        // PASS no longer slides the container itself — the card freezes exactly
        // where it was (mid-drag or centered) and the particle wind (see
        // disintegrateEngine.js `windX`) carries all the leftward motion, so the
        // dissolve and the "blow away" happen as one synced motion, not two.
        transform: flyDir === 'right'
          ? 'none' // handled by warpLaunchRight keyframes
          : `translateX(${dragX}px) rotate(${rot}deg)`,
        transition: dragging || flyDir ? 'none' : 'transform 0.48s cubic-bezier(0.22,0.61,0.36,1)',
        animation: flyDir === 'right' ? 'rocketWarpRight 0.58s cubic-bezier(0.45, 0, 0.4, 1) forwards' : 'none',
        willChange: 'transform',
        ...style,
      }}
    >
      {/* ── CARD CONTENT WRAPPER — this is exactly what gets screenshotted ── */}
      <div
        ref={contentRef}
        style={{
          position: 'relative', width: '100%', height: '100%',
          borderRadius, overflow: 'hidden',
          // PASS: real content vanishes the instant its particles take over
          opacity: disintegrated ? 0 : 1,
          filter: flyDir === 'right' ? 'brightness(1.06)' : 'none',
          border: flyDir === 'right' ? '1.5px solid rgba(56,189,248,0.85)' : 'none',
          boxShadow: flyDir === 'right'
            ? '0 0 0 1.5px rgba(56,189,248,0.5), 0 0 22px rgba(56,189,248,0.35)'
            : 'none',
          transition: flyDir === 'right' ? 'box-shadow 0.2s ease, border-color 0.2s ease' : 'none',
        }}
      >
        {children}
      </div>

      {/* Real particles render on a document-level canvas positioned over the
          card's screen coordinates (see disintegrateEngine.js) — nothing to render here. */}

      {/* ── SPEED LINES + CHECK BADGE (SEEN IT / RIGHT) ── */}
      {flyDir === 'right' && (
        <>
          {speedLines.length > 0 && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15, overflow: 'visible' }}>
              {speedLines.map(l => (
                <div
                  key={l.id}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: `${l.top}%`,
                    width: `${l.width}%`,
                    height: 2,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, transparent, rgba(125,211,252,0.9), transparent)',
                    opacity: 0,
                    transformOrigin: 'right center',
                    animation: `speedLine 0.4s ease-out ${l.delay}s forwards`,
                  }}
                />
              ))}
            </div>
          )}

          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 40,
            width: 32, height: 32, borderRadius: '50%',
            background: '#0EA5B7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(14,165,183,0.6)',
            animation: 'checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>✓</span>
          </div>
        </>
      )}

      {/* ── SEEN STAMP (drag right) ────────────────────────── */}
      {rightAlpha > 0.05 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
          borderRadius,
          background: `rgba(${rightColor},${rightAlpha * 0.18})`,
          border: `2.5px solid rgba(${rightColor},${rightAlpha})`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
          padding: 18,
        }}>
          <span style={{
            display: 'inline-block',
            transform: 'rotate(-18deg)',
            border: `3px solid rgba(${rightColor},${rightAlpha})`,
            borderRadius: 6,
            padding: '5px 14px',
            color: `rgba(${rightColor},${rightAlpha})`,
            fontWeight: 900, fontSize: '1.2rem', letterSpacing: '0.1em',
            fontFamily: 'var(--font-sans)',
          }}>
            {rightLabel}
          </span>
        </div>
      )}

      {/* ── PASS STAMP (drag left) ───────────────────────── */}
      {leftAlpha > 0.05 && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
          borderRadius,
          background: `rgba(${leftColor},${leftAlpha * 0.18})`,
          border: `2.5px solid rgba(${leftColor},${leftAlpha})`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
          padding: 18,
        }}>
          <span style={{
            display: 'inline-block',
            transform: 'rotate(18deg)',
            border: `3px solid rgba(${leftColor},${leftAlpha})`,
            borderRadius: 6,
            padding: '5px 14px',
            color: `rgba(${leftColor},${leftAlpha})`,
            fontWeight: 900, fontSize: '1.2rem', letterSpacing: '0.1em',
            fontFamily: 'var(--font-sans)',
          }}>
            {leftLabel}
          </span>
        </div>
      )}

      <style>{`
        /* SEEN IT: rocket warp — brief anticipation dip, then rips off-screen
           with motion blur, fading out as it exits */
        @keyframes rocketWarpRight {
          0% {
            transform: scale(1) translate3d(0, 0, 0) rotate(0deg);
            filter: blur(0px);
            opacity: 1;
          }
          16% {
            transform: scale(0.97) translate3d(-14px, -4px, 0) rotate(-2deg);
            filter: blur(0px);
            opacity: 1;
          }
          55% {
            transform: scale(0.88) translate3d(280px, -20px, 0) rotate(7deg);
            filter: blur(5px);
            opacity: 1;
          }
          100% {
            transform: scale(0.6) translate3d(760px, -6px, 0) rotate(11deg);
            filter: blur(1px);
            opacity: 0;
          }
        }

        /* Trailing streak behind the card as it warps off */
        @keyframes speedLine {
          0% { transform: scaleX(0) translateX(0); opacity: 0; }
          25% { opacity: 1; }
          100% { transform: scaleX(1) translateX(-120px); opacity: 0; }
        }

        /* Small "seen" badge — pops in, holds, fades as the card leaves */
        @keyframes checkPop {
          0% { transform: scale(0); opacity: 0; }
          38% { transform: scale(1.15); opacity: 1; }
          65% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1) translateY(-4px); opacity: 0; }
        }
      `}</style>
    </div>
  );
});

export default SwipeCard;