'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

interface SnackbarProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Snackbar({ message, type, onClose }: SnackbarProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isSuccess = type === 'success';

  return (
    <div
      className="snackbar-animate-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: isSuccess ? 'var(--success-light, #dcfce7)' : 'var(--danger-light, #fee2e2)',
        border: `1px solid ${isSuccess ? 'var(--success)' : 'var(--danger)'}`,
        color: isSuccess ? 'var(--success)' : 'var(--danger)',
        padding: '14px 20px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        fontWeight: '600',
        fontSize: '14px',
        minWidth: '300px',
      }}
    >
      {isSuccess ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
      <span style={{ flex: 1, color: 'var(--text-main)' }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          padding: '4px',
          borderRadius: '4px',
        }}
        aria-label="Close snackbar"
      >
        <X size={16} />
      </button>
    </div>
  );
}
