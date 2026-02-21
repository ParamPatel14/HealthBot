import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createSession, getUserSessions, sendChatMessage, addMessage } from '../../services/api';
import { getInitials, formatTime } from '../../services/constants';
import Badge from '../../components/ui/Badge';

export default function TriageChat() {
    const { user } = useAuth();
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const messagesRef = useRef(null);
    const initialized = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;
        if (initialized.current) return;
        initialized.current = true;

        const init = async () => {
            const sessions = await getUserSessions(user.id);
            let s = sessions.find(s => s.type === 'triage' && s.status === 'active');
            if (!s) {
                s = await createSession(user.id, 'triage');
                // Add initial greeting via backend
                const greeting = await addMessage(s.id, {
                    sender: 'agent', senderName: 'Triage Assistant',
                    text: `Hello ${user.firstName || 'there'}! I am the automated triage assistant. I'm here to understand your health concerns and connect you with the right specialist.\n\nCould you please describe what symptoms or health issues you're experiencing?`,
                    type: 'text',
                });
                s.messages = [greeting];
            }
            setSession(s);
            setMessages(s.messages || []);
        };
        init();
    }, [user]);

    const scrollToBottom = () => {
        if (messagesRef.current) setTimeout(() => { messagesRef.current.scrollTop = messagesRef.current.scrollHeight; }, 50);
    };
    useEffect(scrollToBottom, [messages, typing]);

    const sendMsg = async () => {
        if (!input.trim() || !session) return;
        const text = input.trim();
        setInput('');
        setTyping(true);

        // Optimistic UI update: instantly show user's message
        const tempUserMsg = { id: 'temp_' + Date.now(), sender: 'user', text, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            // Send to backend — LangChain agent processes and responds
            const result = await sendChatMessage(session.id, {
                sender: 'user', text, type: 'text',
            });
            // Replace optimistic data with definitive DB data
            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== tempUserMsg.id);
                return [...filtered, result.userMessage, result.agentMessage];
            });
            setTyping(false);

            // If agent wants to route to specialist
            if (result.routeTo) {
                setTimeout(() => navigate(`/chat/routing/${result.routeTo}`), 2000);
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
                <div className="chat-agent-avatar"><i className="fas fa-robot"></i></div>
                <div>
                    <div className="chat-agent-name">Triage Assistant</div>
                    <div className="chat-agent-status">Online · Powered by Gemini Flash</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>{session && <Badge status={session.status} />}</div>
            </div>
            <div className="chat-messages" ref={messagesRef}>
                {messages.map((m, i) => (
                    <div key={m.id || i} className={`chat-bubble ${m.sender === 'user' ? 'user' : 'agent'}`}>
                        <div className="chat-bubble-avatar">
                            {m.sender === 'user' ? initials : <i className="fas fa-robot"></i>}
                        </div>
                        <div>
                            <div className="chat-bubble-content">{m.text}</div>
                            <div className="chat-bubble-time">{formatTime(m.timestamp)}</div>
                        </div>
                    </div>
                ))}
                {typing && (
                    <div className="chat-bubble agent">
                        <div className="chat-bubble-avatar"><i className="fas fa-robot"></i></div>
                        <div className="chat-bubble-content">
                            <div className="typing-indicator"><div className="typing-dot"></div><div className="typing-dot"></div><div className="typing-dot"></div></div>
                        </div>
                    </div>
                )}
            </div>
            <div className="chat-input-bar">
                <textarea className="chat-text-input" placeholder="Describe your symptoms..." rows="1" value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                ></textarea>
                <button className="chat-send-btn" onClick={sendMsg} disabled={typing}><i className="fas fa-paper-plane"></i></button>
            </div>
        </div>
    );
}
