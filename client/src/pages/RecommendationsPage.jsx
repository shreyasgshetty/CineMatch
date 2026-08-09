import React from 'react';
export default function RecommendationsPage() {
  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) 0' }}>
      <div className="container">
        <h1>🎯 For You</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-4)' }}>
          Personalized recommendations dashboard — implemented in Phase 10.
        </p>
      </div>
    </div>
  );
}
