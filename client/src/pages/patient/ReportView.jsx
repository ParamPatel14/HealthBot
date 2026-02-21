import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReport, getSession, getDoctorById } from '../../services/api';
import { SPECIALIZATIONS, formatDate } from '../../services/constants';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../contexts/ToastContext';

export default function ReportView() {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [session, setSession] = useState(null);
    const [doctor, setDoctor] = useState(null);
    const showToast = useToast();

    useEffect(() => {
        getReport(id).then(r => {
            setReport(r);
            if (r?.sessionId) getSession(r.sessionId).then(setSession);
            if (r?.assignedDoctor) getDoctorById(r.assignedDoctor).then(setDoctor);
        });
    }, [id]);

    if (!report) return <div className="empty-state"><h3>Report not found</h3><Link to="/patient/reports" className="btn btn-primary">Back to Reports</Link></div>;

    const spec = SPECIALIZATIONS.find(s => s.id === report.specialization);

    return (
        <div className="report-view">
            <Link to="/patient/reports" className="btn btn-ghost" style={{ marginBottom: 16 }}><i className="fas fa-arrow-left"></i> Back to Reports</Link>
            <div className="report-view-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {spec && <div className="report-icon" style={{ background: `${spec.color}20`, color: spec.color, width: 56, height: 56, fontSize: '1.4rem' }}><i className={`fas ${spec.icon}`}></i></div>}
                    <div>
                        <h1>{spec ? spec.name : 'General'} Report</h1>
                        <p className="text-muted">Generated {formatDate(report.createdAt)}</p>
                    </div>
                </div>
                <div className="report-status-bar">
                    <Badge status={report.status} />
                    {doctor && <span className="badge badge-info"><i className="fas fa-user-md" style={{ marginRight: 4 }}></i>{doctor.name}</span>}
                </div>
            </div>
            {report.aiReport && (
                <>
                    <div className="report-section glass-card">
                        <h3><i className="fas fa-robot" style={{ marginRight: 8 }}></i>AI Analysis Summary</h3>
                        <p>{report.aiReport.summary}</p>
                    </div>
                    <div className="report-section glass-card">
                        <h3><i className="fas fa-search" style={{ marginRight: 8 }}></i>Findings</h3>
                        <ul>{(report.aiReport.findings || []).map((f, i) => <li key={i}>{f}</li>)}</ul>
                    </div>
                    <div className="report-section glass-card">
                        <h3><i className="fas fa-lightbulb" style={{ marginRight: 8 }}></i>Suggested Solutions</h3>
                        <ul>{(report.aiReport.suggestions || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                </>
            )}
            {report.finalReport && (
                <div className="report-section glass-card" style={{ border: '1px solid var(--warning)' }}>
                    <h3><i className="fas fa-user-md" style={{ marginRight: 8, color: 'var(--warning)' }}></i>Doctor's Review</h3>
                    <div className="doctor-review-highlight">
                        <h4><i className="fas fa-notes-medical" style={{ marginRight: 6 }}></i>Doctor's Notes</h4>
                        <p>{report.finalReport.doctorNotes || 'No additional notes.'}</p>
                    </div>
                    {report.finalReport.doctorCorrections && (
                        <div className="doctor-review-highlight" style={{ borderLeftColor: 'var(--error)' }}>
                            <h4 style={{ color: 'var(--error)' }}><i className="fas fa-exclamation-triangle" style={{ marginRight: 6 }}></i>Corrections</h4>
                            <p>{report.finalReport.doctorCorrections}</p>
                        </div>
                    )}
                    <div className="doctor-review-highlight" style={{ borderLeftColor: 'var(--success)' }}>
                        <h4 style={{ color: 'var(--success)' }}><i className="fas fa-check-circle" style={{ marginRight: 6 }}></i>Recommendations</h4>
                        <p>{report.finalReport.doctorRecommendations}</p>
                    </div>
                    <p className="text-sm text-muted" style={{ marginTop: 12 }}>Reviewed by {report.finalReport.reviewedBy} on {formatDate(report.finalReport.reviewedAt)}</p>
                </div>
            )}
            {session && session.uploads.length > 0 && (
                <div className="report-section glass-card">
                    <h3><i className="fas fa-paperclip" style={{ marginRight: 8 }}></i>Attached Documents</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {session.uploads.map(u => (
                            <div key={u.id} className="chat-attachment">
                                <i className={`fas ${u.type === 'image' ? 'fa-image' : u.type === 'audio' ? 'fa-microphone' : 'fa-file'}`}></i>
                                <span>{u.name}</span><span className="text-xs text-muted">{u.size}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-primary" onClick={() => showToast('PDF download coming soon!', 'info')}><i className="fas fa-download"></i> Download PDF</button>
                <button className="btn btn-secondary" onClick={() => showToast('Email sent! (simulated)', 'success')}><i className="fas fa-envelope"></i> Email Report</button>
            </div>
        </div>
    );
}
