// @ts-nocheck
import React, { useState } from 'react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';
import { Radio, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const AlicePanel: React.FC = () => {
    const {
        connected,
        addLog,
        aliceBits,
        aliceBases,
        setAliceState,
        sharedKey,
        setSharedKey
    } = useProject();

    const [length, setLength] = useState(10);
    const [loading, setLoading] = useState(false);

    // Poll for key status if we have generated bits but no key yet
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (aliceBits.length > 0 && sharedKey.length === 0) {
            interval = setInterval(async () => {
                try {
                    const res = await axios.get('/api/alice/key_status');
                    if (res.data.sharedKey) {
                        setSharedKey(res.data.sharedKey);
                        addLog('success', `Key Established with Bob! Length: ${res.data.sharedKey.length}`);
                        clearInterval(interval);
                    }
                } catch (e) {
                    // ignore errors while polling
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [aliceBits, sharedKey, setSharedKey, addLog]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            addLog('info', `Alice generating ${length} qubits...`);
            const res = await axios.post('/api/generate_keys', { length: parseInt(length.toString()) });

            const { aliceBits, aliceBases } = res.data;
            setAliceState(aliceBits, aliceBases);
            addLog('success', 'Qubits prepared and sent to Quantum Channel.');
        } catch (err: any) {
            addLog('error', err.message || 'Generation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="section-title">
                <Radio size={22} /> Alice (Sender)
            </div>

            <div className="input-group">
                <label>Key Length (Bits)</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        type="number"
                        min="5"
                        max="50"
                        value={length}
                        onChange={(e) => setLength(parseInt(e.target.value))}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleGenerate}
                        disabled={loading}
                        style={{ whiteSpace: 'nowrap', padding: '0 32px' }}
                    >
                        {loading ? <Activity className="animate-pulse" /> : '⚡ Generate Qubits'}
                    </button>
                </div>
            </div>

            {aliceBits.length > 0 && (
                <div className="mt-4">
                    <div style={{ marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Alice's Bits (Hidden from Eve)
                    </div>
                    <div className="visual-grid">
                        {aliceBits.map((b, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className={`box bit-${b}`}
                            >
                                {b}
                            </motion.div>
                        ))}
                    </div>

                    <div style={{ marginTop: '24px', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Bases (+ / x)
                    </div>
                    <div className="visual-grid">
                        {aliceBases.map((base, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 + 0.2 }}
                                className={`box basis-${base === 0 ? 'rect' : 'diag'}`}
                            >
                                {base === 0 ? '+' : 'x'}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {sharedKey.length > 0 && (
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
                        ✅ Secure Shared Key Established
                    </div>
                    <div className="visual-grid">
                        {sharedKey.map((b, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.02 }}
                                className={`box bit-${b}`}
                                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                            >
                                {b}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default AlicePanel;
