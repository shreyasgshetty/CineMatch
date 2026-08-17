/**
 * disintegrateEngine.js
 *
 * A standalone, promise-based port of disintegrate.js
 * (https://github.com/…/disintegrate), rebuilt to:
 *   - work on a single element on demand (no global data-dis-* scanning,
 *     no document-wide canvas, no resize listeners)
 *   - use real html2canvas pixel data for particle color (true "screenshot
 *     dissolves into itself" effect, not a synthetic grid)
 *   - respect border-radius the same way the original createParticle() did,
 *     so rounded-corner cards don't spawn square-corner dust
 *   - support two particle types ported straight from the source lib:
 *       'dust'  — sine-wave drift + fade  (their default `Particle`)
 *       'burst' — radial explosion + shrink (their `ExplodingParticle`)
 *   - return a Promise that resolves when the animation finishes, so it
 *     drops cleanly into React/Vue/whatever with no lifecycle coupling
 *
 * Usage:
 *   import { disintegrateElement } from './disintegrateEngine';
 *
 *   await disintegrateElement(cardNode, {
 *     duration: 650,
 *     sampleStep: 5,
 *     waveMs: 200,
 *     particleType: 'dust',        // or 'burst'
 *     ignoreColors: [[255,255,255]], // optional: skip pixels matching these RGB values
 *     onCaptured: () => cardNode.style.opacity = 0, // hide real node in sync
 *   });
 *
 * Requires: npm install html2canvas
 */

import html2canvas from 'html2canvas';

// Central-limit-theorem approximation of a normal distribution in [-1, 1].
// Same trick disintegrate.js uses to make particle spread feel organic
// instead of uniformly random.
function genNormalizedVal() {
    return (
        Math.random() + Math.random() + Math.random() +
        Math.random() + Math.random() + Math.random() - 3
    ) / 3;
}

const EaseIn = power => t => Math.pow(t, power);
const EaseOut = power => t => 1 - Math.abs(Math.pow(t - 1, power));
const EaseInOut = power => t => (
    t < 0.5 ? EaseIn(power)(t * 2) / 2 : EaseOut(power)(t * 2 - 1) / 2 + 0.5
);

// ── Particle type 1: "dust" ──────────────────────────────────────────
// Ported from disintegrate.js's default `Particle` (sine-wave sway,
// upward drift, shrink + fade), extended with a shared `windX` force so
// every particle gets swept sideways together — the "blown apart by
// wind" look — instead of just drifting in place. Time-driven (0→1
// percent), so it looks identical regardless of frame rate.
class DustParticle {
    constructor(x, y, rgb, windX = 0) {
        this.startX = x;
        this.startY = y;
        this.rgb = rgb;

        // Shared wind push, ±15% per-particle variance so the cloud doesn't
        // move as one rigid block.
        this.windX = windX * (0.85 + genNormalizedVal() * 0.15);

        // Turbulence layered on top of the wind — smaller now that wind
        // carries most of the horizontal motion.
        this.turbScaler = Math.round(16 * genNormalizedVal());
        this.numWaves = ((genNormalizedVal() + 1) / 2) * 2 + 1;
        this.heightScaler = Math.round(34 * (genNormalizedVal() + 1) / 2) + 6;
        this.startSize = 2.6;
        this.opacityFactor = Math.round(((genNormalizedVal() + 1) / 2) * 3 + 1);
    }

    draw(ctx, t) {
        const p = t >= 1 ? 1 : t;
        const windEase = EaseOut(2)(p); // wind grabs the particle fast, then eases off
        const x = this.startX + this.windX * windEase + Math.sin(this.numWaves * Math.PI * p) * this.turbScaler;
        const y = this.startY - p * this.heightScaler;
        const size = this.startSize * (1 - p);
        const opacity = 1 - EaseInOut(this.opacityFactor)(p);

        if (size <= 0.05 || opacity <= 0.02) return;

        ctx.fillStyle = `rgba(${this.rgb[0]},${this.rgb[1]},${this.rgb[2]},${opacity})`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
}

// ── Particle type 2: "burst" ─────────────────────────────────────────
// Direct port of disintegrate.js's `ExplodingParticle`: random outward
// velocity, shrinking circle, fixed lifespan. The original was frame-driven
// (decrements per draw call); reworked here to scale with elapsed time so
// it's frame-rate independent like DustParticle.
class BurstParticle {
    constructor(x, y, rgb, windX = 0) {
        this.startX = x;
        this.startY = y;
        this.rgb = rgb;
        this.windX = windX * (0.85 + Math.random() * 0.15);

        this.speedX = -60 + Math.random() * 120;   // px/sec-ish, scaled in draw()
        this.speedY = -60 + Math.random() * 120;
        this.startRadius = 3 + Math.random() * 3;
    }

