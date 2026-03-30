import type { ReactNode } from 'react';
import { BarChart3, Bot, Gauge, Layers, ListChecks, ShieldAlert, Key, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardProvider, useDashboard, type DashboardTab } from './context/DashboardContext';
import {
  AIAnalysisPanel,
  FeatureMatrixPanel,
  KeyManagementPanel,
  OverviewPanel,
  PerformanceMetricsPanel,
  PipelinePanel,
  ProtocolDeepDivePanel,
  QBERPanel,
} from './components/panels';

const TABS: Array<{ id: DashboardTab; label: string; icon: ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <Gauge size={15} /> },
  { id: 'qber', label: 'QBER & Security', icon: <ShieldAlert size={15} /> },
  { id: 'features', label: 'Feature Matrix', icon: <ListChecks size={15} /> },
  { id: 'pipeline', label: 'Pipeline Depth', icon: <Layers size={15} /> },
  { id: 'deepdive', label: 'Protocol Deep Dive', icon: <BarChart3 size={15} /> },
  { id: 'keymanagement', label: 'Key Management', icon: <Key size={15} /> },
  { id: 'performance', label: 'Performance', icon: <Zap size={15} /> },
  { id: 'ai', label: 'AI Analysis', icon: <Bot size={15} /> },
];

function DashboardBody() {
  const { state, dispatch } = useDashboard();

  const panel = {
    overview: <OverviewPanel />,
    qber: <QBERPanel />,
    features: <FeatureMatrixPanel />,
    pipeline: <PipelinePanel />,
    deepdive: <ProtocolDeepDivePanel />,
    keymanagement: <KeyManagementPanel />,
    performance: <PerformanceMetricsPanel />,
    ai: <AIAnalysisPanel />,
  }[state.activeTab];

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <header className="card" style={{ padding: 18 }}>
        <h2 style={{ fontSize: 24, marginBottom: 6 }}>QSafe vs Research & Modern Protocols</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
          Extended comparative analysis of QSafe BB84 against 9 research protocols: BB84, B92, E91, SGS04, SARG04,
          Six-State, Decoy-State, MDI-QKD, and CV-QKD. Includes key management, performance metrics, and security
          analysis.
        </p>
        <nav style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch({ type: 'SET_TAB', payload: tab.id })}
              className="btn"
              style={{
                padding: '8px 12px',
                whiteSpace: 'nowrap',
                background: state.activeTab === tab.id ? 'var(--accent-primary)' : 'var(--bg-sidebar)',
                color: state.activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              }}
            >
              <span style={{ display: 'inline-flex', marginRight: 6 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={state.activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {panel}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function ComparativeDashboard() {
  return (
    <DashboardProvider>
      <DashboardBody />
    </DashboardProvider>
  );
}
