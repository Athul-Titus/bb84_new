import { Activity, Gauge, Layers, ShieldCheck } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { QSAFE } from '../../data/qsafeMetrics';
import { CompositeIndexChart, MatchRateChart, ProtocolRadarChart, AvgQBERChart } from '../charts';
import { CompareToggle, MetricCard } from '../ui';

export function OverviewPanel() {
  const { state } = useDashboard();

  return (
    <section style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
        <MetricCard label="QSafe QBER" value="0.00" sub="Ideal-channel baseline" icon={<ShieldCheck size={20} color="#1D9E75" />} />
        <MetricCard label="Key Match Rate" value="100%" sub="QSafe and top paper protocols" icon={<Gauge size={20} color="#378ADD" />} />
        <MetricCard label="Pipeline Stages" value={QSAFE.pipeline_stages} sub="Paper protocols typically 3-5" icon={<Layers size={20} color="#BA7517" />} />
        <MetricCard label="Unique Features" value={QSAFE.unique_features} sub="Not present in paper simulations" icon={<Activity size={20} color="#D85A30" />} />
      </div>

      <div className="card">
        <div className="section-title">Protocol Radar Comparison</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>QSafe is filled; paper protocols are comparison outlines. Toggle protocol visibility below.</p>
        <CompareToggle />
        <div style={{ marginTop: 12 }}>
          <ProtocolRadarChart visibleProtocols={state.visibleProtocols} />
        </div>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))' }}>
        <div className="card">
          <div className="section-title">Match Rate (%)</div>
          <MatchRateChart />
        </div>
        <div className="card">
          <div className="section-title">Average QBER</div>
          <AvgQBERChart />
        </div>
      </div>

      <div className="card">
        <div className="section-title">Composite Index Ranking</div>
        <CompositeIndexChart />
      </div>
    </section>
  );
}
