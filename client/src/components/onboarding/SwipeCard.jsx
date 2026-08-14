/**
 * SwipeCard — Reusable Tinder-style swipe gesture wrapper
 *
 * Usage:
 *   <SwipeCard onSwipeRight={fn} onSwipeLeft={fn}>
 *     <YourCardContent />
 *   </SwipeCard>
 *
 * Uses Pointer Events API — works for mouse AND touch simultaneously.
 * The consumer controls card dimensions via CSS on the parent container.
 * Stamps ("SEEN ✓" / "✗ PASS") appear while dragging.
 * On threshold cross → card flies off-screen, callback fires.
 */

import React, { useState, useRef, useCallback } from 'react';

const THRESHOLD   = 85;   // px of drag needed to trigger a swipe
const ROT_FACTOR  = 0.07; // degrees rotation per px dragged

export default function SwipeCard({
  onSwipeLeft,
  onSwipeRight,
  disabled      = false,
  rightLabel    = 'SEEN ✓',
  leftLabel     = '✗ PASS',
  rightColor    = '34,197,94',   // CSS rgb components, green
  leftColor     = '239,68,68',   // CSS rgb components, red
  borderRadius  = 'var(--radius-lg)',
  style         = {},
  children,
}) {
  const [dragX,    setDragX]    = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flyDir,   setFlyDir]   = useState(null); // 'left' | 'right' | null

  const startX = useRef(0);

  // ── Pointer handlers (unified mouse + touch) ───────────────────
  const onPointerDown = useCallback((e) => {
    if (disabled || flyDir) return;
    startX.current = e.clientX;
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  }, [disabled, flyDir]);

  const onPointerMove = useCallback((e) => {
    if (!dragging) return;
    setDragX(e.clientX - startX.current);
  }, [dragging]);

  const onPointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);

    if (dragX > THRESHOLD) {
      setFlyDir('right');
      setTimeout(() => { setFlyDir(null); setDragX(0); onSwipeRight?.(); }, 380);
    } else if (dragX < -THRESHOLD) {
      setFlyDir('left');
      setTimeout(() => { setFlyDir(null); setDragX(0); onSwipeLeft?.(); }, 380);
    } else {
      setDragX(0); // snap back
    }
  }, [dragging, dragX, onSwipeLeft, onSwipeRight]);

  // ── Visual state ───────────────────────────────────────────────
  const rightAlpha = Math.max(0, Math.min(dragX  / THRESHOLD, 1));
  const leftAlpha  = Math.max(0, Math.min(-dragX / THRESHOLD, 1));

  const tx  = flyDir === 'right' ? 760 : flyDir === 'left' ? -760 : dragX;
  const ty  = flyDir ? 80 : 0;
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
        transform: `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg)`,
        transition: dragging ? 'none' : 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)',
        willChange: 'transform',
        ...style,
      }}
    >
      {/* ── SEEN / LIKE stamp (drag right) ─────────────── */}
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

      {/* ── PASS stamp (drag left) ──────────────────────── */}
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

      {children}
    </div>
  );
}
