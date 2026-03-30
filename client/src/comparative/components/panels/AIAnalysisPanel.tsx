import { useState } from 'react';
import { useAIAgent } from '../../hooks/useAIAgent';

const SUGGESTED = [
  'Why is E91 best in the paper but QSafe has more engineering features?',
  'Compare Cascade reconciliation in QSafe with paper protocol post-processing.',
  'What does QSafe include that none of the paper simulations implement?',
  'How would QSafe and E91 differ on SCADA deployment risk?',
];

export function AIAnalysisPanel() {
  const [input, setInput] = useState('');
  const { messages, loading, error, sendMessage, clearChat } = useAIAgent();

  const exportConversation = () => {
    if (messages.length === 0) return;

    const lines = [
      'QSafe Comparative AI Conversation',
      `Exported: ${new Date().toISOString()}`,
      '',
      ...messages.flatMap((m, idx) => [
        `#${idx + 1} ${m.role.toUpperCase()}`,
        m.content,
        '',
      ]),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qsafe-ai-conversation-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const submit = async () => {
    const value = input.trim();
    if (!value || loading) return;
    setInput('');
    await sendMessage(value);
  };

  return (
    <section style={{ display: 'grid', gap: 14 }}>
      <div className="card">
        <div className="section-title">AI Comparative Analysis</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 12 }}>
          Ask protocol-specific questions. Responses are grounded in the paper knowledge base and QSafe metrics.
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {SUGGESTED.map((s) => (
            <button key={s} className="btn btn-secondary" style={{ padding: '8px 10px', fontSize: 12 }} onClick={() => void sendMessage(s)}>
              {s}
            </button>
          ))}
        </div>

        <div
          style={{
            border: '1px solid var(--border-light)',
            borderRadius: 12,
            padding: 12,
            minHeight: 280,
            maxHeight: 420,
            overflowY: 'auto',
            background: 'var(--bg-primary)',
          }}
        >
          {messages.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No messages yet. Start with a suggested prompt.</p> : null}
          {messages.map((m, idx) => (
            <div key={`${m.role}-${idx}`} style={{ marginBottom: 10, textAlign: m.role === 'user' ? 'right' : 'left' }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '8px 10px',
                  borderRadius: 10,
                  maxWidth: '80%',
                  background: m.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-card)',
                  color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border-light)',
                  whiteSpace: 'pre-wrap',
                  textAlign: 'left',
                }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading ? <p style={{ color: 'var(--text-secondary)' }}>Generating response...</p> : null}
          {error ? <p style={{ color: 'var(--red-error)' }}>{error}</p> : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 8, marginTop: 10 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input-group"
            placeholder="Ask a protocol comparison question..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void submit();
              }
            }}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid var(--border-light)',
              background: 'var(--bg-card)',
            }}
          />
          <button className="btn btn-primary" onClick={() => void submit()} disabled={loading}>
            Send
          </button>
          <button className="btn btn-secondary" onClick={exportConversation} disabled={loading || messages.length === 0}>
            Export
          </button>
          <button className="btn btn-secondary" onClick={clearChat} disabled={loading}>
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}