    draw(ctx, t) {
        const p = t >= 1 ? 1 : t;
        const x = this.startX + this.speedX * p + this.windX * p;
        const y = this.startY + this.speedY * p;
        const radius = this.startRadius * (1 - p);
        const opacity = 1 - p;

        if (radius <= 0.05 || opacity <= 0.02) return;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.rgb[0]},${this.rgb[1]},${this.rgb[2]},${opacity})`;
        ctx.fill();
    }
}

const PARTICLE_TYPES = { dust: DustParticle, burst: BurstParticle };

// Same corner-exclusion math as the original createParticle(): treat the
// element as a rounded rect and skip any sample point that falls in the
// square corner area outside the actual rounded curve.
function isInRoundedCorner(localX, localY, w, h, radius) {
    if (radius <= 0) return false;
    const r = Math.min(radius, w / 2, h / 2);

    const inTL = localX < r && localY < r;
    const inTR = localX > w - r && localY < r;
    const inBR = localX > w - r && localY > h - r;
    const inBL = localX < r && localY > h - r;

    if (inTL) return Math.hypot(r - localX, r - localY) > r;
    if (inTR) return Math.hypot(localX - (w - r), r - localY) > r;
    if (inBR) return Math.hypot(localX - (w - r), localY - (h - r)) > r;
    if (inBL) return Math.hypot(r - localX, localY - (h - r)) > r;
    return false;
}

/**
 * Disintegrates a DOM element into real pixel particles sampled from an
 * html2canvas screenshot of its actual rendered content.
 *
 * @param {HTMLElement} el
 * @param {object}   [opts]
 * @param {number}   [opts.duration=700]      ms each particle takes to fully dissolve
 * @param {number}   [opts.sampleStep=6]      sample every Nth pixel (higher = fewer particles, faster)
 * @param {number}   [opts.waveMs=220]        stagger window; right edge starts ~waveMs after left edge (dust only)
 * @param {number}   [opts.windX=0]           px of shared horizontal drift applied to every particle —
 *                                            negative = blown left, positive = blown right. This is what
 *                                            makes the whole cloud move together instead of drifting in place.
 * @param {'dust'|'burst'} [opts.particleType='dust']  physics style, ported from the two types in disintegrate.js
 * @param {number[][]} [opts.ignoreColors=[]] skip pixels matching these [r,g,b] triples (e.g. a flat background)
 * @param {Function} [opts.onCaptured]        called right after the screenshot lands, before
 *                                            particles start drawing — use this to hide the
 *                                            real element in sync so there's no flash/duplicate
 * @returns {Promise<void>}
 */
export async function disintegrateElement(el, opts = {}) {
    const {
        duration = 700,
        sampleStep = 6,
        waveMs = 220,
        windX = 0,
        particleType = 'dust',
        ignoreColors = [],
        onCaptured = null,
    } = opts;

    if (!el) return;

    const ParticleClass = PARTICLE_TYPES[particleType] || DustParticle;

    const rect = el.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));

    const computedRadius = parseInt(window.getComputedStyle(el).borderRadius, 10) || 0;

    let shot;
    try {
        shot = await html2canvas(el, {
            backgroundColor: null,
            scale: 1,
            useCORS: true,
            logging: false,
        });
    } catch (err) {
        // Cross-origin images without CORS headers, or any capture failure —
        // fail soft, let the caller fall back to a plain fade.
        onCaptured?.();
        throw err;
    }

    let imgData;
    try {
        const sctx = shot.getContext('2d');
        imgData = sctx.getImageData(0, 0, shot.width, shot.height).data;
    } catch (err) {
        // Canvas got tainted by cross-origin content — same fallback path.
        onCaptured?.();
        throw err;
    }

    // Hide the real element now — the overlay is about to take its place pixel-for-pixel.
    onCaptured?.();

    const scaleX = shot.width / width;
    const scaleY = shot.height / height;

    const overlay = document.createElement('canvas');
    overlay.width = width;
    overlay.height = height;
    Object.assign(overlay.style, {
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${width}px`,
        height: `${height}px`,
        pointerEvents: 'none',
        zIndex: 9999,
    });
    document.body.appendChild(overlay);
    const ctx = overlay.getContext('2d');

    const particles = [];
    for (let y = 0; y < height; y += sampleStep) {
        for (let x = 0; x < width; x += sampleStep) {
            if (isInRoundedCorner(x, y, width, height, computedRadius)) continue;

            const sx = Math.min(shot.width - 1, Math.round(x * scaleX));
            const sy = Math.min(shot.height - 1, Math.round(y * scaleY));
            const idx = (sy * shot.width + sx) * 4;
            const a = imgData[idx + 3];
            if (a < 10) continue; // skip transparent pixels — no dust from empty space

            const rgb = [imgData[idx], imgData[idx + 1], imgData[idx + 2]];
            if (ignoreColors.some(c => c[0] === rgb[0] && c[1] === rgb[1] && c[2] === rgb[2])) continue;

            const delay = particleType === 'dust'
                ? ((width - x) / width) * waveMs + Math.random() * 60
                : Math.random() * (waveMs * 0.5); // burst: lighter, more uniform stagger

            particles.push({ particle: new ParticleClass(x, y, rgb, windX), delay });
        }
    }

    return new Promise(resolve => {
        const start = performance.now();

        function frame(now) {
            const elapsed = now - start;
            ctx.clearRect(0, 0, width, height);

            let allDone = true;
            for (const { particle, delay } of particles) {
                const local = elapsed - delay;
                if (local <= 0) { allDone = false; continue; }
                const t = local / duration;
                if (t < 1) allDone = false;
                particle.draw(ctx, t);
            }

            if (!allDone) {
                requestAnimationFrame(frame);
            } else {
                overlay.remove();
                resolve();
            }
        }

        requestAnimationFrame(frame);
    });
}