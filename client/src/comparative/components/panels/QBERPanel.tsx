import { useDashboard } from '../../context/DashboardContext';
import { GroupedAttackChart, QBERAttackChart, CorrectionDepthBars, SecurityCapabilitiesChart } from '../charts';
import type { AttackScenario } from '../../data/types';

const SCENARIOS: Array<{ key: AttackScenario; label: string }> = [
  { key: 'no_attack', label: 'No attack' },
  { key: 'intercept_resend', label: 'Intercept-resend' },
  { key: 'eve_50', label: 'Eve 50% intercept' },
];

export function QBERPanel() {
  const { state, dispatch } = useDashboard();

  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <div className="card">
        <div className="section-title">QBER Under Attack Conditions</div>
        <GroupedAttackChart />
      </div>

      <div className="card">
        <div className="section-title">Scenario Explorer</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              className="btn"
              style={{
                padding: '8px 12px',
                background: state.attackScenario === s.key ? 'var(--accent-primary)' : 'var(--bg-sidebar)',
                color: state.attackScenario === s.key ? '#fff' : 'var(--text-secondary)',
              }}
              onClick={() => dispatch({ type: 'SET_ATTACK', payload: s.key })}
            >
              {s.label}
            </button>
          ))}
        </div>
        <QBERAttackChart scenario={state.attackScenario} />
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
        <div className="card">
          <div className="section-title">Post-processing Correction Depth</div>
          <CorrectionDepthBars />
        </div>
        <div className="card">
          <div className="section-title">Security Capability Scores</div>
          <SecurityCapabilitiesChart />
        </div>
      </div>
    </section>
  );
}
