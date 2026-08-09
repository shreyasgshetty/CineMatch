import React from 'react';
import { useAuth } from '../context/AuthContext';
export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div style={{ minHeight: '100vh', padding: 'var(--space-8) 0' }}>
      <div className="container">
        <h1>👤 Profile</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-4)' }}>
          User: {user?.name} ({user?.email}) — Full profile page implemented in Phase 14.
        </p>
        <pre style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', background: 'var(--color-bg-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', overflow: 'auto' }}>
          {JSON.stringify(user?.preferences, null, 2)}
        </pre>
      </div>
    </div>
  );
}
