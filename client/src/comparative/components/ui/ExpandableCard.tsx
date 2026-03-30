import { useState } from 'react';

interface ExpandableCardProps {
  title: string;
  category: string;
  detail: string;
}

export function ExpandableCard({ title, category, detail }: ExpandableCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: '1px solid var(--border-light)',
        borderRadius: 14,
        background: 'var(--bg-card)',
        padding: 14,
        cursor: 'pointer',
      }}
      onClick={() => setOpen((v) => !v)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
              background: 'var(--bg-sidebar)',
              borderRadius: 8,
              padding: '3px 7px',
            }}
          >
            {category}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
        </div>
        <span style={{ color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open ? <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)' }}>{detail}</p> : null}
    </div>
  );
}
