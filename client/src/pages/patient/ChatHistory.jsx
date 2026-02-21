import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserSessions } from '../../services/api';
import { SPECIALIZATIONS, formatRelative } from '../../services/constants';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function ChatHistory() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (user) getUserSessions(user.id).then(setSessions);
    }, [user]);

    const filters = ['all', 'active', 'awaiting_review', 'completed'];
    const filterLabels = { all: 'All', active: 'Active', awaiting_review: 'Awaiting Review', completed: 'Completed' };
    const filtered = (filter === 'all' ? sessions : sessions.filter(s => s.status === filter)).slice().reverse();

    return (
        <>
            <div className="dashboard-header">
                <h1>Chat History</h1>
                <p className="text-muted">All your consultation sessions</p>
            </div>
            <div className="history-filters">
                {filters.map(f => (
                    <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                        {filterLabels[f]}
                    </button>
                ))}
            </div>
            {filtered.length === 0 ? (
                <EmptyState icon="fa-inbox" title="No sessions found" message="Start a new consultation." actionLabel="New Consultation" actionTo="/chat/triage" />
            ) : filtered.map(s => {
                const spec = SPECIALIZATIONS.find(sp => sp.id === s.specialization);
                const icon = spec ? spec.icon : 'fa-comment-medical';
                const color = spec ? spec.color : 'var(--accent)';
                const label = spec ? spec.name : (s.type === 'triage' ? 'Triage Agent' : 'Consultation');
                const lastMsg = s.messages.length > 0 ? s.messages[s.messages.length - 1].text : 'No messages';
                return (
                    <Link to={`/patient/chat-history/${s.id}`} key={s.id} className="history-card glass-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="history-card-icon" style={{ background: `${color}20`, color }}><i className={`fas ${icon}`}></i></div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>{label}</strong>
                                <Badge status={s.status} />
                            </div>
                            <p className="text-sm text-muted" style={{ marginTop: 4 }}>{lastMsg.substring(0, 80)}{lastMsg.length > 80 ? '...' : ''}</p>
                            <div className="text-xs text-muted" style={{ marginTop: 6 }}>
                                <i className="fas fa-comment" style={{ marginRight: 4 }}></i>{s.messages.length} messages ·
                                <i className="fas fa-clock" style={{ margin: '0 4px' }}></i>{formatRelative(s.updatedAt)}
                                {s.uploads.length > 0 && <> · <i className="fas fa-paperclip" style={{ margin: '0 4px' }}></i>{s.uploads.length} files</>}
                            </div>
                        </div>
                        <i className="fas fa-chevron-right text-muted"></i>
                    </Link>
                );
            })}
        </>
    );
}
