import { useMemo } from 'react';
import { PAPER } from '../data/knowledgeBase';
import { QSAFE } from '../data/qsafeMetrics';
import { ATTACK_QBER, RADAR_LABELS } from '../data/chartConfigs';
import type { AttackScenario, ProtocolKey } from '../data/types';

export function useProtocolData(attackScenario: AttackScenario = 'no_attack') {
  const protocols = useMemo(
    () => ({
      qsafe: {
        key: 'qsafe' as const,
        label: 'QSafe BB84',
        year: QSAFE.year,
        authors: 'QSafe Engineering Team',
        key_idea: 'Extended BB84 with post-processing hardening',
        basis_states: 4,
        security_basis: 'QBER gating + Cascade + Toeplitz PA',
        description:
          'QSafe extends BB84 with production-style post-processing, typed abort diagnostics, and distributed execution controls focused on operational reliability.',
        flow: [
          'Generate random bits and bases',
          'Transmit over quantum channel',
          'Sift matching-basis bits',
          'Compute QBER and classify abort risk',
          'Run Cascade reconciliation',
          'Apply Toeplitz privacy amplification',
          'Emit final secure key',
        ],
        results: {
          sample_qber: [0, 0, 0.01, 0, 0],
          sample_match: [true, true, true, true, true],
          avg_key_size: 3.2,
          match_rate: QSAFE.match_rate,
          composite_index: QSAFE.composite_index,
          strength: 'Adds production-ready post-processing and operational controls while preserving ideal match performance.',
        },
        radar_scores: QSAFE.radar_scores,
      },
      e91: { key: 'e91' as const, label: 'E91', ...PAPER.protocols.E91 },
      b92: { key: 'b92' as const, label: 'B92', ...PAPER.protocols.B92 },
      bb84: { key: 'bb84' as const, label: 'BB84 sim', ...PAPER.protocols.BB84 },
      sgs04: { key: 'sgs04' as const, label: 'SGS04', ...PAPER.protocols.SGS04 },
    }),
    [],
  );

  const attackData = useMemo(() => ATTACK_QBER[attackScenario], [attackScenario]);

  const getRadarScores = (protocol: ProtocolKey) => {
    const p = protocols[protocol];
    return [
      p.radar_scores.key_match,
      p.radar_scores.low_qber,
      p.radar_scores.post_processing,
      p.radar_scores.ux_depth,
      p.radar_scores.attack_detection,
      p.radar_scores.throughput,
      p.radar_scores.scalability,
    ];
  };

  return {
    protocols,
    attackData,
    radarLabels: RADAR_LABELS,
    getRadarScores,
  };
}
