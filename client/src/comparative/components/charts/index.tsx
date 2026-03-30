import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  type ChartData,
} from 'chart.js';
import { Bar, Doughnut, Radar, Scatter } from 'react-chartjs-2';
import { ATTACK_QBER, LEAKAGE_BREAKDOWN, PIPELINE_STAGES, PROTOCOL_COLORS, PROTOCOL_LABELS, TIMELINE_POINTS } from '../../data/chartConfigs';
import { useProtocolData } from '../../hooks/useProtocolData';
import type { AttackScenario, ProtocolKey } from '../../data/types';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

const PROTOCOL_ORDER: ProtocolKey[] = ['qsafe', 'e91', 'b92', 'bb84', 'sgs04'];

export function ProtocolRadarChart({ visibleProtocols }: { visibleProtocols: Record<ProtocolKey, boolean> }) {
  const { getRadarScores, radarLabels } = useProtocolData();

  const datasets = PROTOCOL_ORDER.filter((key) => visibleProtocols[key]).map((key) => ({
    label: PROTOCOL_LABELS[key],
    data: getRadarScores(key),
    borderColor: PROTOCOL_COLORS[key].bg,
    backgroundColor: PROTOCOL_COLORS[key].light,
    borderWidth: key === 'qsafe' ? 2.5 : 1.5,
  }));

  return (
    <div style={{ height: 320 }}>
      <Radar
        data={{ labels: radarLabels, datasets }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: 0,
              max: 100,
              ticks: { display: false },
              grid: { color: 'rgba(128,128,128,0.15)' },
              pointLabels: { color: '#66706c', font: { size: 11 } },
            },
          },
        }}
      />
    </div>
  );
}

export function MatchRateChart() {
  const { protocols } = useProtocolData();
  const data = PROTOCOL_ORDER.map((k) => protocols[k].results.match_rate);
  return (
    <div style={{ height: 230 }}>
      <Bar
        data={{
          labels: PROTOCOL_ORDER.map((k) => PROTOCOL_LABELS[k]),
          datasets: [{ data, backgroundColor: PROTOCOL_ORDER.map((k) => PROTOCOL_COLORS[k].bg), borderRadius: 8 }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0, max: 110, ticks: { callback: (v) => `${v}%` } },
          },
        }}
      />
    </div>
  );
}

export function AvgQBERChart() {
  const values = [0, 0, 0, 0.18, 0.22];
  return (
    <div style={{ height: 230 }}>
      <Bar
        data={{
          labels: PROTOCOL_ORDER.map((k) => PROTOCOL_LABELS[k]),
          datasets: [{ data: values, backgroundColor: PROTOCOL_ORDER.map((k) => PROTOCOL_COLORS[k].bg), borderRadius: 8 }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0, max: 0.5 },
          },
        }}
      />
    </div>
  );
}

export function GroupedAttackChart() {
  const labels = PROTOCOL_ORDER.map((k) => PROTOCOL_LABELS[k]);
  return (
    <div style={{ height: 300 }}>
      <Bar
        data={{
          labels,
          datasets: [
            { label: 'No attack', data: ATTACK_QBER.no_attack, backgroundColor: 'rgba(55,138,221,0.8)', borderRadius: 4 },
            { label: 'Intercept-resend', data: ATTACK_QBER.intercept_resend, backgroundColor: 'rgba(216,90,48,0.8)', borderRadius: 4 },
            { label: 'Eve 50%', data: ATTACK_QBER.eve_50, backgroundColor: 'rgba(163,45,45,0.8)', borderRadius: 4 },
          ],
        }}
        options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 0.6 } } }}
      />
    </div>
  );
}

export function QBERAttackChart({ scenario }: { scenario: AttackScenario }) {
  const labels = PROTOCOL_ORDER.map((k) => PROTOCOL_LABELS[k]);
  const data = ATTACK_QBER[scenario];
  return (
    <div style={{ height: 260 }}>
      <Bar
        data={{ labels, datasets: [{ data, backgroundColor: PROTOCOL_ORDER.map((k) => PROTOCOL_COLORS[k].bg), borderRadius: 6 }] }}
        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 0.6 } } }}
      />
    </div>
  );
}

export function PipelineDepthChart() {
  return (
    <div style={{ height: 250 }}>
      <Bar
        data={{
          labels: PIPELINE_STAGES.labels,
          datasets: [{ data: PIPELINE_STAGES.data, backgroundColor: PROTOCOL_ORDER.map((k) => PROTOCOL_COLORS[k].bg), borderRadius: 8 }],
        }}
        options={{ responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { min: 0, max: 10 } } }}
      />
    </div>
  );
}

