// @ts-nocheck
import React, { useRef, useState } from 'react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';
import { Download, ShieldCheck, AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import SecurityMetrics from './SecurityMetrics';
import CascadeVisualizer from './CascadeVisualizer';

function injectNoise(siftedKey: number[], errorRate: number) {
    const noisyKey = [...siftedKey];
    if (!Array.isArray(siftedKey) || siftedKey.length === 0) {
        return { noisyKey, flippedPositions: [], flipsApplied: 0 };
    }
    const targetFlips = Math.max(1, Math.floor(noisyKey.length * errorRate));
    const selected = new Set<number>();
    while (selected.size < targetFlips && selected.size < noisyKey.length) {
        selected.add(Math.floor(Math.random() * noisyKey.length));
    }
    const flippedPositions = Array.from(selected).sort((a, b) => a - b);
    for (const pos of flippedPositions) {
        noisyKey[pos] = noisyKey[pos] === 1 ? 0 : 1;
    }
    return { noisyKey, flippedPositions, flipsApplied: flippedPositions.length };
}

const BobPanel: React.FC = () => {
    const {
        addLog,
        bobBits, bobBases, setBobState,
        setSharedKey,
        setPaStats,
        setBobRemainingKey,
        setCascadeData,
        setBasisSyncLevel,
        setBiasAlignmentScore,
        setBitsDiscarded,
        setEfficiencyTags,
        aliceBits,
        manualNoiseEnabled,
        manualNoiseRate,
        noiseToleranceEnabled,
        bobSiftedCleanKey,
        setBobSiftedCleanKey,
        bobSiftedNoisyKey,
        setBobSiftedNoisyKey,
        setAliceSiftedForViz,
        noiseInjectionReport,
        setNoiseInjectionReport,
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
    const [cascadeReport, setCascadeReport] = useState<any | null>(null);
    const [verificationFailed, setVerificationFailed] = useState(false);
    const [verificationMath, setVerificationMath] = useState<any | null>(null);
    const [abortReason, setAbortReason] = useState<string | null>(null);
    const [abortClassification, setAbortClassification] = useState<string | null>(null);
    const [abortContext, setAbortContext] = useState<any | null>(null);
    const [showFastSuccess, setShowFastSuccess] = useState(false);
    const [environmentalNoiseNotice, setEnvironmentalNoiseNotice] = useState<string | null>(null);
    const cascadeSectionRef = useRef<HTMLDivElement | null>(null);

    const handleFetch = async () => {
        setIsReceiving(true);
        setVerificationFailed(false);
        setVerificationMath(null);
        setAbortReason(null);
        setAbortClassification(null);
        setAbortContext(null);
        setShowFastSuccess(false);
        setEnvironmentalNoiseNotice(null);
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
            setBobSiftedCleanKey(res.data.siftedKey || []);
            setMatches(res.data.matches);
            if (typeof res.data.basisSyncLevel === 'number') setBasisSyncLevel(res.data.basisSyncLevel);
            if (typeof res.data.biasAlignmentScore === 'number') setBiasAlignmentScore(res.data.biasAlignmentScore);
            setBitsDiscarded(res.data.bitsDiscarded ?? 0);

            const localAliceRef = Array.isArray(aliceBits) && aliceBits.length > 0
                ? (res.data.matches || []).map((idx: number) => aliceBits[idx]).filter((v: any) => v === 0 || v === 1)
                : (res.data.siftedKey || []);
            setAliceSiftedForViz(localAliceRef);

            if (manualNoiseEnabled && Array.isArray(res.data.siftedKey) && res.data.siftedKey.length > 0) {
                const appliedRate = Math.max(0, Math.min(1, manualNoiseRate));
                const noise = injectNoise(res.data.siftedKey, appliedRate);
                setBobSiftedNoisyKey(noise.noisyKey);
                setNoiseInjectionReport({ ...noise, rate: appliedRate });
                setSiftedKey(noise.noisyKey);
                addLog('warning', `[Manual Noise] Injected ${(appliedRate * 100).toFixed(0)}% post-sifting noise. Flipped ${noise.flipsApplied} bits.`);
            } else {
                setBobSiftedNoisyKey(res.data.siftedKey || []);
                setNoiseInjectionReport(null);
            }

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
        setVerificationFailed(false);
        setAbortReason(null);
        setAbortClassification(null);
        setAbortContext(null);
        setShowFastSuccess(false);
        setEnvironmentalNoiseNotice(null);
        try {
            addLog('info', 'Sampling bits for verification...');

            let res: any;
            if (peerIP) {
                addLog('info', 'Sending sample to Alice for verification...');
                res = await axios.post('/api/verify_peer_sample', {
                    peer_ip: peerIP,
                    sifted_key: siftedKey,
                    original_matches: matches,
                    manual_noise_enabled: manualNoiseEnabled,
                    manual_noise_rate: manualNoiseRate,
                    noise_tolerance_enabled: noiseToleranceEnabled,
                });
            } else {
                const sampleRes = await axios.post('/api/sample_key', { siftedKey });
                const { sampleIndices, sampleBits, remainingKey } = sampleRes.data;

                addLog('warning', `Verifying ${sampleBits.length} bits...`);
                const compareRes = await axios.post('/api/compare_sample', {
                    sampleIndices,
                    bobSampleBits: sampleBits,
                    bobRemainingKey: remainingKey,
                    originalMatches: matches,
                    manual_noise_enabled: manualNoiseEnabled,
                    manual_noise_rate: manualNoiseRate,
                    noise_tolerance_enabled: noiseToleranceEnabled,
                });

                res = { data: compareRes.data };
            }

            const {
                errorCount,
                qber: newQber,
                p_hat: newPHat,
                p_hat,
                qber_sn,
                status,
                abort_reason,
                abort_classification,
                abort_context,
                fast_success,
                math,
                remainingKey,
                raw_remaining_key,
                corrected_bob_key,
                keyMetrics: newMetrics,
                cascade_stats,
                cascade_trace,
                pa_stats,
                efficiency_tags,
            } = res.data;
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

            const isAborted = status === 'aborted' || !res.data.verified;
            if (!isAborted) {
                setVerificationFailed(false);
                setVerificationMath(null);
                setAbortReason(null);
                setAbortClassification(null);
                setAbortContext(null);
                setShowFastSuccess(Boolean(fast_success));
                setEnvironmentalNoiseNotice(null);
                addLog('success', `Verification Success! QBER: ${newQber?.toFixed(2)}% | Est. p_hat: ${p_hat?.toFixed(3)}`);
                if (fast_success) {
                    addLog('success', 'Perfect channel detected (QBER 0.00%). Fast-success path activated; no correction rounds required.');
                }
                if (cascade_stats) {
                    addLog(
                        'info',
                        `[Cascade] Errors fixed: ${cascade_stats.errors_found} | Rounds: ${cascade_stats.rounds_run} | Parities exchanged: ${cascade_stats.parities_exchanged}`
                    );
                }
            } else {
                setVerificationFailed(true);
                setVerificationMath(math || null);
                setAbortReason(abort_reason || 'verification_aborted');
                const derivedClassification = abort_classification || (abort_reason === 'qber_threshold_exceeded' ? 'security_threat' : 'software_error');
                setAbortClassification(derivedClassification);
                setAbortContext(abort_context || null);

                if (derivedClassification === 'environmental_noise') {
                    setVerificationFailed(false);
                    setVerificationMath(math || null);
                    setEnvironmentalNoiseNotice('Environmental noise exceeded tolerance. Cascade view is ready for manual correction rounds.');
                    setCascadeReport(cascade_stats ? { stats: cascade_stats, trace: cascade_trace } : null);
                    setCascadeData(cascade_stats ? { stats: cascade_stats, trace: cascade_trace } : null);
                    setStep(2);
                    setSharedKey([]);
                    setPaStats(null);
                    setEfficiencyTags(null);
                    setBobRemainingKey(Array.isArray(raw_remaining_key) ? raw_remaining_key : []);
                    addLog('warning', 'Environmental noise detected. Switching to Cascade correction mode.');
                    setTimeout(() => {
                        cascadeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 120);
                    return;
                }

                setPaStats(null);
                setCascadeData(null);
                setEfficiencyTags(null);
                setBobRemainingKey([]);
                setSharedKey([]);
                addLog('error', `QBER: ${newQber?.toFixed(2)}% (${errorCount} errors) — Est. p_hat: ${p_hat?.toFixed(3)} | Verification Failed.`);
                if (derivedClassification === 'security_threat') {
                    addLog('error', 'Security threshold exceeded. Session aborted.');
                } else if (derivedClassification === 'environmental_noise') {
                    addLog('warning', 'Environmental noise exceeded tolerance. Session halted without security-threat classification.');
                } else {
                    addLog('warning', 'Software/state mismatch detected. This is not a cryptographic security breach.');
                }
                setCascadeReport(null);
                return;
            }

            const finalBobKey = corrected_bob_key || remainingKey;
            setPaStats(pa_stats || null);
            setEfficiencyTags(efficiency_tags || null);
            setBobRemainingKey(Array.isArray(raw_remaining_key) ? raw_remaining_key : []);
            setCascadeReport(cascade_stats ? { stats: cascade_stats, trace: cascade_trace } : null);
            setCascadeData(cascade_stats ? { stats: cascade_stats, trace: cascade_trace } : null);
            setSharedKey(finalBobKey);
            setEfficiency(Math.round((finalBobKey.length / bobBits.length) * 100));
            setStep(3);
            addLog('success', `Key Established. Length: ${finalBobKey.length} bits.`);

        } catch (err: any) {
            addLog('error', err.response?.data?.error || err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    if (verificationFailed) {
        return (
            <SecurityAlert
                math={verificationMath}
                reason={abortReason}
                qber={qber}
                classification={abortClassification}
                context={abortContext}
                onReset={() => {
                    setVerificationFailed(false);
                    setVerificationMath(null);
                    setAbortReason(null);
                    setAbortClassification(null);
                    setAbortContext(null);
                    setShowFastSuccess(false);
                    setEnvironmentalNoiseNotice(null);
                    setStep(0);
                    setQber(null);
                    setPHat(null);
                    setQberSn(null);
                    setSiftedKey([]);
                    setMatches([]);
                    setNoiseStats(null);
                    setBasisSyncLevel(null);
                    setBiasAlignmentScore(null);
                    setBitsDiscarded(0);
                    setCascadeReport(null);
                    setBobSiftedCleanKey([]);
                    setBobSiftedNoisyKey([]);
                    setAliceSiftedForViz([]);
                    setNoiseInjectionReport(null);
                    setPaStats(null);
                    setCascadeData(null);
                    setEfficiencyTags(null);
                    setBobRemainingKey([]);
                    setSharedKey([]);
                }}
            />
        );
    }

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
                            setVerificationFailed(false);
                            setVerificationMath(null);
                            setAbortReason(null);
                            setAbortClassification(null);
                            setAbortContext(null);
                            setShowFastSuccess(false);
                            setEnvironmentalNoiseNotice(null);
                            setStep(0);
                            setQber(null);
                            setPHat(null);
                            setKeyMetrics(null);
                            setQberSn(null);
                            setSiftedKey([]);
                            setMatches([]);
                            setNoiseStats(null);
                            setBasisSyncLevel(null);
                            setBiasAlignmentScore(null);
                            setBitsDiscarded(0);
                            setCascadeReport(null);
                            setBobSiftedCleanKey([]);
                            setBobSiftedNoisyKey([]);
                            setAliceSiftedForViz([]);
                            setNoiseInjectionReport(null);
                            setPaStats(null);
                            setCascadeData(null);
                            setEfficiencyTags(null);
                            setBobRemainingKey([]);
                            setSharedKey([]);
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

            {showFastSuccess && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginBottom: 16,
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--green-success-bg)',
                        border: '1px solid rgba(16,185,129,0.35)',
                        color: 'var(--green-success)',
                        fontSize: 13,
                        fontWeight: 600,
                    }}
                >
                    Fast Success: QBER is 0.00%. Quantum state arrived perfectly and no correction rounds are needed.
                </motion.div>
            )}

            {environmentalNoiseNotice && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginBottom: 16,
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: '#fffbeb',
                        border: '1px solid #fcd34d',
                        color: '#92400e',
                        fontSize: 13,
                        fontWeight: 600,
                    }}
                >
                    {environmentalNoiseNotice}
                </motion.div>
            )}

            <SecurityMetrics metrics={keyMetrics} qber={qber} pHat={pHat} />

            {step >= 2 && (
                <div ref={cascadeSectionRef}>
                    <CascadeVisualizer
                        onCorrectionConfirmed={(correctedKey: number[]) => {
                            if (Array.isArray(correctedKey) && correctedKey.length > 0) {
                                setBobSiftedNoisyKey(correctedKey);
                                setSiftedKey(correctedKey);
                                addLog('info', `[Cascade Visualizer] Applied interactive corrections (${correctedKey.length} bits).`);
                            }
                        }}
                    />
                </div>
            )}

            {noiseInjectionReport && step >= 2 && (
                <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                    Manual noise report: rate {(noiseInjectionReport.rate * 100).toFixed(0)}% · flips {noiseInjectionReport.flipsApplied}
                </div>
            )}

            {cascadeReport && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        marginTop: 20,
                        padding: '18px 20px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                    }}
                >
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                        Cascade Error Correction Summary
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, marginBottom: 12 }}>
                        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-sidebar)', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Errors Found</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{cascadeReport.stats?.errors_found ?? 0}</div>
                        </div>
                        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-sidebar)', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rounds Run</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{cascadeReport.stats?.rounds_run ?? 0}</div>
                        </div>
                        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-sidebar)', border: '1px solid var(--border-light)' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Parities Exchanged</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{cascadeReport.stats?.parities_exchanged ?? 0}</div>
                        </div>
                    </div>

                    {cascadeReport.trace?.rounds?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {cascadeReport.trace.rounds.map((roundData: any) => (
                                <div key={roundData.round} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-sidebar)', border: '1px solid var(--border-light)' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        Round {roundData.round} · Block Size {roundData.block_size}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                                        <span>Blocks: {roundData.num_blocks}</span>
                                        <span>Mismatched: {roundData.mismatched_blocks}</span>
                                        <span>Corrections: {roundData.corrections?.length ?? 0}</span>
                                        <span>Queue Rechecks: {roundData.queue_rechecks ?? 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

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
    if (!Array.isArray(sharedKey) || sharedKey.length === 0) {
        return null;
    }
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

const SecurityAlert: React.FC<{
    math: any | null;
    reason: string | null;
    qber: number | null;
    classification: string | null;
    context: any | null;
    onReset: () => void;
}> = ({ math, reason, qber, classification, context, onReset }) => {
    const isSecurityThreat = classification === 'security_threat';
    const isEnvironmentalNoise = classification === 'environmental_noise';
    const isSoftwareMismatch = !isSecurityThreat && !isEnvironmentalNoise;
    const secretRate = typeof math?.secret_key_rate_r === 'number' ? math.secret_key_rate_r : null;
    const insecure = typeof secretRate === 'number' ? secretRate <= 0 : false;
    return (
        <div className="card" style={{ border: isSecurityThreat ? '1px solid #fecaca' : '1px solid #fdba74', background: isSecurityThreat ? '#fff7f7' : '#fffbeb' }}>
            <div className="section-title" style={{ color: isSecurityThreat ? '#b91c1c' : '#9a3412' }}>
                <AlertTriangle size={22} /> {isSecurityThreat ? 'Security Alert: Key Exchange Aborted' : (isEnvironmentalNoise ? 'Environmental Noise: Exchange Halted' : 'Software Mismatch: Exchange Halted')}
            </div>

            <div style={{ marginBottom: 14, color: '#7f1d1d', fontSize: 14, fontWeight: 600 }}>
                Observed QBER: {typeof qber === 'number' ? `${qber.toFixed(2)}%` : 'N/A'}
            </div>

            <div
                style={{
                    background: isSecurityThreat ? '#fee2e2' : '#ffedd5',
                    border: isSecurityThreat ? '1px solid #fecaca' : '1px solid #fdba74',
                    borderRadius: 10,
                    padding: '12px 14px',
                    color: isSecurityThreat ? '#7f1d1d' : '#9a3412',
                    fontSize: 14,
                    marginBottom: 14,
                }}
            >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{isSecurityThreat ? 'Mathematical Verdict' : (isEnvironmentalNoise ? 'Noise Verdict' : 'Integrity Verdict')}</div>
                <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
                    r = 1 - 2H2(QBER)
                </div>
                <div style={{ marginTop: 6 }}>
                    {typeof secretRate === 'number' ? `Computed r = ${secretRate.toFixed(4)}` : 'Secret key rate unavailable'}
                </div>
                {isSecurityThreat && insecure && (
                    <div style={{ marginTop: 6, fontWeight: 700 }}>
                        r ≤ 0: Eve potentially knows more than Alice and Bob can safely correct.
                    </div>
                )}
                {isSoftwareMismatch && (
                    <div style={{ marginTop: 6, fontWeight: 700 }}>
                        Residual mismatch indicates index/state inconsistency after sampling or reconciliation.
                    </div>
                )}
                {isEnvironmentalNoise && (
                    <div style={{ marginTop: 6, fontWeight: 700 }}>
                        Measured channel noise exceeded configured tolerance for this run.
                    </div>
                )}
            </div>

            <details style={{ marginBottom: 14 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Technical Details
                </summary>
                <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <div>Abort reason: {reason || 'not_provided'}</div>
                    <div>Classification: {classification || 'unknown'}</div>
                    <div>QBER (decimal): {math?.qber_decimal ?? 'n/a'}</div>
                    <div>H2(QBER): {math?.h2_qber ?? 'n/a'}</div>
                    <div>Secret rate r: {math?.secret_key_rate_r ?? 'n/a'}</div>
                    <div>Threshold: QBER ≤ 0.11</div>
                    {context && <div>Residual Errors: {context.residual_errors ?? 'n/a'}</div>}
                </div>
            </details>

            <button className="btn btn-secondary" onClick={onReset}>
                🔄 Reset Session
            </button>
        </div>
    );
};

export default BobPanel;
