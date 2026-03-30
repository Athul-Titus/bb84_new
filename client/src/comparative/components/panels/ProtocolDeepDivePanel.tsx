import { useDashboard } from '../../context/DashboardContext';
import { PROTOCOL_LABELS, PROTOCOL_COLORS } from '../../data/chartConfigs';
import { useProtocolData } from '../../hooks/useProtocolData';
import type { ProtocolKey } from '../../data/types';
import { TimelineChart } from '../charts';
import { ProtocolTag } from '../ui';

const keys: ProtocolKey[] = ['qsafe', 'e91', 'b92', 'bb84', 'sgs04'];

export function ProtocolDeepDivePanel() {
  const { state, dispatch } = useDashboard();
  const { protocols } = useProtocolData();

  const selected = protocols[state.activeProtocol];

  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <div className="card">
        <div className="section-title">Protocol Selector</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => dispatch({ type: 'SET_PROTOCOL', payload: k })}
              className="btn"
              style={{
                padding: '8px 12px',
                border: `1px solid ${PROTOCOL_COLORS[k].bg}`,
                background: state.activeProtocol === k ? PROTOCOL_COLORS[k].light : 'transparent',
                color: PROTOCOL_COLORS[k].text,
              }}
            >
              {PROTOCOL_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="section-title">Protocol Detail</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <ProtocolTag protocol={state.activeProtocol} label={selected.label} />
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{selected.year}</span>
        </div>
        <p style={{ marginBottom: 6 }}><strong>Authors:</strong> {selected.authors}</p>
        <p style={{ marginBottom: 6 }}><strong>Security basis:</strong> {selected.security_basis}</p>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{selected.description}</p>

        <p style={{ fontWeight: 700, marginBottom: 8 }}>Protocol Flow</p>
        <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>
          {selected.flow.map((step) => (
            <li key={step} style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{step}</li>
          ))}
        </ol>

        <div style={{ marginTop: 14, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
          <p><strong>Avg key size:</strong> {selected.results.avg_key_size}</p>
          <p><strong>Match rate:</strong> {selected.results.match_rate}%</p>
          <p><strong>Composite index:</strong> {selected.results.composite_index}</p>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Protocol Evolution Timeline</div>
        <TimelineChart />
      </div>
    </section>
  );
}