export function LeakageDonut() {
  return (
    <div style={{ height: 240 }}>
      <Doughnut
        data={{
          labels: LEAKAGE_BREAKDOWN.labels,
          datasets: [{ data: LEAKAGE_BREAKDOWN.data, backgroundColor: ['#B5D4F4', '#9FE1CB', '#FAC775', '#F5C4B3', '#378ADD'] }],
        }}
        options={{ responsive: true, maintainAspectRatio: false, cutout: '58%' }}
      />
    </div>
  );
}

export function ThroughputChart() {
  const data = [59, 65, 55, 45, 38];
  return (
    <div style={{ height: 230 }}>
      <Bar
        data={{
          labels: PROTOCOL_ORDER.map((k) => PROTOCOL_LABELS[k]),
          datasets: [{ data, backgroundColor: PROTOCOL_ORDER.map((k) => PROTOCOL_COLORS[k].bg), borderRadius: 8 }],
        }}
        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 80 } } }}
      />
    </div>
  );
}

export function CompositeIndexChart() {
  const data = [0.98, 1.0, 0.85, 0.25, 0.2];
  return (
    <div style={{ height: 230 }}>
      <Bar
        data={{
          labels: ['QSafe BB84', 'E91', 'B92', 'BB84 sim', 'SGS04'],
          datasets: [
            {
              data,
              backgroundColor: [
                PROTOCOL_COLORS.qsafe.bg,
                PROTOCOL_COLORS.e91.bg,
                PROTOCOL_COLORS.b92.bg,
                PROTOCOL_COLORS.bb84.bg,
                PROTOCOL_COLORS.sgs04.bg,
              ],
              borderRadius: 8,
            },
          ],
        }}
        options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 1.1 } } }}
      />
    </div>
  );
}

export function SecurityCapabilitiesChart() {
  const labels = ['Abort class.', 'Cascade', 'Privacy amp.', 'Attack detect.', 'Noise model', 'Residual diag.'];
  return (
    <div style={{ height: 290 }}>
      <Bar
        data={{
          labels,
          datasets: [
            { label: 'QSafe', data: [100, 98, 95, 92, 90, 88], backgroundColor: 'rgba(55,138,221,0.8)' },
            { label: 'E91', data: [0, 0, 0, 85, 20, 0], backgroundColor: 'rgba(29,158,117,0.8)' },
            { label: 'B92', data: [0, 0, 0, 70, 10, 0], backgroundColor: 'rgba(186,117,23,0.8)' },
            { label: 'BB84 sim', data: [0, 0, 0, 65, 30, 0], backgroundColor: 'rgba(216,90,48,0.8)' },
          ],
        }}
        options={{ responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 110 } } }}
      />
    </div>
  );
}

export function CorrectionDepthBars() {
  const rows = [
    { label: 'QSafe BB84', desc: 'Adaptive Cascade + Toeplitz PA', value: 98, color: PROTOCOL_COLORS.qsafe.bg },
    { label: 'E91 (paper)', desc: 'Sift + standard PA', value: 80, color: PROTOCOL_COLORS.e91.bg },
    { label: 'B92 (paper)', desc: 'Conclusive sifting', value: 60, color: PROTOCOL_COLORS.b92.bg },
    { label: 'BB84 sim', desc: 'Basic threshold QBER', value: 42, color: PROTOCOL_COLORS.bb84.bg },
    { label: 'SGS04', desc: 'Parameter estimation only', value: 30, color: PROTOCOL_COLORS.sgs04.bg },
  ];

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {rows.map((r) => (
        <div key={r.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>{r.label}</span>
            <span>{r.desc}</span>
          </div>
          <div style={{ background: 'var(--bg-sidebar)', borderRadius: 999, height: 16, overflow: 'hidden' }}>
            <div style={{ width: `${r.value}%`, background: r.color, color: '#fff', height: '100%', fontSize: 11, paddingLeft: 8 }}>{r.value}%</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelineChart() {
  const data: ChartData<'scatter'> = {
    datasets: TIMELINE_POINTS.map((point) => ({
      label: point.label,
      data: [{ x: point.x, y: point.y }],
      pointBackgroundColor: PROTOCOL_COLORS[point.key].bg,
      pointRadius: point.key === 'qsafe' ? 9 : 7,
    })),
  };

  return (
    <div style={{ height: 260 }}>
      <Scatter
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { min: 1980, max: 2028 }, y: { min: 0, max: 1.1 } },
          plugins: {
            tooltip: {
              callbacks: {
                label(context) {
                  const y = typeof context.parsed.y === 'number' ? context.parsed.y : 0;
                  return `${context.dataset.label}: ${y.toFixed(2)}`;
                },
              },
            },
          },
        }}
      />
    </div>
  );
}
