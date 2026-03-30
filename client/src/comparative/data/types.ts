export type ProtocolKey = 'qsafe' | 'e91' | 'b92' | 'bb84' | 'sgs04' | 'sarg04' | 'sixstate' | 'decoyphase' | 'mdi' | 'cvqkd';

export type AttackScenario = 'no_attack' | 'intercept_resend' | 'eve_50';

export interface ProtocolResult {
  sample_qber: number[];
  sample_match: boolean[];
  avg_key_size: number;
  match_rate: number;
  composite_index: number;
  strength?: string;
  weakness?: string;
  unique_capability?: string;
}

export interface PaperProtocol {
  year: number;
  authors: string;
  key_idea: string;
  basis_states: number | string;
  security_basis: string;
  color: string;
  description: string;
  flow: string[];
  results: ProtocolResult;
  radar_scores: {
    key_match: number;
    low_qber: number;
    post_processing: number;
    ux_depth: number;
    attack_detection: number;
    throughput: number;
    scalability: number;
  };
}

export interface PaperKnowledgeBase {
  metadata: {
    title: string;
    authors: string[];
    institution: string;
    keywords: string[];
    dataset: string;
    simulation_tool: string;
    encoding_method: string;
    fields_used: number;
  };
  protocols: {
    BB84: PaperProtocol;
    B92: PaperProtocol;
    E91: PaperProtocol;
    SGS04: PaperProtocol;
    SARG04?: PaperProtocol;
    SIXSTATE?: PaperProtocol;
    DECOYPHASE?: PaperProtocol;
    MDI?: PaperProtocol;
    CVQKD?: PaperProtocol;
  };
  comparative_results: {
    ranking: string[];
    best_protocol: string;
    worst_protocol: string;
    composite_index_scores: Record<string, number>;
    performance_metrics: string[];
    attack_qber: {
      no_attack: Record<string, number>;
      intercept_resend: Record<string, number>;
      eve_50_percent: Record<string, number>;
    };
  };
}

export interface QSafeMetrics {
  name: string;
  year: number;
  pipeline_stages: number;
  cascade_reconciliation: boolean;
  privacy_amplification: string;
  abort_types: string[];
  recursive_mode: boolean;
  p2p_network: boolean;
  qber_ideal: number;
  match_rate: number;
  unique_features: number;
  composite_index: number;
  post_processing_depth: number;
  throughput_efficiency: number;
  radar_scores: {
    key_match: number;
    low_qber: number;
    post_processing: number;
    ux_depth: number;
    attack_detection: number;
    throughput: number;
    scalability: number;
  };
}

export interface FeatureMatrixRow {
  feature: string;
  category: 'post-processing' | 'security' | 'usability' | 'network' | 'operational';
  tooltip: string;
  qsafe: 'yes' | 'no' | 'partial';
  e91: 'yes' | 'no' | 'partial';
  b92: 'yes' | 'no' | 'partial';
  bb84: 'yes' | 'no' | 'partial';
  sgs04: 'yes' | 'no' | 'partial';
  sarg04?: 'yes' | 'no' | 'partial';
  sixstate?: 'yes' | 'no' | 'partial';
  decoyphase?: 'yes' | 'no' | 'partial';
  mdi?: 'yes' | 'no' | 'partial';
  cvqkd?: 'yes' | 'no' | 'partial';
}

export interface KeyManagementComparison {
  protocol: string;
  keyStorage: string;
  forensicRecovery: string;
  selfRenewal: string;
  forwardSecrecy: string;
  keyExhaustionRisk: string;
  authentication: string;
}

export interface PerformanceMetrics {
  protocol: string;
  quantumStates: string;
  numberBases: string | number;
  photonSource: string;
  hardwareChangeNeeded: string;
  siftingEfficiency: string;
  bitLossPerSession: string;
  secretKeyRate: string;
  sessionStartupSpeed: string;
  photonsPerKeyBit: string;
  formalSecurityProof: string;
  qberDetectionThreshold: string;
  eveDetectionSpeed: string;
  pnsAttackResistance: string;
  sidechannelResistance: string;
  basisPredictability: string;
  deploymentComplexity: string;
  maturityLevel: string;
  g5gSuitability: string;
  iotSuitability: string;
  uniqueNovelty: string;
}
