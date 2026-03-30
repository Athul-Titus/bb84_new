import { Lock, RotateCw, ShieldAlert } from 'lucide-react';
import { KEY_MANAGEMENT_COMPARISON, KEY_MANAGEMENT_FEATURES } from '../../data/keyManagement';

export function KeyManagementPanel() {
  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <div className="card">
        <div className="section-title">Key Management Characteristics</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 14, fontSize: 13 }}>
          Comparison of key storage, recovery, renewal, and security properties across all protocols.
        </p>

        <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
            <div className="card" style={{ padding: 14, backgroundColor: 'var(--bg-sidebar)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Lock size={16} color="#378ADD" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Key Storage</span>
              </div>
              <p style={{ fontSize: 13 }}>Traditional: Disk/database | QSafe: RAM-only</p>
            </div>
            <div className="card" style={{ padding: 14, backgroundColor: 'var(--bg-sidebar)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <RotateCw size={16} color="#1D9E75" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Self-Renewal</span>
              </div>
              <p style={{ fontSize: 13 }}>Traditional: Manual | QSafe: Autonomous feedback loop</p>
            </div>
            <div className="card" style={{ padding: 14, backgroundColor: 'var(--bg-sidebar)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <ShieldAlert size={16} color="#D85A30" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Forward Secrecy</span>
              </div>
              <p style={{ fontSize: 13 }}>Traditional: Partial | QSafe: Full (per-message)</p>
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                <th style={{ padding: '12px 8px', minWidth: 100, fontWeight: 600 }}>Protocol</th>
                <th style={{ padding: '12px 8px', minWidth: 140 }}>Key Storage</th>
                <th style={{ padding: '12px 8px', minWidth: 140 }}>Forensic Recovery</th>
                <th style={{ padding: '12px 8px', minWidth: 140 }}>Self-Renewal</th>
                <th style={{ padding: '12px 8px', minWidth: 120 }}>Forward Secrecy</th>
                <th style={{ padding: '12px 8px', minWidth: 130 }}>Key Exhaustion Risk</th>
                <th style={{ padding: '12px 8px', minWidth: 150 }}>Authentication Method</th>
              </tr>
            </thead>
            <tbody>
              {KEY_MANAGEMENT_COMPARISON.map((row) => {
                const isQSafe = row.protocol === 'QSafe (Your Protocol)';
                return (
                  <tr
                    key={row.protocol}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      backgroundColor: isQSafe ? 'rgba(55,138,221,0.08)' : 'transparent',
                      fontWeight: isQSafe ? 600 : 400,
                    }}
                  >
                    <td style={{ padding: '12px 8px', fontWeight: isQSafe ? 700 : 600 }}>{row.protocol}</td>
                    <td style={{ padding: '12px 8px', fontSize: 13 }}>{row.keyStorage}</td>
                    <td style={{ padding: '12px 8px', fontSize: 13 }}>{row.forensicRecovery}</td>
                    <td style={{ padding: '12px 8px', fontSize: 13 }}>{row.selfRenewal}</td>
                    <td style={{ padding: '12px 8px', fontSize: 13 }}>{row.forwardSecrecy}</td>
                    <td style={{ padding: '12px 8px', fontSize: 13 }}>{row.keyExhaustionRisk}</td>
                    <td style={{ padding: '12px 8px', fontSize: 13 }}>{row.authentication}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Key Management Features Explained</div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))' }}>
          {Object.entries(KEY_MANAGEMENT_FEATURES).map(([key, feature]) => (
            <div
              key={key}
              style={{
                padding: 14,
                backgroundColor: 'var(--bg-sidebar)',
                borderRadius: 6,
                border: '1px solid var(--border-light)',
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: 6 }}>{feature.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{feature.description}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{feature.tooltip}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
