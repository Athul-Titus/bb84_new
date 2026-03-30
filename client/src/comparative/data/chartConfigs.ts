import { PAPER } from './knowledgeBase';
import { QSAFE } from './qsafeMetrics';
import type { AttackScenario, ProtocolKey } from './types';

export const PROTOCOL_COLORS: Record<ProtocolKey, { bg: string; text: string; light: string }> = {
  qsafe: { bg: '#378ADD', text: '#042C53', light: 'rgba(55,138,221,0.18)' },
  e91: { bg: '#1D9E75', text: '#04342C', light: 'rgba(29,158,117,0.12)' },
  b92: { bg: '#BA7517', text: '#412402', light: 'rgba(186,117,23,0.10)' },
  bb84: { bg: '#D85A30', text: '#4A1B0C', light: 'rgba(216,90,48,0.10)' },
  sgs04: { bg: '#888780', text: '#2C2C2A', light: 'rgba(136,135,128,0.10)' },
  sarg04: { bg: '#C17E5C', text: '#4A2414', light: 'rgba(193,126,92,0.10)' },
  sixstate: { bg: '#2E7D32', text: '#1B4620', light: 'rgba(46,125,50,0.10)' },
  decoyphase: { bg: '#FF6F00', text: '#663300', light: 'rgba(255,111,0,0.10)' },
  mdi: { bg: '#0277BD', text: '#001F4D', light: 'rgba(2,119,189,0.10)' },
  cvqkd: { bg: '#6A1B9A', text: '#2D0E47', light: 'rgba(106,27,154,0.10)' },
};

export const PROTOCOL_LABELS: Record<ProtocolKey, string> = {
  qsafe: 'QSafe BB84',
  e91: 'E91',
  b92: 'B92',
  bb84: 'BB84',
  sgs04: 'SGS04',
  sarg04: 'SARG04',
  sixstate: 'Six-State',
  decoyphase: 'Decoy-State',
  mdi: 'MDI-QKD',
  cvqkd: 'CV-QKD',
};

export const ATTACK_QBER: Record<AttackScenario, number[]> = {
  no_attack: [
    QSAFE.qber_ideal,
    PAPER.comparative_results.attack_qber.no_attack['E91'],
    PAPER.comparative_results.attack_qber.no_attack['B92'],
    PAPER.comparative_results.attack_qber.no_attack['BB84'],
    PAPER.comparative_results.attack_qber.no_attack['SGS04'],
    PAPER.comparative_results.attack_qber.no_attack['SARG04'],
    PAPER.comparative_results.attack_qber.no_attack['SIXSTATE'],
    PAPER.comparative_results.attack_qber.no_attack['DECOYPHASE'],
    PAPER.comparative_results.attack_qber.no_attack['MDI'],
    PAPER.comparative_results.attack_qber.no_attack['CVQKD'],
  ],
  intercept_resend: [
    0.11,
    PAPER.comparative_results.attack_qber.intercept_resend['E91'],
    PAPER.comparative_results.attack_qber.intercept_resend['B92'],
    PAPER.comparative_results.attack_qber.intercept_resend['BB84'],
    PAPER.comparative_results.attack_qber.intercept_resend['SGS04'],
    PAPER.comparative_results.attack_qber.intercept_resend['SARG04'],
    PAPER.comparative_results.attack_qber.intercept_resend['SIXSTATE'],
    PAPER.comparative_results.attack_qber.intercept_resend['DECOYPHASE'],
    PAPER.comparative_results.attack_qber.intercept_resend['MDI'],
    PAPER.comparative_results.attack_qber.intercept_resend['CVQKD'],
  ],
  eve_50: [
    0.25,
    PAPER.comparative_results.attack_qber.eve_50_percent['E91'],
    PAPER.comparative_results.attack_qber.eve_50_percent['B92'],
    PAPER.comparative_results.attack_qber.eve_50_percent['BB84'],
    PAPER.comparative_results.attack_qber.eve_50_percent['SGS04'],
    PAPER.comparative_results.attack_qber.eve_50_percent['SARG04'],
    PAPER.comparative_results.attack_qber.eve_50_percent['SIXSTATE'],
    PAPER.comparative_results.attack_qber.eve_50_percent['DECOYPHASE'],
    PAPER.comparative_results.attack_qber.eve_50_percent['MDI'],
    PAPER.comparative_results.attack_qber.eve_50_percent['CVQKD'],
  ],
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
  labels: ['QSafe BB84', 'E91', 'B92', 'BB84', 'SGS04', 'SARG04', 'Six-State', 'Decoy-State', 'MDI-QKD', 'CV-QKD'],
  data: [QSAFE.pipeline_stages, 5, 4, 4, 3, 5, 6, 7, 8, 8],
};

export const LEAKAGE_BREAKDOWN = {
  labels: ['Sifting', 'QBER sampling', 'Cascade parity', 'PA compression', 'Net secret bits'],
  data: [18, 5, 8, 10, 59],
};

export const TIMELINE_POINTS = [
  { label: 'BB84', x: 1984, y: 0.25, key: 'bb84' as const },
  { label: 'E91', x: 1991, y: 1.0, key: 'e91' as const },
  { label: 'B92', x: 1992, y: 0.85, key: 'b92' as const },
  { label: 'Six-State', x: 1998, y: 0.88, key: 'sixstate' as const },
  { label: 'SGS04', x: 2004, y: 0.2, key: 'sgs04' as const },
  { label: 'SARG04', x: 2004, y: 0.65, key: 'sarg04' as const },
  { label: 'Decoy-State', x: 2005, y: 0.92, key: 'decoyphase' as const },
  { label: 'MDI-QKD', x: 2012, y: 0.95, key: 'mdi' as const },
  { label: 'CV-QKD', x: 2015, y: 0.98, key: 'cvqkd' as const },
  { label: 'QSafe BB84', x: QSAFE.year, y: QSAFE.composite_index, key: 'qsafe' as const },
];
