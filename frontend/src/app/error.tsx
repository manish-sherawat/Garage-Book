'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-canvas)',
      color: 'var(--text-main)',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div className="glass-card" style={{ padding: '40px', borderRadius: '16px', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid var(--danger)' }}>
        <AlertTriangle size={48} color="var(--danger)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 12px 0' }}>Something went wrong!</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: '1.5' }}>
          An unexpected error occurred in the application. Please try refreshing the page or navigating back.
        </p>
        <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: '8px', fontSize: '11px', color: 'var(--danger)', width: '100%', wordBreak: 'break-word', marginBottom: '24px', textAlign: 'left', opacity: 0.8 }}>
          {error.message || 'Unknown error'}
        </div>
        <button
          onClick={() => reset()}
          className="btn-primary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <RefreshCcw size={16} /> Try Again
        </button>
      </div>
    </div>
  );
}
