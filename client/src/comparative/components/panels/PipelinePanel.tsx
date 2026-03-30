import { useEffect, useState } from 'react';
import { LeakageDonut, PipelineDepthChart, ThroughputChart } from '../charts';

const stages = [
  {
    name: 'Generate',
    detail: 'Alice generates random bit and basis strings for the current round.',
    formula: 'b_i ~ Bernoulli(0.5), basis_i ~ Bernoulli(0.5)',
    snippet: 'const bits = randomBits(n); const bases = randomBases(n);',
  },
  {
    name: 'Transmit',
    detail: 'Prepared qubits are sent to Bob through the configured channel/noise model.',
    formula: 'q_i -> channel(noise, eve, loss)',
    snippet: 'await post(/api/generate_keys, payload);',
  },
  {
    name: 'Measure',
    detail: 'Bob measures with his own random basis and records outcomes.',
    formula: 'm_i = Measure(q_i, basis_i^Bob)',
    snippet: 'await post(/api/bob_measure, { bases: bobBases });',
  },
  {
    name: 'Sift',
    detail: 'Only matching basis positions are retained as sifted key material.',
    formula: 'K_sift = { i | basis_i^Alice = basis_i^Bob }',
    snippet: 'await post(/api/sift_keys, {});',
  },
  {
    name: 'Verify / QBER',
    detail: 'QBER is estimated from sampled bits to detect channel intrusion/noise.',
    formula: 'QBER = mismatches / sampled_bits',
    snippet: 'await post(/api/compare_sample, { sample_size });',
  },
  {
    name: 'Cascade Reconcile',
    detail: 'Interactive parity checks and binary search localize and correct mismatches.',
    formula: 'parity(block_A) vs parity(block_B), recurse on mismatch',
    snippet: 'cascade_result = run_cascade(alice, bob, qber);',
  },
  {
    name: 'Privacy Amplify',
    detail: 'Toeplitz compression removes information leakage from reconciled key.',
    formula: 'k_final = T_(m x n) * k_reconciled (mod 2)',
    snippet: 'final_key = toeplitz_pa(corrected_key, leakage_bits);',
  },
  {
    name: 'Fast-Success Check',
    detail: 'If QBER and residual mismatches are zero, expensive loops are skipped.',
    formula: 'if qber = 0 and residual = 0 => short-circuit',
    snippet: 'if (qber === 0 && mismatches === 0) return key;',
  },
  {
    name: 'Final Key',
    detail: 'Shared secret key is finalized and released to secure messaging.',
    formula: 'K_shared = Finalize(K_pa)',
    snippet: 'setSharedKey(finalKey);',
  },
];

export function PipelinePanel() {
  const [selectedStage, setSelectedStage] = useState<(typeof stages)[number] | null>(null);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedStage(null);
      }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);

  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <div className="card">
        <div className="section-title">Pipeline Stage Depth</div>
        <PipelineDepthChart />
      </div>

      <div className="card">
        <div className="section-title">QSafe 9-Stage Pipeline</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>
          Click a stage to open implementation details, equations, and representative code.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {stages.map((stage, idx) => (
            <button
              key={stage.name}
              className="btn btn-secondary"
              style={{ fontSize: 13, padding: '8px 10px' }}
              title={`Stage ${idx + 1}: ${stage.detail}`}
              onClick={() => setSelectedStage(stage)}
            >
              {idx + 1}. {stage.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))' }}>
        <div className="card">
          <div className="section-title">Information Leakage Breakdown</div>
          <LeakageDonut />
        </div>
        <div className="card">
          <div className="section-title">Throughput Efficiency</div>
          <ThroughputChart />
        </div>
      </div>

      {selectedStage ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedStage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17,24,20,0.45)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(760px, 100%)', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 22, margin: 0 }}>{selectedStage.name}</h3>
              <button className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={() => setSelectedStage(null)}>
                Close
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>{selectedStage.detail}</p>

            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 700, marginBottom: 6 }}>Formula</p>
              <div
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 10,
                  padding: 10,
                  background: 'var(--bg-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                }}
              >
                {selectedStage.formula}
              </div>
            </div>

            <div>
              <p style={{ fontWeight: 700, marginBottom: 6 }}>Representative Snippet</p>
              <pre
                style={{
                  margin: 0,
                  border: '1px solid var(--border-light)',
                  borderRadius: 10,
                  padding: 10,
                  background: '#0f1613',
                  color: '#dff8e8',
                  fontSize: 12,
                  overflowX: 'auto',
                }}
              >
                <code>{selectedStage.snippet}</code>
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
