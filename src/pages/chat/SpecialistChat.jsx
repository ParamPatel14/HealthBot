import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createSession, getUserSessions, sendChatMessage, addMessage, addUpload, updateSessionStatus } from '../../services/api';
import { getInitials, formatTime, SPECIALIZATIONS, SEED_DOCTORS } from '../../services/constants';
import Badge from '../../components/ui/Badge';

export default function SpecialistChat() {
    const { specId } = useParams();
    const { user } = useAuth();
    const showToast = useToast();
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [uploads, setUploads] = useState([]);
    const [typing, setTyping] = useState(false);
    const messagesRef = useRef(null);
    const fileRef = useRef(null);
    const imageRef = useRef(null);
    const initialized = useRef(false);

    const spec = SPECIALIZATIONS.find(s => s.id === specId) || SPECIALIZATIONS[SPECIALIZATIONS.length - 1];
    const doctor = SEED_DOCTORS.find(d => d.specialization === specId) || SEED_DOCTORS[0];

    useEffect(() => {
        if (!user) return;
        if (initialized.current) return;
        initialized.current = true;

        const init = async () => {
            const sessions = await getUserSessions(user.id);
            let s = sessions.find(s => s.type === 'specialist' && s.specialization === specId && s.status === 'active');
            if (!s) {
                s = await createSession(user.id, 'specialist', specId);
                await updateSessionStatus(s.id, 'active', `doc_${specId}`);
                const greeting = await addMessage(s.id, {
                    sender: 'agent', senderName: `${spec.name} Specialist Assistant`,
                    text: `Hello ${user.firstName || 'there'}! I am the ${spec.name} Assistant. I've reviewed the information from your triage phase.\n\nTo provide the most accurate assessment to the doctor, please share:\n• Current symptoms in detail\n• Previous prescriptions or medications\n• Old reports or test results (upload images/documents below)\n• Any voice notes describing your condition\n\nLet's start — how would you describe your current condition?`,
                    type: 'text',
                });
                s.messages = [greeting];
                s.assignedDoctor = `doc_${specId}`;
            }
            setSession(s);
            setMessages(s.messages || []);
        };
        init();
    }, [user, specId]);

    const scrollToBottom = () => {
        if (messagesRef.current) setTimeout(() => { messagesRef.current.scrollTop = messagesRef.current.scrollHeight; }, 50);
    };
    useEffect(scrollToBottom, [messages, typing]);

    const handleFileUpload = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploads(prev => [...prev, { name: file.name, type, size: `${(file.size / 1024).toFixed(1)} KB` }]);
        e.target.value = '';
    };

    const handleVoice = () => {
        showToast('Recording voice note... (simulated)', 'info');
        setTimeout(() => {
            setUploads(prev => [...prev, { name: 'voice_note.mp3', type: 'audio', size: '120 KB' }]);
            showToast('Voice note recorded!', 'success');
        }, 2000);
    };

    const sendMsg = async () => {
        if (!input.trim() && uploads.length === 0) return;
        if (!session) return;
        const text = input.trim() || 'Shared files';
        setInput('');
        setTyping(true);

        // Optimistic UI update: instantly show user's message
        const attachmentsCopy = uploads.length > 0 ? [...uploads] : undefined;
        const tempUserMsg = { id: 'temp_' + Date.now(), sender: 'user', text, attachments: attachmentsCopy, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, tempUserMsg]);

        // Record uploads to backend
        const attachments = uploads.length > 0 ? [...uploads] : undefined;
        if (uploads.length > 0) {
            for (const u of uploads) await addUpload(session.id, u);
            setUploads([]);
        }

        try {
            // Send to backend — LangChain specialist agent processes and responds
            const result = await sendChatMessage(session.id, {
                sender: 'user', text, type: 'text', attachments,
            });
            // Replace optimistic data with definitive DB data
            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== tempUserMsg.id);
                return [...filtered, result.userMessage, result.agentMessage];
            });
            setTyping(false);

            // If report was generated
            if (result.reportGenerated) {
                showToast('Report generated and sent for doctor review!', 'success');
            }
        } catch (err) {
            setTyping(false);
            setMessages(prev => [...prev, { id: Date.now(), sender: 'agent', text: 'Sorry, I encountered an error. Please try again.', timestamp: new Date().toISOString() }]);
        }
    };

    const initials = user ? getInitials(`${user.firstName} ${user.lastName}`) : '?';

    return (
        <div className="chat-container">
            <div className="chat-header-bar">
                <div className="chat-agent-avatar" style={{ background: spec.color }}><i className={`fas ${spec.icon}`}></i></div>
                <div>
                    <div className="chat-agent-name">{spec.name} Specialist</div>
                    <div className="chat-agent-status">Online · Powered by Gemini Pro · Assigned to {doctor.name}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>{session && <Badge status={session.status} />}</div>
            </div>
            <div className="chat-messages" ref={messagesRef}>
                {messages.filter(m => m.type !== 'hidden').map((m, i) => (
                    <div key={m.id || i} className={`chat-bubble ${m.sender === 'user' ? 'user' : m.sender === 'system' ? 'agent' : 'agent'}`}>
                        <div className="chat-bubble-avatar" style={m.sender !== 'user' ? { background: m.sender === 'system' ? 'var(--success)' : spec.color } : {}}>
                            {m.sender === 'user' ? initials : m.sender === 'system' ? <i className="fas fa-check-circle"></i> : <i className={`fas ${spec.icon}`}></i>}
                        </div>
                        <div>
                            <div className="chat-bubble-content">
                                {m.text}
                                {m.attachments?.map((a, j) => (
                                    <div key={j} className="chat-attachment">
                                        <i className={`fas ${a.type === 'image' ? 'fa-image' : a.type === 'audio' ? 'fa-microphone' : 'fa-file'}`}></i>
                                        <span>{a.name}</span><span className="text-xs text-muted">{a.size}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="chat-bubble-time">{formatTime(m.timestamp)}</div>
                        </div>
                    </div>
                ))}
                {typing && (
                    <div className="chat-bubble agent">
                        <div className="chat-bubble-avatar" style={{ background: spec.color }}><i className={`fas ${spec.icon}`}></i></div>
                        <div className="chat-bubble-content">
                            <div className="typing-indicator"><div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div></div>
                        </div>
                    </div>
                )}
            </div>
            {uploads.length > 0 && (
                <div className="upload-preview">
                    {uploads.map((u, i) => (
                        <div key={i} className="upload-preview-item">
                            <i className={`fas ${u.type === 'image' ? 'fa-image' : u.type === 'audio' ? 'fa-microphone' : 'fa-file'}`} style={{ color: 'var(--accent)' }}></i>
                            <span>{u.name}</span>
                            <button className="upload-preview-remove" onClick={() => setUploads(prev => prev.filter((_, j) => j !== i))}><i className="fas fa-times"></i></button>
                        </div>
                    ))}
                </div>
            )}
            <div className="chat-input-bar">
                <div className="chat-input-actions">
                    <button className="btn-icon" title="Upload document" onClick={() => fileRef.current?.click()}><i className="fas fa-paperclip"></i></button>
                    <button className="btn-icon" title="Upload image" onClick={() => imageRef.current?.click()}><i className="fas fa-image"></i></button>
                    <button className="btn-icon" title="Voice note" onClick={handleVoice}><i className="fas fa-microphone"></i></button>
                    <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx,.txt" onChange={e => handleFileUpload(e, 'document')} />
                    <input ref={imageRef} type="file" style={{ display: 'none' }} accept="image/*" onChange={e => handleFileUpload(e, 'image')} />
                </div>
                <textarea className="chat-text-input" placeholder="Describe your condition or share details..." rows="1" value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                    disabled={typing}
                ></textarea>
                <button className="chat-send-btn" onClick={sendMsg} disabled={typing}><i className="fas fa-paper-plane"></i></button>
            </div>
        </div>
    );
}
