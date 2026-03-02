import React, { useState } from 'react';
import { useQChat } from '../context/ProjectContext';

const QChatHeader: React.FC = () => {
    const { keyEstablished, clearChat, qkdData, localIP, peerIP, setPeerIP, connected, setConnected, addLog } = useQChat();
    const [showConnect, setShowConnect] = useState(false);
    const [ipInput, setIpInput] = useState(peerIP);

    const handleConnect = () => {
        if (ipInput.trim()) {
            setPeerIP(ipInput.trim());
            setConnected(true);
            addLog('success', `Connected to peer: ${ipInput.trim()}`);
            setShowConnect(false);
        }
    };

    const handleDisconnect = () => {
        setPeerIP('');
        setConnected(false);
        addLog('info', 'Disconnected from peer');
    };

    return (
        <div className="qchat-header">
            <div className="qchat-header__brand">
                <div className="qchat-header__icon">🔐</div>
                <div>
                    <div className="qchat-header__title">QChat</div>
                    <div className="qchat-header__subtitle">Quantum-Secured Messenger</div>
                </div>
            </div>

            <div className="qchat-header__status">
                {/* IP Connection */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        background: 'rgba(0, 240, 255, 0.06)',
                        border: '1px solid var(--border)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                    }}>
                        🖥️ {localIP}
                    </div>

                    {connected ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                                padding: '5px 12px',
                                borderRadius: '8px',
                                background: 'var(--green-dim)',
                                border: '1px solid var(--green-glow)',
                                fontSize: '11px',
                                color: 'var(--green)',
                                fontFamily: 'var(--font-mono)',
                            }}>
                                🔗 {peerIP}
                            </div>
                            <button
                                onClick={handleDisconnect}
                                style={{
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--red-glow)',
                                    background: 'var(--red-dim)',
                                    color: 'var(--red)',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <>
                            {showConnect ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <input
                                        type="text"
                                        placeholder="Peer IP..."
                                        value={ipInput}
                                        onChange={(e) => setIpInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                                        style={{
                                            padding: '5px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border)',
                                            background: 'rgba(0,0,0,0.3)',
                                            color: 'var(--text-primary)',
                                            fontSize: '11px',
                                            fontFamily: 'var(--font-mono)',
                                            width: '120px',
                                            outline: 'none',
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleConnect}
                                        style={{
                                            padding: '5px 10px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--green-glow)',
                                            background: 'var(--green-dim)',
                                            color: 'var(--green)',
                                            fontSize: '10px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Connect
                                    </button>
                                    <button
                                        onClick={() => setShowConnect(false)}
                                        style={{
                                            padding: '5px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border)',
                                            background: 'transparent',
                                            color: 'var(--text-muted)',
                                            fontSize: '10px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowConnect(true)}
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        background: 'rgba(0,0,0,0.2)',
                                        color: 'var(--text-muted)',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    🔌 Connect Peer
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Quantum badge */}
                {keyEstablished ? (
                    <div className="quantum-badge">
                        <span className="quantum-badge__dot" />
                        Quantum Secured Channel Active
                        <span style={{ opacity: 0.6 }}>• {qkdData?.keyLength} bit key</span>
                    </div>
                ) : (
                    <div className="quantum-badge" style={{ borderColor: 'rgba(255,153,0,0.3)', background: 'rgba(255,153,0,0.1)', color: '#ff9900' }}>
                        <span className="quantum-badge__dot" style={{ background: '#ff9900', boxShadow: '0 0 8px #ff9900' }} />
                        No Quantum Key
                    </div>
                )}

                <button
                    onClick={clearChat}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        cursor: 'pointer',
                    }}
                >
                    Clear Chat
                </button>
            </div>
        </div>
    );
};

export default QChatHeader;
