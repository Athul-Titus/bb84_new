import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
}

export function MetricCard({ label, value, sub, icon }: MetricCardProps) {
  return (
    <article
      style={{
        borderRadius: 16,
        border: '1px solid var(--border-light)',
        background: 'var(--bg-card)',
        padding: 16,
      }}
    >
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{label}</p>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ fontSize: 34, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</p>
        {icon}
      </div>
      {sub ? <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</p> : null}
    </article>
  );
}
