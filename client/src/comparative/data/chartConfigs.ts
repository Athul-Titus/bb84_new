import { PAPER } from './knowledgeBase';
import { QSAFE } from './qsafeMetrics';
import type { AttackScenario, ProtocolKey } from './types';

export const PROTOCOL_COLORS: Record<ProtocolKey, { bg: string; text: string; light: string }> = {
  qsafe: { bg: '#378ADD', text: '#042C53', light: 'rgba(55,138,221,0.18)' },
  e91: { bg: '#1D9E75', text: '#04342C', light: 'rgba(29,158,117,0.12)' },
  b92: { bg: '#BA7517', text: '#412402', light: 'rgba(186,117,23,0.10)' },
  bb84: { bg: '#D85A30', text: '#4A1B0C', light: 'rgba(216,90,48,0.10)' },
  sgs04: { bg: '#888780', text: '#2C2C2A', light: 'rgba(136,135,128,0.10)' },
};

export const PROTOCOL_LABELS: Record<ProtocolKey, string> = {
  qsafe: 'QSafe BB84',
  e91: 'E91',
  b92: 'B92',
  bb84: 'BB84 sim',
  sgs04: 'SGS04',
};

export const ATTACK_QBER: Record<AttackScenario, number[]> = {
  no_attack: [QSAFE.qber_ideal, PAPER.comparative_results.attack_qber.no_attack.E91, PAPER.comparative_results.attack_qber.no_attack.B92, PAPER.comparative_results.attack_qber.no_attack.BB84, PAPER.comparative_results.attack_qber.no_attack.SGS04],
  intercept_resend: [0.11, PAPER.comparative_results.attack_qber.intercept_resend.E91, PAPER.comparative_results.attack_qber.intercept_resend.B92, PAPER.comparative_results.attack_qber.intercept_resend.BB84, PAPER.comparative_results.attack_qber.intercept_resend.SGS04],
  eve_50: [0.25, PAPER.comparative_results.attack_qber.eve_50_percent.E91, PAPER.comparative_results.attack_qber.eve_50_percent.B92, PAPER.comparative_results.attack_qber.eve_50_percent.BB84, PAPER.comparative_results.attack_qber.eve_50_percent.SGS04],
};

export const RADAR_LABELS = [
  'Key Match Rate',
  'Low QBER',
  'Post-Processing',
  'UX Depth',
  'Attack Detection',
  'Throughput',
  'Scalability',
];

export const PIPELINE_STAGES = {
  labels: ['QSafe BB84', 'E91 (paper)', 'B92 (paper)', 'BB84 sim (paper)', 'SGS04 (paper)'],
  data: [QSAFE.pipeline_stages, 5, 4, 4, 3],
};

export const LEAKAGE_BREAKDOWN = {
  labels: ['Sifting', 'QBER sampling', 'Cascade parity', 'PA compression', 'Net secret bits'],
  data: [18, 5, 8, 10, 59],
};

export const TIMELINE_POINTS = [
  { label: 'BB84', x: 1984, y: 0.25, key: 'bb84' as const },
  { label: 'E91', x: 1991, y: 1.0, key: 'e91' as const },
  { label: 'B92', x: 1992, y: 0.85, key: 'b92' as const },
  { label: 'SGS04', x: 2004, y: 0.2, key: 'sgs04' as const },
  { label: 'QSafe BB84', x: QSAFE.year, y: QSAFE.composite_index, key: 'qsafe' as const },
];
