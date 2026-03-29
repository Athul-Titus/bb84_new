import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Check, X, Activity } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

const CascadeVisualizer: React.FC<{ onCorrectionConfirmed?: (correctedKey: number[]) => void }> = ({ onCorrectionConfirmed }) => {
    const {
        sharedKey,
        bobRemainingKey,
        paStats,
        cascadeData,
        aliceSiftedForViz,
        bobSiftedNoisyKey,
        setBobSiftedNoisyKey,
    } = useProject();

    const [view, setView] = React.useState<'detection' | 'resolution' | 'final'>('detection');
    const [selectedBlock, setSelectedBlock] = React.useState<any | null>(null);
    const [searchFrames, setSearchFrames] = React.useState<any[]>([]);
    const [frameIndex, setFrameIndex] = React.useState(0);
    const [resolvedBitIndex, setResolvedBitIndex] = React.useState<number | null>(null);
    const [isAutoPlaying, setIsAutoPlaying] = React.useState(false);

    const traceRounds = Array.isArray(cascadeData?.trace?.rounds) ? cascadeData.trace.rounds : [];

    const aliceKey = React.useMemo(() => {
        if (Array.isArray(aliceSiftedForViz) && aliceSiftedForViz.length > 0) return aliceSiftedForViz;
        if (Array.isArray(sharedKey) && sharedKey.length > 0) return sharedKey;
        return [];
    }, [aliceSiftedForViz, sharedKey]);

    const bobSeed = React.useMemo(() => {
        if (Array.isArray(bobSiftedNoisyKey) && bobSiftedNoisyKey.length > 0) return bobSiftedNoisyKey;
        if (Array.isArray(bobRemainingKey) && bobRemainingKey.length > 0) return bobRemainingKey;
        return [];
    }, [bobSiftedNoisyKey, bobRemainingKey]);

    const [bobWorkingKey, setBobWorkingKey] = React.useState<number[]>(bobSeed);
    React.useEffect(() => {
        setBobWorkingKey(bobSeed);
    }, [bobSeed]);

    const displaySize = Math.min(32, aliceKey.length || bobWorkingKey.length || 0);
    const aliceSegment = aliceKey.slice(0, displaySize);
    const bobSegment = bobWorkingKey.slice(0, displaySize);

    if (!Array.isArray(aliceSegment) || !Array.isArray(bobSegment) || aliceSegment.length === 0 || bobSegment.length === 0) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-light)', marginTop: 20 }}>
                <Activity size={32} className="spin" style={{ marginBottom: '12px', opacity: 0.5 }} />
                <div style={{ fontWeight: 600 }}>Preparing Cascade Reconciliation Diagram...</div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>Complete sifting first to generate parity blocks</div>
            </div>
        );
    }

    const blockSize = displaySize >= 24 ? 8 : 4;
    const blocks = buildBlocks(aliceSegment, bobSegment, blockSize);
    const mismatchBlocks = blocks.filter((b) => b.mismatch);

    const executeAutoSearch = (block: any) => {
        const frames = buildSearchFrames(aliceSegment, bobWorkingKey, block.start, block.end);
        setSelectedBlock(block);
        setSearchFrames(frames);
        setFrameIndex(0);
        setResolvedBitIndex(null);
        setView('resolution');
        setIsAutoPlaying(true);

        if (frames.length === 0) {
            setIsAutoPlaying(false);
            return;
        }

        frames.forEach((_, idx) => {
            setTimeout(() => {
                setFrameIndex(idx);
            }, idx * 700);
        });

        const last = frames[frames.length - 1];
        const finishDelay = frames.length * 700;
        setTimeout(() => {
            const bit = last.range[0];
            setResolvedBitIndex(bit);
            setIsAutoPlaying(false);
            // Auto-flip for requested auto-play behavior.
            setTimeout(() => {
                applyBitFlip(bit);
            }, 550);
        }, finishDelay);
    };

    const applyBitFlip = (bitIndex: number) => {
        if (bitIndex < 0 || bitIndex >= bobWorkingKey.length) return;
        const next = [...bobWorkingKey];
        next[bitIndex] = next[bitIndex] === 1 ? 0 : 1;
        setBobWorkingKey(next);
        setBobSiftedNoisyKey(next);
        if (onCorrectionConfirmed) onCorrectionConfirmed(next);
    };

    return (
        <div style={{ background: '#fdfbf7', borderRadius: '16px', padding: '28px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <TabButton active={view === 'detection'} onClick={() => setView('detection')} label="1. Block View" />
                <TabButton active={view === 'resolution'} onClick={() => setView('resolution')} label="2. Binary Search" disabled={!selectedBlock} />
                <TabButton active={view === 'final'} onClick={() => setView('final')} label="3. Final Match" />
            </div>

            <AnimatePresence mode="wait">
                {view === 'detection' && (
                    <motion.div key="detection" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div style={{ marginBottom: 14, textAlign: 'center', fontSize: 13, color: '#475569' }}>
                            Keys are divided into blocks of size {blockSize}. Click a red mismatch block to start automatic binary-search correction.
                        </div>

                        <BlockRow title="Alice" bits={aliceSegment} blocks={blocks} />
                        <BlockRow title="Bob" bits={bobSegment} blocks={blocks} isBob />

                        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                            {blocks.map((b) => (
                                <button
                                    key={b.label}
                                    onClick={() => b.mismatch && executeAutoSearch(b)}
                                    disabled={!b.mismatch}
                                    className="btn btn-secondary"
                                    style={{
                                        fontSize: 12,
                                        padding: '0 10px',
                                        height: 28,
                                        borderColor: b.mismatch ? '#dc2626' : '#10b981',
                                        color: b.mismatch ? '#b91c1c' : '#065f46',
                                        background: b.mismatch ? '#fef2f2' : '#ecfdf5',
                                        cursor: b.mismatch ? 'pointer' : 'default',
                                        opacity: b.mismatch ? 1 : 0.7,
                                    }}
                                >
                                    {b.label} {b.mismatch ? 'Mismatch (X)' : 'Match (✓)'}
                                </button>
                            ))}
                        </div>

                        {mismatchBlocks.length === 0 && (
                            <div style={{ marginTop: 12, fontSize: 12, color: '#059669', textAlign: 'center', fontWeight: 700 }}>
                                No mismatched blocks detected in the displayed segment.
                            </div>
                        )}

                        <div style={{ marginTop: 18, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
                            Eve learns almost nothing! Only parity (even/odd) is shared, not actual bit values.
                        </div>
                    </motion.div>
                )}

                {view === 'resolution' && selectedBlock && (
                    <motion.div key="resolution" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div style={{ fontSize: 13, textAlign: 'center', marginBottom: 16, color: '#475569' }}>
                            {selectedBlock.label} auto-search in progress: splitting range until one bit remains.
                        </div>

                        {searchFrames.length > 0 && (
                            <div style={{ display: 'grid', gap: 10 }}>
                                {searchFrames.slice(0, frameIndex + 1).map((f, idx) => (
                                    <motion.div
                                        key={`${f.range[0]}-${f.range[1]}-${idx}`}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: 10, padding: 10 }}
                                    >
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                            Round {idx + 1}: [{f.range[0]}..{f.range[1]}] {'->'} left parity {f.leftMismatch ? 'mismatch' : 'match'}
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {renderRangeBits(aliceSegment, bobWorkingKey, f.range[0], f.range[1])}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {isAutoPlaying && (
                            <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: '#92400e' }}>
                                Auto-play splitting animation running...
                            </div>
                        )}

                        {resolvedBitIndex !== null && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 14, textAlign: 'center' }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c', marginBottom: 8 }}>
                                    Resolved bit index: {resolvedBitIndex} (auto-flipped)
                                </div>
                                <button className="btn btn-secondary" onClick={() => setView('final')}>Show Final Stage</button>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {view === 'final' && (
                    <motion.div key="final" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <ShieldCheck size={52} color="#ed8936" style={{ marginBottom: 10 }} />
                            <div style={{ fontSize: '20px', fontWeight: 900, color: '#2d3748' }}>Step-by-Step Reconciliation Complete</div>
                        </div>

                        {paStats && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
                                <MetricBox label="Corrected Key" value={paStats.input_length} unit="bits" />
                                <MetricBox label="Privacy Loss" value={`-${(paStats.parity_leakage ?? 0) + (paStats.entropy_loss ?? 0)}`} unit="bits" color="#b91c1c" />
                                <MetricBox label="Final Secret" value={paStats.final_length} unit="bits" color="#b45309" />
                            </div>
                        )}

                        {traceRounds.length > 0 && (
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, background: '#fff' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Cascade Trace</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {traceRounds.map((r: any, i: number) => {
                                        const corrections = Array.isArray(r.corrections) ? r.corrections : [];
                                        const rippleCount = corrections.filter((c: any) => c.type === 'ripple').length;
                                        return (
                                            <div key={`${r.round}-${i}`} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, background: '#f8fafc' }}>
                                                <div style={{ fontSize: 12, fontWeight: 700 }}>Round {r.round} · Ripple Counter: <span style={{ color: '#F59E0B' }}>{rippleCount}</span></div>
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                                    {corrections.map((c: any, idx: number) => {
                                                        const ripple = c.type === 'ripple';
                                                        return (
                                                            <motion.span
                                                                key={`${r.round}-${idx}`}
                                                                animate={ripple ? { scale: [1, 1.06, 1] } : {}}
                                                                transition={ripple ? { duration: 1.1, repeat: Infinity, repeatDelay: 1.2 } : {}}
                                                                style={{
                                                                    fontSize: 11,
                                                                    padding: '4px 7px',
                                                                    borderRadius: 999,
                                                                    border: `1px solid ${ripple ? '#F59E0B' : '#10B981'}`,
                                                                    color: ripple ? '#92400e' : '#065f46',
                                                                    background: ripple ? 'rgba(245,158,11,0.16)' : 'rgba(16,185,129,0.16)',
                                                                }}
                                                            >
                                                                pos {c.position} · {ripple ? 'ripple' : 'direct'}
                                                            </motion.span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

function buildBlocks(aliceBits: number[], bobBits: number[], blockSize: number) {
    const blocks = [];
    let labelIndex = 0;
    for (let start = 0; start < aliceBits.length; start += blockSize) {
        const end = Math.min(aliceBits.length - 1, start + blockSize - 1);
        const aParity = parity(aliceBits.slice(start, end + 1));
        const bParity = parity(bobBits.slice(start, end + 1));
        blocks.push({
            start,
            end,
            label: `Block ${String.fromCharCode(65 + labelIndex)}`,
            mismatch: aParity !== bParity,
            aliceParity: aParity,
            bobParity: bParity,
        });
        labelIndex += 1;
    }
    return blocks;
}

function buildSearchFrames(aliceBits: number[], bobBits: number[], start: number, end: number) {
    const frames = [];
    let l = start;
    let r = end;
    while (l < r) {
        const mid = Math.floor((l + r) / 2);
        const aLeft = parity(aliceBits.slice(l, mid + 1));
        const bLeft = parity(bobBits.slice(l, mid + 1));
        const leftMismatch = aLeft !== bLeft;
        frames.push({
            range: [l, r],
            mid,
            leftMismatch,
        });
        if (leftMismatch) {
            r = mid;
        } else {
            l = mid + 1;
        }
    }
    return frames;
}

function renderRangeBits(aliceBits: number[], bobBits: number[], start: number, end: number) {
    const items = [];
    for (let i = start; i <= end; i++) {
        const mismatch = aliceBits[i] !== bobBits[i];
        items.push(
            <div
                key={`bit-${i}`}
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    border: `1px solid ${mismatch ? '#dc2626' : '#10b981'}`,
                    background: mismatch ? '#fee2e2' : '#ecfdf5',
                }}
            >
                {bobBits[i]}
            </div>
        );
    }
    return items;
}

function parity(bits: number[]) {
    return bits.reduce((acc, b) => acc ^ b, 0);
}

function BlockRow({ title, bits, blocks, isBob = false }: any) {
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>{title}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {bits.map((b: number, idx: number) => (
                    <div key={`${title}-${idx}`} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                        {b}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {blocks.map((b: any) => (
                    <div key={`${title}-${b.label}`} style={{ fontSize: 11, fontWeight: 700, color: b.mismatch ? '#b91c1c' : '#065f46', border: `1px solid ${b.mismatch ? '#fca5a5' : '#86efac'}`, background: b.mismatch ? '#fef2f2' : '#ecfdf5', borderRadius: 999, padding: '3px 8px' }}>
                        {b.label}: {isBob ? b.bobParity : b.aliceParity} {b.mismatch ? <X size={10} style={{ display: 'inline' }} /> : <Check size={10} style={{ display: 'inline' }} />}
                    </div>
                ))}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, label, disabled = false }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12, padding: '0 16px', opacity: disabled ? 0.45 : 1 }}
        >
            {label}
        </button>
    );
}

function MetricBox({ label, value, unit, color = '#2d3748' }: any) {
    return (
        <div style={{ textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, background: '#fff' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'center' }}>
                <span style={{ fontSize: 24, fontWeight: 900, color }}>{value}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{unit}</span>
            </div>
        </div>
    );
}

export default CascadeVisualizer;
