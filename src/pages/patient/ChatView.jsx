import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSession } from '../../services/api';
import { getInitials, formatTime, SPECIALIZATIONS } from '../../services/constants';
import Badge from '../../components/ui/Badge';

export default function ChatView() {
    const { id } = useParams();
    const { user } = useAuth();
    const [session, setSession] = useState(null);
    const messagesRef = useRef(null);

    useEffect(() => {
        if (!user || !id) return;
        getSession(id).then(setSession).catch(() => setSession(null));
    }, [user, id]);

    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [session]);

    if (!session) {
        return (
            <div style={{ textAlign: 'center', padding: 40 }}>
                <h2>Loading session...</h2>
            </div>
        );
    }

    const spec = SPECIALIZATIONS.find(s => s.id === session.specialization) || SPECIALIZATIONS[SPECIALIZATIONS.length - 1];
    const initials = getInitials(`${user.firstName} ${user.lastName}`);
    const isSpecialist = session.type === 'specialist';

    // Filter out hidden system messages
    const visibleMessages = (session.messages || []).filter(m => m.type !== 'hidden');

    return (
        <div style={{ padding: '0 20px', maxWidth: 1000, margin: '0 auto', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: 16 }}>
                <Link to="/patient/chat-history" style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 600 }}>
                    <i className="fas fa-arrow-left"></i> Back to History
                </Link>
            </div>

            <div className="chat-container" style={{ flex: 1, height: 'auto', marginBottom: 20 }}>
                <div className="chat-header-bar">
                    <div className="chat-agent-avatar" style={{ background: isSpecialist ? spec.color : '' }}>
                        <i className={`fas ${isSpecialist ? spec.icon : 'fa-robot'}`}></i>
                    </div>
                    <div>
                        <div className="chat-agent-name">{isSpecialist ? `${spec.name} Specialist` : 'Triage Assistant'}</div>
                        <div className="chat-agent-status">Session Closed</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}><Badge status={session.status} /></div>
                </div>

                <div className="chat-messages" ref={messagesRef}>
                    {visibleMessages.length === 0 ? (
                        <p className="text-center text-muted">No messages found.</p>
                    ) : (
                        visibleMessages.map((m, i) => (
                            <div key={m.id || i} className={`chat-bubble ${m.sender === 'user' ? 'user' : m.sender === 'system' ? 'agent' : 'agent'}`}>
                                <div className="chat-bubble-avatar" style={m.sender !== 'user' ? { background: m.sender === 'system' ? 'var(--success)' : (isSpecialist ? spec.color : '') } : {}}>
                                    {m.sender === 'user' ? initials : m.sender === 'system' ? <i className="fas fa-check-circle"></i> : <i className={`fas ${isSpecialist ? spec.icon : 'fa-robot'}`}></i>}
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
                        ))
                    )}
                </div>
                <div className="chat-input-bar" style={{ justifyContent: 'center', backgroundColor: 'var(--surface)' }}>
                    <p className="text-muted text-sm">This session is closed and read-only.</p>
                </div>
            </div>
        </div>
    );
}
