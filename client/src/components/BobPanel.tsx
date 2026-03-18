// @ts-nocheck
import React, { useState } from 'react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';
import { Download, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import SecurityMetrics from './SecurityMetrics';

const BobPanel: React.FC = () => {
    const {
        addLog,
        bobBits, bobBases, setBobState,
        setSharedKey,
        keyMetrics, setKeyMetrics,
        peerIP,
        noiseConfig,
    } = useProject();

    const [siftedKey, setSiftedKey] = useState<number[]>([]);
    const [matches, setMatches] = useState<number[]>([]);
    const [step, setStep] = useState(0); // 0: Ready, 1: Received, 2: Sifted, 3: Verified
    const [qber, setQber] = useState<number | null>(null);
    const [pHat, setPHat] = useState<number | null>(null);
    const [efficiency, setEfficiency] = useState<number>(0);
    const [noiseStats, setNoiseStats] = useState<{ dropped: number; flips: number; original_count: number } | null>(null);

    const handleFetch = async () => {
        try {
            addLog('info', 'Bob receiving qubits...');

            if (peerIP) {
                // Network Mode
                const res = await axios.post('/api/fetch_from_peer', { peer_ip: peerIP });
                if (res.data.status === 'success') {
                    setBobState(res.data.bobBases, res.data.measuredBits);
                    setNoiseStats(res.data.noiseStats || null);
                    setStep(1);
                    addLog('success', `Received ${res.data.measuredBits.length} qubits from ${peerIP}.`);
                    if (res.data.noiseStats?.dropped > 0)
                        addLog('warning', `[Packet Loss] ${res.data.noiseStats.dropped} qubits dropped.`);
                    if (res.data.noiseStats?.flips > 0)
                        addLog('warning', `[Network Noise] ${res.data.noiseStats.flips} bits flipped in transit.`);
                } else {
                    addLog('error', 'Failed to receive qubits.');
                }
            } else {
                // Local Demo Mode
                const res = await axios.post('/api/bob_measure', {});
                if (res.data.bobBases) {
                    setBobState(res.data.bobBases, res.data.measuredBits);
                    setNoiseStats(res.data.noiseStats || null);
                    setStep(1);
                    addLog('success', `Received ${res.data.measuredBits.length} qubits (Local Simulator).`);
                    if (res.data.noiseStats?.dropped > 0)
                        addLog('warning', `[Packet Loss] ${res.data.noiseStats.dropped} qubits dropped (photon loss).`);
                    if (res.data.noiseStats?.flips > 0)
                        addLog('warning', `[Network Noise] ${res.data.noiseStats.flips} qubit descriptions corrupted in transit.`);
                    if (noiseConfig.eve_active)
                        addLog('warning', '[Eve] Intercept-resend active — expect elevated QBER.');
                    if (noiseConfig.channel_noise_rate > 0)
                        addLog('info', `[Channel Noise] Qiskit depolarizing rate: ${(noiseConfig.channel_noise_rate * 100).toFixed(0)}%.`);
                }
            }
        } catch (err: any) {
            addLog('error', err.message || 'Fetch failed');
        }
    };

    const handleSift = async () => {
        try {
            let aliceBasesToUse: number[] = [];

            if (peerIP) {
                addLog('info', 'Fetching Alice\'s bases from classical channel...');
                const basesRes = await axios.post('/api/fetch_peer_bases', { peer_ip: peerIP });
                aliceBasesToUse = basesRes.data.aliceBases;
                addLog('success', 'Received Alice\'s bases.');
            }

            addLog('info', 'Sifting keys...');
            const res = await axios.post('/api/sift_keys', {
                bobBases: bobBases,
                bobBits: bobBits,
                aliceBases: aliceBasesToUse,
            });

            setSiftedKey(res.data.siftedKey);
            setMatches(res.data.matches);
            setStep(2);
            addLog('success', `Sifting complete. Kept ${res.data.siftedKey.length} bits.`);
        } catch (err: any) {
            addLog('error', err.response?.data?.error || err.message);
        }
    };

    const handleVerify = async () => {
        try {
            addLog('info', 'Sampling bits for verification...');

            let res: any;
            if (peerIP) {
                addLog('info', 'Sending sample to Alice for verification...');
                res = await axios.post('/api/verify_peer_sample', {
                    peer_ip: peerIP,
                    sifted_key: siftedKey,
                    original_matches: matches,
                });
            } else {
                const sampleRes = await axios.post('/api/sample_key', { siftedKey });
                const { sampleIndices, sampleBits, remainingKey } = sampleRes.data;

                addLog('warning', `Verifying ${sampleBits.length} bits...`);
                const compareRes = await axios.post('/api/compare_sample', {
                    sampleIndices,
                    bobSampleBits: sampleBits,
                    originalMatches: matches,
                });

                res = { data: { ...compareRes.data, remainingKey } };
            }

            const { errorCount, qber: newQber, p_hat: newPHat, remainingKey, keyMetrics: newMetrics } = res.data;
            setQber(newQber);
            if (newPHat !== undefined) setPHat(newPHat);

            if (newMetrics) {
                setKeyMetrics(newMetrics);
                addLog('info', `[Security] Entropy: ${newMetrics.entropy.toFixed(3)} bits | Correlation: ${newMetrics.correlation.toFixed(3)} | Efficiency: ${newMetrics.efficiency.toFixed(1)}%`);
            }

            if (errorCount > 0) {
                const cause = noiseConfig.eve_active ? '⚠️ Eve detected!' : 'Channel interference';
                addLog('error', `QBER: ${newQber.toFixed(2)}% (${errorCount} errors) — ${cause}`);
                if (newQber > 20) {
                    addLog('error', 'QBER > 20% — Aborting key exchange for security.');
                    return;
                }
            } else {
                addLog('success', 'QBER: 0% — Secure channel confirmed.');
            }

            setSharedKey(remainingKey);
            setEfficiency(Math.round((remainingKey.length / bobBits.length) * 100));
            setStep(3);
            addLog('success', `Key Established. Length: ${remainingKey.length} bits.`);

        } catch (err: any) {
            addLog('error', err.response?.data?.error || err.message);
        }
    };

    // QBER colour helpers
    const qberColor = (q: number) => {
        if (q === 0) return 'var(--green)';
        if (q < 5) return '#6b8e23';
        if (q < 20) return 'var(--orange)';
        return 'var(--red)';
    };
    const qberLabel = (q: number) => {
        if (q === 0) return '✅ Secure';
        if (q < 5) return '🟡 Marginal';
        if (q < 20) return '⚠️ Elevated';
        return '❌ Attack Detected!';
    };

    return (
        <div className="card">
            <div className="section-title">
                <Download size={22} /> Bob (Receiver)
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
                <button
                    className="btn btn-primary"
                    onClick={handleFetch}
                    disabled={step > 0}
                    style={{ padding: '0 24px' }}
                >
                    📥 Receive Qubits
                </button>

                <div style={{ width: '1px', background: 'var(--border-strong)', margin: '0 8px' }}></div>

                <button
                    className="btn btn-secondary"
                    onClick={handleSift}
                    disabled={step !== 1}
                >
                    🔍 Sift Keys
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={handleVerify}
                    disabled={step !== 2}
                >
                    🛡️ Verify & Finalize
                </button>

                {step > 0 && (
                    <button
                        className="btn btn-secondary"
                        style={{ fontSize: 13, padding: '0 16px', marginLeft: 'auto' }}
                        onClick={() => {
                            setStep(0);
                            setQber(null);
                            setPHat(null);
                            setKeyMetrics(null);
                            setSiftedKey([]);
                            setMatches([]);
                            setNoiseStats(null);
                        }}
                    >
                        🔄 Reset
                    </button>
                )}
            </div>

            {/* Noise stats banner */}
            {noiseStats && (noiseStats.dropped > 0 || noiseStats.flips > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginBottom: 24,
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--orange-warning-bg)',
                        border: '1px solid #eed88d',
                        fontSize: 13,
                        fontWeight: 500,
                        display: 'flex',
                        gap: 16,
                    }}
                >
                    <span style={{ color: 'var(--text-secondary)' }}>
                        Sent: <strong style={{ color: 'var(--text-primary)' }}>{noiseStats.original_count}</strong>
                    </span>
                    {noiseStats.dropped > 0 && (
                        <span style={{ color: 'var(--accent-blue)' }}>
                            📦 Lost: <strong>{noiseStats.dropped}</strong>
                        </span>
                    )}
                    {noiseStats.flips > 0 && (
                        <span style={{ color: 'var(--orange-warning)' }}>
                            📡 Corrupted: <strong>{noiseStats.flips}</strong>
                        </span>
                    )}
                    {noiseConfig.eve_active && (
                        <span style={{ color: 'var(--red-error)' }}>
                            🕵️ Eve Active
                        </span>
                    )}
                </motion.div>
            )}

            {/* Bob's measurements */}
            {bobBits.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Bob's Measurements
                    </div>
                    <div className="visual-grid">
                        {bobBits.map((b, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`box bit-${b}`}
                            >
                                {b}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* QBER indicator */}
            {qber !== null && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        marginBottom: 24,
                        padding: '16px 20px',
                        borderRadius: 'var(--radius-md)',
                        background: `${qberColor(qber)}15`,
                        border: `1px solid ${qberColor(qber)}40`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                    }}
                >
                    <div className="display-font" style={{ fontSize: 28, fontWeight: 600, color: qberColor(qber), minWidth: 80 }}>
                        {qber.toFixed(1)}%
                    </div>
                    <div>
                        <div style={{ color: qberColor(qber), fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{qberLabel(qber)}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                            Quantum Bit Error Rate (QBER)
                            {qber > 0 && noiseConfig.eve_active && ' — Intercept & Resend Attack!'}
                            {qber > 0 && !noiseConfig.eve_active && noiseConfig.channel_noise_rate > 0 && ' — Channel Depolarizing Noise'}
                            {qber > 0 && !noiseConfig.eve_active && noiseConfig.network_noise_rate > 0 && ' — Network Simulation Noise'}
                        </div>
                    </div>
                </motion.div>
            )}

            <SecurityMetrics metrics={keyMetrics} qber={qber} pHat={pHat} />

            {/* Finalized key */}
            {step >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: '32px',
                        padding: '24px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--green-success-bg)',
                        border: '1px solid rgba(26, 127, 55, 0.1)'
                    }}
                >
                    <div className="display-font" style={{ color: 'var(--green-success)', fontWeight: 600, fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        ✅ Final Secure Shared Key
                    </div>
                    <div className="visual-grid">
                        <SharedKeyVisual />
                    </div>
                    <div style={{ fontSize: '14px', marginTop: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Efficiency: <span style={{ color: 'var(--text-primary)' }}>{efficiency}%</span> | QBER: <span style={{ color: 'var(--text-primary)' }}>{qber?.toFixed(2)}%</span>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

const SharedKeyVisual: React.FC = () => {
    const { sharedKey } = useProject();
    return (
        <>
            {sharedKey.map((b, i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`box bit-${b}`}
                >
                    {b}
                </motion.div>
            ))}
        </>
    );
}

export default BobPanel;
