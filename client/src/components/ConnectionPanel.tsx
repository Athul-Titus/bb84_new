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
    };

    return (
        <div className="card">
            <h2>
                <Link size={18} /> Network Configuration
            </h2>

            {/* Your IP Address */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--bg-secondary, #f5f3f0)',
                border: '1px solid var(--border, #e8e5e0)',
                borderRadius: '8px',
                marginBottom: '16px'
            }}>
                <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                        Your IP Address
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                        {localIP}
                    </div>
                </div>
                <button
                    onClick={handleCopy}
                    style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: copied ? 'var(--green, #1a7f37)' : 'var(--text-muted)',
                        transition: 'all 0.15s'
                    }}
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>

            <div className="input-group">
                <label>Peer IP Address</label>
                <div style={{ display: 'flex', gap: '10px' }}>
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
                    >
                        {connected ? <WifiOff size={16} /> : <Wifi size={16} />}
                        {connected ? 'Disconnect' : 'Connect'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConnectionPanel;
