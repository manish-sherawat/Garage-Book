'use client';

import { Settings } from 'lucide-react';

export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        background: 'var(--bg-canvas)',
        color: 'var(--text-main)',
      }}
    >
      <div className="premium-spinner-container">
        <Settings size={48} className="spin-animation" color="var(--accent)" />
      </div>
      <h2
        style={{
          marginTop: '24px',
          fontFamily: 'var(--font-heading)',
          fontWeight: '800',
          fontSize: '20px',
          letterSpacing: '-0.02em',
          color: 'var(--text-main)',
        }}
      >
        Loading System...
      </h2>
      <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
        Preparing your dashboard and real-time data
      </p>
    </div>
  );
}
