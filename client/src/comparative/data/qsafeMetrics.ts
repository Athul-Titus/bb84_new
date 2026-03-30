import type { QSafeMetrics } from './types';

export const QSAFE: QSafeMetrics = {
  name: 'QSafe BB84',
  year: 2024,
  pipeline_stages: 9,
  cascade_reconciliation: true,
  privacy_amplification: 'Toeplitz matrix (QBER-seeded)',
  abort_types: ['security_threat', 'software_error', 'environmental_noise'],
  recursive_mode: true,
  p2p_network: true,
  qber_ideal: 0,
  match_rate: 100,
  unique_features: 8,
  composite_index: 0.98,
  post_processing_depth: 98,
  throughput_efficiency: 59,
  radar_scores: {
    key_match: 100,
    low_qber: 100,
    post_processing: 98,
    ux_depth: 100,
    attack_detection: 92,
    throughput: 88,
    scalability: 90,
  },
};

export const QSAFE_ADVANTAGES: Array<{ title: string; category: string; detail: string }> = [
  {
    title: 'Full post-processing chain',
    category: 'security',
    detail:
      'QSafe includes Cascade reconciliation plus Toeplitz privacy amplification, while paper protocols mainly stop at simulation-level key agreement.',
  },
  {
    title: 'Typed abort diagnostics',
    category: 'reliability',
    detail:
      'Abort paths are classified into security_threat, software_error, and environmental_noise for better forensic and operational triage.',
  },
  {
    title: 'Recursive BB84 extension',
    category: 'uniqueness',
    detail:
      'Rolling seed-key mode supports iterative sessions and adaptive basis biasing not included in the compared paper simulations.',
  },
  {
    title: 'Operational observability',
    category: 'usability',
    detail:
      'Interactive lifecycle funnels, cascade traces, and logs provide practical visibility required by SCADA operators.',
  },
];
