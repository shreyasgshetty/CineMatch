import React from 'react';
import { useParams } from 'react-router-dom';
export default function MediaDetailPage() {
  const { id } = useParams();
  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) 0' }}>
      <div className="container">
        <h1>🎬 Media Details</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-4)' }}>
          Media ID: {id} — Full detail page implemented in Phase 14.
        </p>
      </div>
    </div>
  );
}
