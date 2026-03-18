// @ts-nocheck
import React, { useState } from 'react';
import { Wifi, WifiOff, Link, Copy, Check } from 'lucide-react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';

const ConnectionPanel: React.FC = () => {
    const { localIP, peerIP, setPeerIP, connected, setConnected, addLog } = useProject();
    const [ipInput, setIpInput] = useState(peerIP);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (localIP && localIP !== 'Fetching...') {
            navigator.clipboard.writeText(localIP);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleConnect = async () => {
        if (!ipInput) {
            addLog('error', 'Please enter a Peer IP.');
            return;
        }

        addLog('info', `Attempting to connect to ${ipInput}...`);

        try {
            const res = await axios.post('/api/network/initiate', { target_ip: ipInput });
            if (res.data.status === 'success') {
                setPeerIP(ipInput);
                setConnected(true);
                addLog('success', `Connected to ${ipInput}`);
                axios.post('/api/chat/clear').catch(() => {});
            }
        } catch (err: any) {
            addLog('error', err.response?.data?.error || `Failed to connect to ${ipInput}`);
        }
    };

    const handleDisconnect = async () => {
        try {
            await axios.post('/api/network/disconnect');
        } catch (e) { }
        setConnected(false);
        setPeerIP('');
        addLog('warning', 'Disconnected from peer');
        axios.post('/api/chat/clear').catch(() => {});
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Your IP Address */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                background: 'var(--bg-sidebar)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)'
            }}>
                <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Your IP Address
                    </div>
                    <div className="display-font" style={{ fontSize: '24px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {localIP}
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: copied ? 'var(--green-success)' : 'var(--text-secondary)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        transition: 'all 0.15s'
                    }}
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>

            <div className="input-group">
                <label>Peer IP Address</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        type="text"
                        placeholder="e.g. 192.168.1.5"
                        value={ipInput}
                        onChange={(e) => setIpInput(e.target.value)}
                        disabled={connected}
                    />
                    <button
                        className={`btn ${connected ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={connected ? handleDisconnect : handleConnect}
                        style={{ whiteSpace: 'nowrap', padding: '0 32px' }}
                    >
                        {connected ? <WifiOff size={18} /> : <Wifi size={18} />}
                        {connected ? 'Disconnect' : 'Connect'}
                    </button>
                </div>
            </div>
            
            {/* Attack Mode panel (Guitouni et al. Section 4.1) */}
            <AttackModeSelector />
        </div>
    );
};

const AttackModeSelector: React.FC = () => {
    const { addLog } = useProject();
    const [mode, setMode] = useState<string>('none');

    const modes = [
        {
            id: 'none',
            label: 'No Attack',
            desc: 'Clean channel. No Eve, no noise.',
            color: 'var(--green-success)',
        },
        {
            id: 'eavesdrop',
            label: 'Eavesdropping',
            desc: 'Eve intercepts qubits (intercept-and-resend).',
            color: 'var(--amber-warning)',
        },
        {
            id: 'mitm',
            label: 'Man-in-the-Middle',
            desc: 'Eve intercepts all qubits + injects noise into classical channel.',
            color: 'var(--orange-warning)',
        },
        {
            id: 'dos',
            label: 'Denial of Service',
            desc: 'Heavy packet loss (40%) + channel noise. Key may fail to establish.',
            color: 'var(--red-danger)',
        },
    ];

    const handleSelect = async (newMode: string) => {
        setMode(newMode);
        await axios.post('/api/set_attack_mode', { mode: newMode });
        addLog('info', `[Attack Mode] Set to: ${newMode}`);
    };

    return (
        <div style={{ marginTop: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Attack Simulation (IoT Paper §4.1)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                {modes.map(m => (
                    <button
                        key={m.id}
                        onClick={() => handleSelect(m.id)}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: `1px solid ${mode === m.id ? m.color : 'var(--border-light)'}`,
                            background: mode === m.id ? `${m.color}14` : 'var(--bg-card)',
                            color: mode === m.id ? m.color : 'var(--text-secondary)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        <div>{m.label}</div>
                        <div style={{ fontWeight: 400, fontSize: '11px', marginTop: '3px', opacity: 0.75 }}>
                            {m.desc}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ConnectionPanel;
