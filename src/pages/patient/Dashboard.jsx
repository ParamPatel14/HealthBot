import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserSessions, getUserReports } from '../../services/api';
import { SPECIALIZATIONS, formatRelative } from '../../services/constants';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';

export default function Dashboard() {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [reports, setReports] = useState([]);

    useEffect(() => {
        if (!user) return;
        getUserSessions(user.id).then(setSessions);
        getUserReports(user.id).then(setReports);
    }, [user]);

    const activeSessions = sessions.filter(s => s.status === 'active');
    const pendingReports = reports.filter(r => r.status !== 'final');
    const completedReports = reports.filter(r => r.status === 'final');

    const getSessionInfo = (session) => {
        const spec = SPECIALIZATIONS.find(s => s.id === session.specialization);
        return {
            icon: spec ? spec.icon : 'fa-comment-medical',
            label: spec ? spec.name : (session.type === 'triage' ? 'Triage' : 'Consultation'),
        };
    };

    return (
        <>
            <div className="dashboard-header">
                <h1>Welcome back, <span className="gradient-text">{user?.firstName || 'Patient'}</span></h1>
                <p className="text-muted">Here's an overview of your healthcare journey</p>
            </div>
            <div className="stats-grid">
                <StatCard icon="fa-comments" iconClass="teal" value={sessions.length} label="Total Consultations" />
                <StatCard icon="fa-spinner" iconClass="amber" value={pendingReports.length} label="Pending Reports" />
                <StatCard icon="fa-check-circle" iconClass="purple" value={completedReports.length} label="Completed Reports" />
                <StatCard icon="fa-heartbeat" iconClass="blue" value={activeSessions.length} label="Active Sessions" />
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 300 }}>
                    <div className="section-header">
                        <h3>Recent Consultations</h3>
                        <Link to="/chat/triage" className="btn btn-primary btn-sm"><i className="fas fa-plus"></i> New Consultation</Link>
                    </div>
                    <div className="consultation-list">
                        {sessions.length === 0 ? (
                            <EmptyState icon="fa-comment-medical" title="No consultations yet"
                                message="Start your first consultation to get AI-powered health insights."
                                actionLabel="Start Consultation" actionTo="/chat/triage" />
                        ) : (
                            sessions.slice(-5).reverse().map(s => {
                                const info = getSessionInfo(s);
                                return (
                                    <Link to={`/patient/chat-history/${s.id}`} key={s.id} className="consultation-card glass-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div className="consultation-icon"><i className={`fas ${info.icon}`}></i></div>
                                        <div className="consultation-info">
                                            <div className="consultation-title">{info.label}</div>
                                            <div className="consultation-meta">{s.messages.length} messages · {formatRelative(s.updatedAt)}</div>
                                        </div>
                                        <Badge status={s.status} />
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
                <div style={{ flex: 1, minWidth: 280 }}>
                    <div className="section-header"><h3>Recent Reports</h3></div>
                    <div className="consultation-list">
                        {reports.length === 0 ? (
                            <p className="text-muted text-sm" style={{ padding: 16 }}>No reports yet.</p>
                        ) : (
                            reports.slice(-5).reverse().map(r => (
                                <Link to={`/patient/reports/${r.id}`} key={r.id} className="consultation-card glass-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="consultation-icon"><i className="fas fa-file-medical-alt"></i></div>
                                    <div className="consultation-info">
                                        <div className="consultation-title">{r.specialization || 'Report'}</div>
                                        <div className="consultation-meta">{formatRelative(r.createdAt)}</div>
                                    </div>
                                    <Badge status={r.status} />
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
