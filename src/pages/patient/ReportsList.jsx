import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserReports } from '../../services/api';
import { SPECIALIZATIONS, formatDate, formatRelative } from '../../services/constants';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function ReportsList() {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (user) getUserReports(user.id).then(setReports);
    }, [user]);

    const filters = ['all', 'ai_generated', 'under_review', 'doctor_reviewed', 'final'];
    const filterLabels = { all: 'All', ai_generated: 'AI Generated', under_review: 'Under Review', doctor_reviewed: 'Doctor Reviewed', final: 'Final' };
    const filtered = (filter === 'all' ? reports : reports.filter(r => r.status === filter)).slice().reverse();

    return (
        <>
            <div className="dashboard-header">
                <h1>My Reports</h1>
                <p className="text-muted">View all your consultation reports</p>
            </div>
            <div className="history-filters">
                {filters.map(f => (
                    <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{filterLabels[f]}</button>
                ))}
            </div>
            {filtered.length === 0 ? (
                <EmptyState icon="fa-file-medical-alt" title="No reports found" message="Reports appear here after a specialist consultation." actionLabel="Start Consultation" actionTo="/chat/triage" />
            ) : filtered.map(r => {
                const spec = SPECIALIZATIONS.find(s => s.id === r.specialization);
                return (
                    <Link to={`/patient/reports/${r.id}`} key={r.id} className="report-card glass-card" style={{ textDecoration: 'none', color: 'inherit', marginBottom: 12 }}>
                        <div className="report-icon" style={spec ? { background: `${spec.color}20`, color: spec.color } : {}}>
                            <i className={`fas ${spec ? spec.icon : 'fa-file-medical-alt'}`}></i>
                        </div>
                        <div className="report-info">
                            <div className="report-title">{spec ? spec.name : 'General'} Report</div>
                            <div className="report-meta">Created {formatDate(r.createdAt)} · Updated {formatRelative(r.updatedAt)}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Badge status={r.status} />
                            <i className="fas fa-chevron-right text-muted"></i>
                        </div>
                    </Link>
                );
            })}
        </>
    );
}
