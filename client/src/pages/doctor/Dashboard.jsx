import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPendingReviews, getAllReports, getUserByIdSync } from '../../services/api';
import { SPECIALIZATIONS, formatRelative } from '../../services/constants';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';

export default function DoctorDashboard() {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [patients, setPatients] = useState({});

    useEffect(() => {
        const load = async () => {
            const all = await getAllReports();
            setReports(all);
            // Load patient names
            const ids = [...new Set(all.map(r => r.userId))];
            const map = {};
            for (const id of ids) {
                const p = await getUserByIdSync(id);
                if (p) map[id] = p;
            }
            setPatients(map);
        };
        load();
    }, []);

    const pendingReviews = reports.filter(r => r.status === 'ai_generated' || r.status === 'under_review');
    const completedToday = reports.filter(r => r.status === 'final' && new Date(r.updatedAt).toDateString() === new Date().toDateString());
    const totalPatients = [...new Set(reports.map(r => r.userId))].length;

    return (
        <>
            <div className="dashboard-header">
                <h1>Doctor Dashboard</h1>
                <p className="text-muted">Welcome back, <span className="gradient-text">{user?.firstName} {user?.lastName}</span></p>
            </div>
            <div className="stats-grid">
                <StatCard icon="fa-clock" iconClass="amber" value={pendingReviews.length} label="Pending Reviews" />
                <StatCard icon="fa-check-double" iconClass="teal" value={completedToday.length} label="Completed Today" />
                <StatCard icon="fa-users" iconClass="purple" value={totalPatients} label="Total Patients" />
                <StatCard icon="fa-file-medical" iconClass="blue" value={reports.length} label="Total Reports" />
            </div>
            <div className="section-header">
                <h3>Pending Reviews</h3>
                <Link to="/doctor/queue" className="btn btn-secondary btn-sm">View All <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="consultation-list">
                {pendingReviews.length === 0 ? (
                    <EmptyState icon="fa-check-circle" title="All caught up!" message="No reports pending review." />
                ) : pendingReviews.slice(0, 5).map(r => {
                    const patient = patients[r.userId];
                    const spec = SPECIALIZATIONS.find(s => s.id === r.specialization);
                    return (
                        <Link to={`/doctor/review/${r.id}`} key={r.id} className="consultation-card glass-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="consultation-icon" style={spec ? { background: `${spec.color}20`, color: spec.color } : {}}>
                                <i className={`fas ${spec ? spec.icon : 'fa-file-medical'}`}></i>
                            </div>
                            <div className="consultation-info">
                                <div className="consultation-title">{patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}</div>
                                <div className="consultation-meta">{spec ? spec.name : 'General'} · Submitted {formatRelative(r.createdAt)}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Badge status={r.status} />
                                <i className="fas fa-chevron-right text-muted"></i>
                            </div>
                        </Link>
                    );
                })}
            </div>
            <div className="section-header" style={{ marginTop: 32 }}><h3>Recent Activity</h3></div>
            <div className="consultation-list">
                {reports.filter(r => r.status === 'final').slice(0, 3).map(r => {
                    const patient = patients[r.userId];
                    return (
                        <div key={r.id} className="consultation-card glass-card">
                            <div className="consultation-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>
                                <i className="fas fa-check-circle"></i>
                            </div>
                            <div className="consultation-info">
                                <div className="consultation-title">{patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'} — Report Completed</div>
                                <div className="consultation-meta">{formatRelative(r.updatedAt)}</div>
                            </div>
                            <Badge status="final" />
                        </div>
                    );
                })}
                {reports.filter(r => r.status === 'final').length === 0 && <p className="text-muted text-sm" style={{ padding: 16 }}>No completed reviews yet.</p>}
            </div>
        </>
    );
}
