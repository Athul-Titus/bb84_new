import { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { FEATURE_MATRIX } from '../../data/featureMatrix';
import type { FeatureMatrixRow } from '../../data/types';
import { Badge } from '../ui';

function applyFilter(filter: 'all' | 'differences' | 'qsafe', row: FeatureMatrixRow) {
  if (filter === 'all') return true;
  const others = [row.e91, row.b92, row.bb84, row.sgs04, row.sarg04, row.sixstate, row.decoyphase, row.mdi, row.cvqkd];
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
    (row) => row.qsafe === 'yes' && [row.e91, row.b92, row.bb84, row.sgs04, row.sarg04, row.sixstate, row.decoyphase, row.mdi, row.cvqkd].every((v) => v === 'no'),
  ).length;

  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>QSafe Exclusive Features</p>
          <p style={{ fontSize: 30, fontWeight: 700 }}>{qsafeExclusive}</p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Shared With E91/MDI</p>
          <p style={{ fontSize: 30, fontWeight: 700 }}>3</p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Modern Protocols Advantage</p>
          <p style={{ fontSize: 30, fontWeight: 700 }}>2</p>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Extended Feature Matrix</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 13 }}>
          Comparison across 9 protocols + QSafe. Includes legacy (BB84, B92, E91, SGS04) and modern approaches (SARG04, Six-State, Decoy-State, MDI-QKD, CV-QKD).
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'SET_FILTER', payload: 'all' })}>Show all</button>
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'SET_FILTER', payload: 'differences' })}>Show only differences</button>
          <button className="btn btn-secondary" onClick={() => dispatch({ type: 'SET_FILTER', payload: 'qsafe' })}>QSafe advantages</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1200 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                <th style={{ padding: '10px 8px', minWidth: 180 }}>Feature</th>
                <th style={{ padding: '10px 8px', minWidth: 100 }}>Category</th>
                <th style={{ padding: '10px 8px', minWidth: 60 }}>QSafe</th>
                <th style={{ padding: '10px 8px', minWidth: 50 }}>E91</th>
                <th style={{ padding: '10px 8px', minWidth: 50 }}>B92</th>
                <th style={{ padding: '10px 8px', minWidth: 50 }}>BB84</th>
                <th style={{ padding: '10px 8px', minWidth: 50 }}>SGS04</th>
                <th style={{ padding: '10px 8px', minWidth: 60 }}>SARG04</th>
                <th style={{ padding: '10px 8px', minWidth: 60 }}>6-State</th>
                <th style={{ padding: '10px 8px', minWidth: 60 }}>Decoy</th>
                <th style={{ padding: '10px 8px', minWidth: 50 }}>MDI</th>
                <th style={{ padding: '10px 8px', minWidth: 50 }}>CV-QKD</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.feature} style={{ borderBottom: '1px solid var(--border-light)' }} title={row.tooltip}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.feature}</td>
                  <td style={{ padding: '10px 8px', textTransform: 'capitalize', color: 'var(--text-secondary)', fontSize: 12 }}>{row.category}</td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.qsafe} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.e91} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.b92} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.bb84} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.sgs04} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.sarg04 || 'no'} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.sixstate || 'no'} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.decoyphase || 'no'} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.mdi || 'no'} /></td>
                  <td style={{ padding: '10px 8px' }}><Badge status={row.cvqkd || 'no'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
