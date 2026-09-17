'use client';

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '16px',
        margin: '16px 0',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--success-light, #e8f8f2)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          border: '1px solid var(--accent-border, #a7e3cc)',
        }}
      >
        <Icon size={26} />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px', color: 'var(--text-main)' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 0 20px', lineHeight: '1.5' }}>
        {description}
      </p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {secondaryActionLabel && onSecondaryAction && (
          <button type="button" onClick={onSecondaryAction} className="btn-secondary">
            {secondaryActionLabel}
          </button>
        )}
        {actionLabel && onAction && (
          <button type="button" onClick={onAction} className="btn-primary">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
