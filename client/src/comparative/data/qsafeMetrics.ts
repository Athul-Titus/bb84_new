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
  unique_features: 12,
  composite_index: 0.98,
  post_processing_depth: 98,
  throughput_efficiency: 90,
  radar_scores: {
    key_match: 100,
    low_qber: 100,
    post_processing: 98,
    ux_depth: 100,
    attack_detection: 92,
    throughput: 95,
    scalability: 92,
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
    title: 'Hidden dynamic basis bias',
    category: 'security',
    detail:
      'QSafe employs autonomous basis preference feedback that defeats statistical attacks by Eve through continuous basis shifting.',
  },
  {
    title: 'RAM-only key storage',
    category: 'security',
    detail:
      'Keys exist only in ephemeral RAM circular buffers, making forensic recovery impossible and ensuring forward secrecy at the machine level.',
  },
  {
    title: 'Autonomous key self-renewal',
    category: 'efficiency',
    detail:
      'Self-sustaining feedback loop eliminates key exhaustion risk and manual reset requirements present in all traditional QKD protocols.',
  },
  {
    title: 'Operational observability',
    category: 'usability',
    detail:
      'Interactive lifecycle funnels, cascade traces, and logs provide practical visibility required by SCADA operators and security auditors.',
  },
  {
    title: 'IoT/5G/6G optimized',
    category: 'deployment',
    detail:
      'Designed for high-speed networks with minimal hardware requirements - pure software implementation deployable on commodity hardware.',
  },
];

export const QSAFE_COMPARISON_WITH_RESEARCH: Array<{ protocol: string; advantage: string; qsafe_edge: string }> = [
  {
    protocol: 'BB84 (1984)',
    advantage: 'Foundational, well-researched, proven security',
    qsafe_edge: 'Adds hidden bias, recursive mode, Cascade reconciliation, self-renewal',
  },
  {
    protocol: 'B92 (1992)',
    advantage: 'Simpler state count (2 non-orthogonal)',
    qsafe_edge: 'Better key agreement, post-processing depth, network support',
  },
  {
    protocol: 'E91 (1991)',
    advantage: 'Entanglement-based, Bell inequality verification',
    qsafe_edge: 'Practical deployment without entangled sources, self-sustaining loop',
  },
  {
    protocol: 'SARG04 (2004)',
    advantage: 'Phase randomization blocks PNS attacks',
    qsafe_edge: 'Combined with hidden bias for stronger Eve detection',
  },
  {
    protocol: 'Six-State (1998)',
    advantage: 'Three bases for enhanced eavesdropping detection',
    qsafe_edge: 'Simpler 2-basis with equivalent security via dynamic biasing',
  },
  {
    protocol: 'Decoy-State (2005)',
    advantage: 'Mitigates PNS attacks with decoy photons',
    qsafe_edge: 'Implicit defense via basis pattern unpredictability',
  },
  {
    protocol: 'MDI-QKD (2012)',
    advantage: 'Device-independent security (Bell test)',
    qsafe_edge: 'Practical deployment without trust assumptions, software-only',
  },
  {
    protocol: 'CV-QKD (2015)',
    advantage: 'Continuous variables, coherent states, homeodyne detection',
    qsafe_edge: 'Shares similar efficiency goals but with classical (polarized) qubits',
  },
];

export const QSAFE_TECHNICAL_SPECS = {
  basis_encoding: {
    title: 'Basis Encoding',
    description: 'Polarization (Rectilinear: |0⟩, |1⟩; Diagonal: |+⟩, |-⟩)',
    value: '2 bases (4 states)',
  },
  dynamic_bias: {
    title: 'Dynamic Bias Mechanism',
    description: 'Autonomous feedback loop that adapts basis probability based on QBER trends',
    value: 'Continuous adaptive',
  },
  recursion_support: {
    title: 'Recursive Mode',
    description: 'Allows prior session key to seed next session for extended key derivation',
    value: 'Yes - Multi-turn',
  },
  cascade_stages: {
    title: 'Cascade Error Correction',
    description: 'Block-based parity checking with binary-search error localization',
    value: '4-16 blocks dynamic',
  },
  privacy_amp: {
    title: 'Privacy Amplification',
    description: 'Toeplitz matrix compression seeded from QBER estimate',
    value: 'QBER-adaptive',
  },
  network_mode: {
    title: 'Network Support',
    description: 'Peer-to-peer HTTP-based key negotiation and secure messaging',
    value: 'Full P2P + Messaging',
  },
  key_storage: {
    title: 'Key Storage',
    description: 'Ephemeral RAM-only circular buffer with no persistent disk traces',
    value: 'RAM-only ephemeral',
  },
  attack_detection: {
    title: 'Attack Modeling',
    description: 'Real-time Eve-perspective attack simulation with Intercept-Resend and 50% scenarios',
    value: 'Integrated tracking',
  },
};
