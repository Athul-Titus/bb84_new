// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';
import { Send, Lock, Shield, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import './ChatInterface.css';

interface ChatEntry {
    id: string;
    sender: string;
    plaintext: string;
    encrypted_hex: string;
    msg_bits?: string;
    key_used?: string;
    encrypted_bits?: string;
    timestamp: number;
}

const ChatInterface: React.FC = () => {
    const { role, sharedKey, addLog, connected } = useProject();
    const [messages, setMessages] = useState<ChatEntry[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatAreaRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<any>(null);
    const shouldAutoScroll = useRef(true);
    const prevMsgCount = useRef(0);

    const keyStr = sharedKey.join('');
    const hasKey = keyStr.length > 0;

    // Track if user has scrolled up
    const handleScroll = () => {
        if (!chatAreaRef.current) return;
        const el = chatAreaRef.current;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        shouldAutoScroll.current = atBottom;
    };

    // Poll for messages from backend
    useEffect(() => {
        if (!connected) return;

        const fetchMessages = async () => {
            try {
                const res = await axios.post('/api/chat/messages', { key: keyStr });
                const fetched = res.data.messages || [];
                setMessages(fetched);
            } catch (e) {
                // ignore
            }
        };

        fetchMessages();
        pollRef.current = setInterval(fetchMessages, 1500);
        return () => clearInterval(pollRef.current);
    }, [connected, keyStr]);

    // Only auto-scroll when user is at bottom or new messages arrive
    useEffect(() => {
        if (messages.length > prevMsgCount.current) {
            // New message arrived — scroll if user was at bottom
            if (shouldAutoScroll.current) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
        prevMsgCount.current = messages.length;
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !hasKey || sending) return;

        setSending(true);
        shouldAutoScroll.current = true; // Always scroll on own send
        try {
            await axios.post('/api/chat/send', {
                message: input.trim(),
                sender: role,
                key: keyStr
            });
            setInput('');
            addLog('success', 'Message encrypted & sent securely.');

            // Immediately refresh
            const res = await axios.post('/api/chat/messages', { key: keyStr });
            setMessages(res.data.messages || []);
        } catch (err: any) {
            addLog('error', err.response?.data?.error || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isMine = (msg: ChatEntry) => msg.sender === role;

    return (
        <div className="chat-container">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header__left">
                    <div className="chat-header__avatar">
                        {role === 'alice' ? 'A' : 'B'}
                    </div>
                    <div>
                        <div className="chat-header__title">Quantum Secure Chat</div>
                        <div className="chat-header__subtitle">
                            {hasKey
                                ? `End-to-end encrypted · ${keyStr.length}-bit key`
                                : 'No quantum key established'}
                        </div>
                    </div>
                </div>
                <div className="chat-header__right">
                    {hasKey ? (
                        <span className="security-badge security-badge--active">
                            <ShieldCheck size={14} />
                            Quantum Secured
                        </span>
                    ) : (
                        <span className="security-badge">
                            <Shield size={14} />
                            Not Secured
                        </span>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="chat-messages-area" ref={chatAreaRef} onScroll={handleScroll}>
                {messages.length === 0 && (
                    <div className="chat-empty">
                        <Lock size={32} strokeWidth={1.5} />
                        <p>No messages yet</p>
                        <span>
                            {hasKey
                                ? 'Start a quantum-encrypted conversation'
                                : 'Generate a quantum key first to start chatting'}
                        </span>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`message-row ${isMine(msg) ? 'message-row--sent' : 'message-row--received'}`}
                    >
                        <div className={`message-bubble ${isMine(msg) ? 'message-bubble--sent' : 'message-bubble--received'}`}>
                            {!isMine(msg) && (
                                <div className="message-sender">
                                    {msg.sender === 'alice' ? 'Alice' : 'Bob'}
                                </div>
                            )}
                            <div className="message-text">{msg.plaintext}</div>
                            <div className="message-meta">
                                <span className="message-time">{formatTime(msg.timestamp)}</span>
                                <button
                                    className="message-enc-toggle"
                                    onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                                >
                                    <Lock size={10} />
                                    {expandedId === msg.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                </button>
                            </div>

                            {expandedId === msg.id && (
                                <div className="message-enc-details">
                                    <div className="enc-row">
                                        <span className="enc-label">Cipher</span>
                                        <span className="enc-value enc-value--cipher">{msg.encrypted_hex}</span>
                                    </div>
                                    {msg.msg_bits && (
                                        <div className="enc-row">
                                            <span className="enc-label">Bits</span>
                                            <span className="enc-value">{msg.msg_bits.substring(0, 40)}...</span>
                                        </div>
                                    )}
                                    {msg.key_used && (
                                        <div className="enc-row">
                                            <span className="enc-label">Key</span>
                                            <span className="enc-value enc-value--key">{msg.key_used.substring(0, 40)}...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
                <input
                    type="text"
                    className="chat-text-input"
                    placeholder={hasKey ? "Type a message..." : "Generate quantum key to start chatting"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!hasKey || sending}
                />
                <button
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={!hasKey || !input.trim() || sending}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;
