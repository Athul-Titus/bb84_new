// @ts-nocheck
import React, { useState } from 'react';
import { Wifi, WifiOff, Link } from 'lucide-react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';

const ConnectionPanel: React.FC = () => {
    const { peerIP, setPeerIP, connected, setConnected, addLog } = useProject();
    const [ipInput, setIpInput] = useState(peerIP);

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
