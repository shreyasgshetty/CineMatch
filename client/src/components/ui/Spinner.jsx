import React from 'react';

/**
 * Spinner — Loading indicator
 *
 * Props:
 *   size: 'sm' | 'md' | 'lg' (default: 'md')
 *   fullPage: boolean — center in viewport
 */
export default function Spinner({ size = 'md', fullPage = false }) {
  const sizeMap = { sm: 18, md: 28, lg: 44 };
  const px = sizeMap[size];

  const spinner = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-spin"
      aria-label="Loading"
      role="status"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="var(--color-bg-overlay)"
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="var(--color-brand-primary)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg-base)',
        zIndex: 9999,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          {spinner}
          <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Loading CineMatch…
          </span>
        </div>
      </div>
    );
  }

  return spinner;
}
