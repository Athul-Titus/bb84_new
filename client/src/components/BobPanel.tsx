// @ts-nocheck
import React, { useState } from 'react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';
import { Download, ShieldCheck, AlertTriangle, Activity } from 'lucide-react';
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
        bobStep: step, setBobStep: setStep,
        siftedKey, setSiftedKey,
        matches, setMatches,
        qber, setQber,
        pHat, setPHat,
        qberSn, setQberSn,
        efficiency, setEfficiency,
        noiseStats, setNoiseStats
    } = useProject();

    const [isReceiving, setIsReceiving] = useState(false);
    const [isSifting, setIsSifting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleFetch = async () => {
        setIsReceiving(true);
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
                    if (noiseConfig.interception_density > 0)
                        addLog('warning', `[Eve] Intercept-resend active (p=${noiseConfig.interception_density.toFixed(2)}) — expect elevated QBER.`);
                    if (noiseConfig.use_hardware_noise)
                        addLog('info', `[Hardware Noise] IBM GenericBackendV2 engaged.`);
                    else if (noiseConfig.channel_noise_rate > 0)
                        addLog('info', `[Channel Noise] Custom depolarizing rate: ${(noiseConfig.channel_noise_rate * 100).toFixed(0)}%.`);
                }
            }
        } catch (err: any) {
            addLog('error', err.message || 'Fetch failed');
        } finally {
            setIsReceiving(false);
        }
    };

    const handleSift = async () => {
        setIsSifting(true);
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
        } finally {
            setIsSifting(false);
        }
    };

    const handleVerify = async () => {
        setIsVerifying(true);
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

            const { errorCount, qber: newQber, p_hat: newPHat, p_hat, qber_sn, remainingKey, keyMetrics: newMetrics } = res.data;
            if (typeof newQber === 'number') setQber(newQber);
            if (newPHat !== undefined) setPHat(newPHat);
            else if (p_hat !== undefined) setPHat(p_hat);
            if (qber_sn !== undefined) setQberSn(qber_sn);

            if (newMetrics && Object.keys(newMetrics).length > 0) {
                setKeyMetrics(newMetrics);
                addLog('info', `[Security] Entropy: ${newMetrics.entropy?.toFixed(3)} bits | Correlation: ${newMetrics.correlation?.toFixed(3)} | Efficiency: ${newMetrics.efficiency?.toFixed(1)}%`);
            } else {
                setKeyMetrics(null);
            }

            if (res.data.verified) {
                addLog('success', `Verification Success! QBER: ${newQber?.toFixed(2)}% | Est. p_hat: ${p_hat?.toFixed(3)}`);
            } else {
                addLog('error', `QBER: ${newQber?.toFixed(2)}% (${errorCount} errors) — Est. p_hat: ${p_hat?.toFixed(3)} | Verification Failed.`);
                addLog('error', 'Aborting key exchange due to verification failure.');
                return;
            }

            setSharedKey(remainingKey);
            setEfficiency(Math.round((remainingKey.length / bobBits.length) * 100));
            setStep(3);
            addLog('success', `Key Established. Length: ${remainingKey.length} bits.`);

        } catch (err: any) {
            addLog('error', err.response?.data?.error || err.message);
        } finally {
            setIsVerifying(false);
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
                    disabled={step > 0 || isReceiving}
                    style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    {isReceiving ? <><Activity size={16} className="animate-pulse" /> Receiving...</> : '📥 Receive Qubits'}
                </button>

                <div style={{ width: '1px', background: 'var(--border-strong)', margin: '0 8px' }}></div>

                <button
                    className="btn btn-secondary"
                    onClick={handleSift}
                    disabled={step !== 1 || isSifting}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    {isSifting ? <><Activity size={16} className="animate-pulse" /> Sifting...</> : '🔍 Sift Keys'}
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={handleVerify}
                    disabled={step !== 2 || isVerifying}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    {isVerifying ? <><Activity size={16} className="animate-pulse" /> Verifying...</> : '🛡️ Verify & Finalize'}
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
                            setQberSn(null);
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
                    {noiseConfig.interception_density > 0 && (
                        <span style={{ color: 'var(--red-error)' }}>
                            🕵️ Eve (Tap Density: {noiseConfig.interception_density})
                        </span>
                    )}
                </motion.div>
            )}

            {/* Receiving Placeholder */}
            {isReceiving && bobBits.length === 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        📡 Traversing Quantum Channel...
                    </div>
                    <div className="visual-grid">
                        {Array.from({ length: 40 }).map((_, i) => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0.1, 0.4, 0.1], scale: [0.95, 1, 0.95] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
                                className="box"
                                style={{ background: 'var(--bg-hover)', border: '1px dashed var(--border-light)' }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Bob's measurements */}
            {!isReceiving && bobBits.length > 0 && (
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
            {typeof qber === 'number' && (
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
                    <div style={{ flex: 1 }}>
                        <div style={{ color: qberColor(qber), fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{qberLabel(qber)}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            <span><strong>QBER</strong>: {qber.toFixed(1)}%</span>
                            {pHat !== null && (
                                <span style={{ color: pHat > 0.05 ? 'var(--red-error)' : 'inherit' }}>
                                    <strong>Est. Intrusion (p̂)</strong>: {pHat.toFixed(3)}
                                </span>
                            )}
                            {qberSn !== null && noiseConfig.use_hardware_noise && (
                                <span><strong>Baseline Noise (QBER_SN)</strong>: {qberSn}%</span>
                            )}
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
