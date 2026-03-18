import React, { useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';

const LogTerminal: React.FC = () => {
    const { logs } = useProject();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="log-panel">
            <div className="log-panel-title">📋 Activity Log</div>
            <div className="log-entries">
                {logs.length === 0 ? (
                    <div style={{ color: 'var(--text-faint)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                        Waiting for activity...
                    </div>
                ) : (
                    logs.slice(-30).map((log, i) => (
                        <div key={i} className={`log-entry log-entry--${log.type}`}>
                            <span className="log-entry__time">{log.time}</span>
                            {log.message}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
};

export default LogTerminal;
