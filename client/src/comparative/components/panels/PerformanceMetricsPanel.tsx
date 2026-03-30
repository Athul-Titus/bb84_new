import { useMemo, useState } from 'react';
import { Zap, Shield, Cpu, Gauge } from 'lucide-react';
import { PERFORMANCE_METRICS, PERFORMANCE_CATEGORIES } from '../../data/performanceMetrics';

type MetricCategory = keyof typeof PERFORMANCE_CATEGORIES;

export function PerformanceMetricsPanel() {
  const [activeCategory, setActiveCategory] = useState<MetricCategory>('coreDesign');

  const categories: { id: MetricCategory; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'coreDesign', label: 'Core Design', icon: <Cpu size={16} />, color: '#378ADD' },
    { id: 'efficiency', label: 'Efficiency', icon: <Zap size={16} />, color: '#1D9E75' },
    { id: 'security', label: 'Security', icon: <Shield size={16} />, color: '#D85A30' },
    { id: 'deployment', label: 'Deployment', icon: <Gauge size={16} />, color: '#BA7517' },
  ];

  const categoryMetrics = useMemo(() => {
    return PERFORMANCE_CATEGORIES[activeCategory];
  }, [activeCategory]);

  const metrics = useMemo(() => {
    return categoryMetrics.map((metric) => ({
      metric,
      values: PERFORMANCE_METRICS.map((proto) => ({
        protocol: proto.protocol,
        value: proto[metric as keyof typeof proto],
      })),
    }));
  }, [categoryMetrics]);

  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <div className="card">
        <div className="section-title">Performance & Capability Matrix</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 14, fontSize: 13 }}>
          Comprehensive comparison across core design, efficiency, security, and deployment dimensions. Click tabs to
          explore each category.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="btn"
              style={{
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: activeCategory === cat.id ? cat.color : 'var(--bg-sidebar)',
                color: activeCategory === cat.id ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${activeCategory === cat.id ? cat.color : 'var(--border-light)'}`,
              }}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1100 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-light)' }}>
                <th style={{ padding: '12px 8px', minWidth: 100, fontWeight: 600 }}>Metric</th>
                {PERFORMANCE_METRICS.map((proto) => (
                  <th
                    key={proto.protocol}
                    style={{
                      padding: '12px 8px',
                      minWidth: 110,
                      fontWeight: proto.protocol === 'QSafe (Your Protocol)' ? 700 : 600,
                      backgroundColor:
                        proto.protocol === 'QSafe (Your Protocol)' ? 'rgba(55,138,221,0.08)' : 'transparent',
                    }}
                  >
                    {proto.protocol === 'QSafe (Your Protocol)' ? '★ QSafe' : proto.protocol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((row) => (
                <tr key={row.metric} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 600, fontSize: 13, verticalAlign: 'top' }}>
                    {row.metric}
                  </td>
                  {row.values.map((cell) => (
                    <td
                      key={cell.protocol}
                      style={{
                        padding: '12px 8px',
                        fontSize: 12,
                        backgroundColor:
                          cell.protocol === 'QSafe (Your Protocol)' ? 'rgba(55,138,221,0.06)' : 'transparent',
                        fontWeight: cell.protocol === 'QSafe (Your Protocol)' ? 600 : 400,
                        maxWidth: 110,
                        wordBreak: 'break-word',
                      }}
                    >
                      {String(cell.value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Category Insights</div>
        <div style={{ padding: 14, backgroundColor: 'var(--bg-sidebar)', borderRadius: 6 }}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13 }}>
            {activeCategory === 'coreDesign' &&
              'Core design parameters determine the fundamental approach: polarization vs entanglement vs continuous variables. QSafe uses classical polarization with dynamic biasing.'}
            {activeCategory === 'efficiency' &&
              'Efficiency metrics include sifting efficiency (percentage of useful bits retained) and secret key rate. QSafe achieves ~90% sifting with autonomous bias adaptation.'}
            {activeCategory === 'security' &&
              'Security measures include QBER thresholds, attack detection speeds, and vulnerability resistance. QSafe combines hidden bias with explicit QBER monitoring.'}
            {activeCategory === 'deployment' &&
              'Deployment readiness spans from research/novel (QSafe) to very mature (BB84). Historical note: protocols mature 20-40 years after publication.'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="section-title">QSafe Comparative Advantages</div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ padding: 12, backgroundColor: 'rgba(55,138,221,0.08)', borderLeft: '4px solid #378ADD', borderRadius: 4 }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Hardware Requirements</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              QSafe: Software-only, no specialized hardware | Others: Require quantum optics equipment
            </p>
          </div>
          <div style={{ padding: 12, backgroundColor: 'rgba(29,158,117,0.08)', borderLeft: '4px solid #1D9E75', borderRadius: 4 }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Self-Sustainability</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              QSafe: Autonomous feedback loop eliminates key exhaustion | Others: Manual reset or continuous external supply
            </p>
          </div>
          <div style={{ padding: 12, backgroundColor: 'rgba(216,90,48,0.08)', borderLeft: '4px solid #D85A30', borderRadius: 4 }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Deployment Speed</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              QSafe: Instant software deployment | Emerging protocols: 5-10 year maturation; Legacy: 20-40 year production readiness
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
