import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Key, ArrowDown } from 'lucide-react';

interface FunnelStage {
    label: string;
    count: number;
    percent: number;
    color: string;
    icon: React.ReactNode;
    description: string;
}

interface Props {
    raw: number;
    sifted: number;
    corrected: number;
    final: number;
    bitsDiscardedSifting?: number;
    bitsDiscardedSampling?: number;
    bitsDiscardedPrivacy?: number;
    bitsRecovered?: number;
    basisSyncLevel?: number | null;
    biasAlignmentScore?: number | null;
    finalSecretEntropy?: number | null;
}

const KeyLifecycleFunnel: React.FC<Props> = ({
    raw,
    sifted,
    corrected,
    final,
    bitsDiscardedSifting = 0,
    bitsDiscardedSampling = 0,
    bitsDiscardedPrivacy = 0,
    bitsRecovered = 0,
    basisSyncLevel = null,
    biasAlignmentScore = null,
    finalSecretEntropy = null,
}) => {
    const stages: FunnelStage[] = [
        { 
            label: "Raw Bits", 
            count: raw, 
            percent: 100, 
            color: "var(--blue-link)", 
            icon: <Zap size={14} />,
            description: "Initial quantum measurements"
        },
        { 
            label: "Sifted Key", 
            count: sifted, 
            percent: raw > 0 ? (sifted / raw) * 100 : 0, 
            color: "var(--purple-info)", 
            icon: <ArrowDown size={14} />,
            description: "Discarded incompatible bases"
        },
        { 
            label: "Corrected Key", 
            count: corrected, 
            percent: raw > 0 ? (corrected / raw) * 100 : 0, 
            color: "var(--green-success)", 
            icon: <ShieldCheck size={14} />,
            description: "Errors resolved by Cascade"
        },
        { 
            label: "Secret Key", 
            count: final, 
            percent: raw > 0 ? (final / raw) * 100 : 0, 
            color: "#ed8936", 
            icon: <Key size={14} />,
            description: "Finalized Privacy Amplification"
        }
    ];

    const secretKeyRate = raw > 0 ? ((final / raw) * 100).toFixed(1) : "0.0";

    return (
        <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-light)', 
            borderRadius: '16px', 
            padding: '24px',
            marginTop: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Key Generation Efficiency</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Tracking the Secret Key Rate across protocol phases</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Net Efficiency</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#ed8936' }}>{secretKeyRate}%</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                {stages.map((stage, i) => (
                    <motion.div 
                        key={stage.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                    >
                        {/* Label & Icon */}
                        <div style={{ width: '140px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '6px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                background: stage.label === 'Raw Bits' ? 'var(--blue-link-soft)' : 
                                            stage.label === 'Sifted Key' ? 'var(--purple-info-soft)' : 
                                            stage.label === 'Corrected Key' ? 'var(--green-success-bg)' : 
                                            'rgba(237, 137, 54, 0.15)',
                                color: stage.color
                            }}>
                                {stage.icon}
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>{stage.label}</div>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{stage.description}</div>
                            </div>
                        </div>

                        {/* Bar Segment */}
                        <div style={{ flex: 1, position: 'relative', height: '36px', background: 'var(--bg-main)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${stage.percent}%` }}
                                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                                style={{ 
                                    height: '100%', 
                                    background: stage.color, 
                                    opacity: 0.9,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    paddingRight: '12px',
                                    boxShadow: `inset -4px 0 10px rgba(0,0,0,0.1)`
                                }}
                            >
                                <span style={{ fontSize: '11px', fontWeight: 900, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                                    {stage.count} <span style={{ opacity: 0.8, fontSize: '9px' }}>bits</span>
                                </span>
                            </motion.div>
                            
                            {/* Retention Indicator */}
                            {i > 0 && stages[i-1].count > 0 && (
                                <div style={{ 
                                    position: 'absolute', 
                                    left: '4px', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)', 
                                    fontSize: '9px', 
                                    fontWeight: 800, 
                                    color: 'white',
                                    opacity: 0.5
                                }}>
                                    {((stage.count / stages[i-1].count) * 100).toFixed(0)}% retention
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}

                {/* Vertical Funnel Line */}
                <div style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '24px', 
                    bottom: '24px', 
                    width: '2px', 
                    background: 'var(--border-light)', 
                    zIndex: -1,
                    opacity: 0.5 
                }} />
            </div>

            <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(237, 137, 54, 0.05)', borderRadius: '10px', border: '1px solid rgba(237, 137, 54, 0.1)' }}>
                <p style={{ fontSize: '10px', color: '#ed8936', margin: 0, lineHeight: 1.5 }}>
                    <strong>Why the reduction?</strong> Quantum Key Distribution is inherently inefficient. We lose 50% of bits during sifting (incorrect bases), an additional fraction during error correction (public parity checks), and a final portion during privacy amplification to squeeze out any information leaked to Eve.
                </p>
            </div>

            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                <MetricPill label="Loss A: Basis Mismatch" value={`${bitsDiscardedSifting} bits`} tone="#475569" />
                <MetricPill label="Loss B: Sample Comparison" value={`${bitsDiscardedSampling} bits`} tone="#7c2d12" />
                <MetricPill label="Gain: Cascade Recovery" value={`${bitsRecovered} bits`} tone="#065f46" emphasis />
                <MetricPill label="Loss C: Privacy Amplification" value={`${bitsDiscardedPrivacy} bits`} tone="#92400e" />
            </div>

            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                <MetricPill
                    label="DBS: Sift Synchronization"
                    value={basisSyncLevel !== null ? `${basisSyncLevel.toFixed(2)}%` : 'N/A'}
                    tone="#1d4ed8"
                />
                <MetricPill
                    label="DBS: Bias Alignment"
                    value={biasAlignmentScore !== null ? `${biasAlignmentScore.toFixed(2)}%` : 'N/A'}
                    tone="#4338ca"
                />
                <MetricPill
                    label="Final Secret Entropy"
                    value={typeof finalSecretEntropy === 'number' ? `${finalSecretEntropy.toFixed(4)}` : 'N/A'}
                    tone="#b45309"
                />
            </div>
        </div>
    );
};

const MetricPill: React.FC<{ label: string; value: string; tone: string; emphasis?: boolean }> = ({ label, value, tone, emphasis = false }) => (
    <div style={{
        background: '#ffffff',
        border: `1px solid ${emphasis ? '#10B981' : 'var(--border-light)'}`,
        borderRadius: 10,
        padding: '10px 12px',
        boxShadow: emphasis ? '0 6px 16px rgba(16,185,129,0.16)' : 'none',
    }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: tone, marginTop: 2 }}>{value}</div>
    </div>
);

export default KeyLifecycleFunnel;
