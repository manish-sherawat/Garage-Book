'use client';

import { Loader2 } from 'lucide-react';

export default function PageLoader({ text = 'Loading data...' }: { text?: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      color: 'var(--text-muted)'
    }}>
      <Loader2 className="animate-spin" size={28} style={{ marginBottom: '12px', color: 'var(--accent)' }} />
      <span style={{ fontSize: '13px', fontWeight: '500' }}>{text}</span>
    </div>
  );
}
