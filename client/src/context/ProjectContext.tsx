import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface LogEntry {
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    time: string;
}

interface ProjectContextType {
    role: 'alice' | 'bob';
    setRole: (role: 'alice' | 'bob') => void;
    logs: LogEntry[];
    addLog: (type: LogEntry['type'], msg: string) => void;

    // Connection
    localIP: string;
    peerIP: string;
    setPeerIP: (ip: string) => void;
    connected: boolean;
    setConnected: (status: boolean) => void;

    // Quantum State
    aliceBits: number[];
    aliceBases: number[];
    setAliceState: (bits: number[], bases: number[]) => void;

    bobBases: number[];
    bobBits: number[];
    setBobState: (bases: number[], bits: number[]) => void;

    sharedKey: number[];
    setSharedKey: (key: number[]) => void;

    // Network Config
    noiseConfig: any;
    setNoiseConfig: (config: any) => void;

    resetState: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) throw new Error('useProject must be used within a ProjectProvider');
    return context;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<'alice' | 'bob'>('alice');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [localIP, setLocalIP] = useState<string>('Fetching...');
    const [peerIP, setPeerIP] = useState<string>('');
    const [connected, setConnected] = useState<boolean>(false);

    const [aliceBits, setAliceBits] = useState<number[]>([]);
    const [aliceBases, setAliceBases] = useState<number[]>([]);

    const [bobBases, setBobBases] = useState<number[]>([]);
    const [bobBits, setBobBits] = useState<number[]>([]);

    const [sharedKey, setSharedKey] = useState<number[]>([]);
    const [noiseConfig, setNoiseConfig] = useState<any>({ eve_active: false });

    const pollRef = useRef<any>(null);

    useEffect(() => {
        // Initial Config Fetch
        axios.get('/api/config')
            .then(res => {
                if (res.data.local_ip) {
                    setLocalIP(res.data.local_ip);
                    addLog('info', `System initialized. Local IP: ${res.data.local_ip}`);
                }
            })
            .catch(err => {
                console.error(err);
                addLog('error', 'Failed to fetch local configuration.');
            });

        axios.get('/api/get_noise_config').then(res => {
            setNoiseConfig(res.data);
        }).catch(err => console.error(err));
    }, []);

    const addLog = (type: LogEntry['type'], message: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-99), { type, message, time }]);
    };

    // Poll for network status to see if a peer connected to us
    useEffect(() => {
        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get('/api/network/status');
                if (res.data.connected && res.data.peer_ip !== peerIP) {
                    setPeerIP(res.data.peer_ip);
                    setConnected(true);
                    addLog('success', `Peer connected from ${res.data.peer_ip}`);
                }
            } catch (e) {
                // ignore
            }
        }, 3000);
        return () => clearInterval(pollRef.current);
    }, [peerIP]);

    const setAliceState = (bits: number[], bases: number[]) => {
        setAliceBits(bits);
        setAliceBases(bases);
    };

    const setBobState = (bases: number[], bits: number[]) => {
        setBobBases(bases);
        setBobBits(bits);
    };

    const resetState = () => {
        setAliceBits([]);
        setAliceBases([]);
        setBobBases([]);
        setBobBits([]);
        setSharedKey([]);
        addLog('info', 'State reset.');
        axios.post('/api/chat/clear').catch(() => {});
    };

    const value: ProjectContextType = {
        role, setRole,
        logs, addLog,
        localIP, peerIP, setPeerIP, connected, setConnected,
        aliceBits, aliceBases, setAliceState,
        bobBases, bobBits, setBobState,
        sharedKey, setSharedKey,
        noiseConfig, setNoiseConfig,
        resetState
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};
