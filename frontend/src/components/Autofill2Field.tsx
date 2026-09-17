import { useState } from 'react';
import { X } from 'lucide-react';

interface Autofill2FieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  onSelectOption?: (val: string) => void;
  onAddOption?: (newVal: string) => void;
  required?: boolean;
}

export default function Autofill2Field({
  label,
  placeholder,
  value,
  onChange,
  options,
  onSelectOption,
  onAddOption,
  required,
}: Autofill2FieldProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const matched = options.some((opt) => opt.toLowerCase() === value.toLowerCase().trim() && value.trim() !== '');

  const filteredOptions = options.filter((opt) => opt.toLowerCase().includes(value.toLowerCase().trim()));

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
        <span>{label} {required && '*'} </span>
        {matched && <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: '700' }}>Matched ✓</span>}
      </label>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="input-glass"
          placeholder={placeholder || `Type to search or enter ${label}...`}
          value={value}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onChange={(e) => { onChange(e.target.value); setShowSuggestions(true); }}
          style={{
            width: '100%',
            paddingRight: '28px',
            border: matched ? '2px solid #2563eb' : undefined,
          }}
        />

        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); setShowSuggestions(false); }}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Floating Suggestions List */}
      {showSuggestions && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: 'var(--bg-card)',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            maxHeight: '180px',
            overflowY: 'auto',
            zIndex: 100,
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt);
                  if (onSelectOption) onSelectOption(opt);
                  setShowSuggestions(false);
                }}
                style={{
                  padding: '9px 12px',
                  borderBottom: '1px solid var(--bg-canvas)',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: opt.toLowerCase() === value.toLowerCase().trim() ? '#2563eb' : '#0f172a',
                  background: opt.toLowerCase() === value.toLowerCase().trim() ? '#eff6ff' : 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
                onMouseEnter={(e) => {
                  if (opt.toLowerCase() !== value.toLowerCase().trim()) e.currentTarget.style.background = 'var(--bg-canvas)';
                }}
                onMouseLeave={(e) => {
                  if (opt.toLowerCase() !== value.toLowerCase().trim()) e.currentTarget.style.background = 'var(--bg-card)';
                }}
              >
                <span>{opt}</span>
                {opt.toLowerCase() === value.toLowerCase().trim() ? (
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>Selected ✓</span>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Autofill ⚡</span>
                )}
              </div>
            ))
          ) : (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                if (onAddOption && value.trim()) {
                  onAddOption(value.trim());
                }
                setShowSuggestions(false);
              }}
              style={{
                padding: '10px 12px',
                fontSize: '12px',
                color: '#2563eb',
                fontWeight: '700',
                cursor: 'pointer',
                background: '#eff6ff',
              }}
            >
              + Use "{value}" as entry
            </div>
          )}
        </div>
      )}
    </div>
  );
}
