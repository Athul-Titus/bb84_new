import React from 'react';
import ConnectionPanel from './components/ConnectionPanel';
import AlicePanel from './components/AlicePanel';
import BobPanel from './components/BobPanel';
import LogTerminal from './components/LogTerminal';
import Messaging from './components/Messaging';
import { useProject } from './context/ProjectContext';
import { User, Download } from 'lucide-react';

const App: React.FC = () => {
  const { role, setRole, connected } = useProject();

  return (
    <div className="app-container">
      <header className="header">
        <h1>⚛️ BB84 Protocol - True P2P Mode</h1>
        <div className="role-selector">
          <button
            className={`btn ${role === 'alice' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRole('alice')}
          >
            <User size={16} /> Alice (Sender)
          </button>
          <button
            className={`btn ${role === 'bob' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setRole('bob')}
          >
            <Download size={16} /> Bob (Receiver)
          </button>
        </div>
      </header>

      <div className="main-grid">
        <div className="left-panel">
          <ConnectionPanel />

          {connected && (
            <>
              {role === 'alice' ? <AlicePanel /> : <BobPanel />}
            </>
          )}

          {connected && <Messaging />}

        </div>

        <div className="right-panel">
          <LogTerminal />
        </div>
      </div>
    </div>
  );
};

export default App;
