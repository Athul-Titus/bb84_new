import { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { FEATURE_MATRIX } from '../../data/featureMatrix';
import type { FeatureMatrixRow } from '../../data/types';
import { Badge } from '../ui';

function applyFilter(filter: 'all' | 'differences' | 'qsafe', row: FeatureMatrixRow) {
  if (filter === 'all') return true;
  const others = [row.e91, row.b92, row.bb84, row.sgs04];
  if (filter === 'qsafe') {
    return row.qsafe === 'yes' && others.some((v) => v !== 'yes');
  }
  return new Set([row.qsafe, ...others]).size > 1;
}

export function FeatureMatrixPanel() {
  const { state, dispatch } = useDashboard();

  const filtered = useMemo(
    () => FEATURE_MATRIX.filter((row) => applyFilter(state.featureFilter, row)),
    [state.featureFilter],
  );

  const qsafeExclusive = FEATURE_MATRIX.filter(
    (row) => row.qsafe === 'yes' && [row.e91, row.b92, row.bb84, row.sgs04].every((v) => v === 'no'),
  ).length;

  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>QSafe Exclusive Features</p>
          <p style={{ fontSize: 30, fontWeight: 700 }}>{qsafeExclusive}</p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Shared With E91</p>
          <p style={{ fontSize: 30, fontWeight: 700 }}>2</p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Paper-only Advantage</p>
          <p style={{ fontSize: 30, fontWeight: 700 }}>1</p>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Feature Matrix</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'SET_FILTER', payload: 'all' })}>Show all</button>
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'SET_FILTER', payload: 'differences' })}>Show only differences</button>
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'SET_FILTER', payload: 'qsafe' })}>QSafe advantages</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '10px 8px' }}>Feature</th>
                <th style={{ padding: '10px 8px' }}>Category</th>
                <th style={{ padding: '10px 8px' }}>QSafe</th>
                <th style={{ padding: '10px 8px' }}>E91</th>
                <th style={{ padding: '10px 8px' }}>B92</th>
                <th style={{ padding: '10px 8px' }}>BB84</th>
                <th style={{ padding: '10px 8px' }}>SGS04</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.feature} style={{ borderBottom: '1px solid var(--border-light)' }} title={row.tooltip}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.feature}</td>
                  <td style={{ padding: '10px 8px', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{row.category}</td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.qsafe} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.e91} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.b92} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.bb84} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.sgs04} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
