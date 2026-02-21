import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReport, getSession, getUserByIdSync, submitDoctorReview } from '../../services/api';
import { SPECIALIZATIONS, formatDate, formatTime, getInitials } from '../../services/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Badge from '../../components/ui/Badge';

export default function DoctorReview() {
    const { id } = useParams();
    const { user } = useAuth();
    const showToast = useToast();
    const [report, setReport] = useState(null);
    const [session, setSession] = useState(null);
    const [patient, setPatient] = useState(null);
    const [notes, setNotes] = useState('');
    const [corrections, setCorrections] = useState('');
    const [recommendations, setRecommendations] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            const r = await getReport(id);
            setReport(r);
            if (r?.sessionId) setSession(await getSession(r.sessionId));
            if (r?.userId) setPatient(await getUserByIdSync(r.userId));
        };
        load();
    }, [id]);

    if (!report) return <div className="empty-state"><h3>Loading report...</h3></div>;

    const spec = SPECIALIZATIONS.find(s => s.id === report.specialization);
    const isReviewed = report.status === 'final' || report.status === 'doctor_reviewed';
    const patientInitials = patient ? getInitials(`${patient.firstName} ${patient.lastName}`) : '?';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await submitDoctorReview(id, {
            notes, corrections, recommendations,
            doctorId: user?.doctorId || user?.id,
            doctorName: user ? `Dr. ${user.firstName} ${user.lastName}` : 'Doctor',
        });
        showToast('Review submitted! Patient has been notified.', 'success');
        const updated = await getReport(id);
        setReport(updated);
        setSubmitting(false);
    };

    return (
        <>
            <Link to="/doctor/queue" className="btn btn-ghost" style={{ marginBottom: 16 }}><i className="fas fa-arrow-left"></i> Back to Queue</Link>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                    <h1>Review Report</h1>
                    <p className="text-muted">{spec ? spec.name : 'General'} · {formatDate(report.createdAt)}</p>
                </div>
                <Badge status={report.status} />
            </div>
            <div className="review-layout">
                <div className="review-panel">
                    <div className="patient-summary-card glass-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="navbar-avatar" style={{ width: 48, height: 48, fontSize: '1rem' }}>{patientInitials}</div>
                            <div>
                                <h4>{patient ? `${patient.firstName} ${patient.lastName}` : 'Loading...'}</h4>
                                <p className="text-sm text-muted">{patient?.email}</p>
                            </div>
                        </div>
                        {patient && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, fontSize: '0.85rem' }}>
                                <div><span className="text-muted">Gender:</span> {patient.gender || 'N/A'}</div>
                                <div><span className="text-muted">DOB:</span> {patient.dob || 'N/A'}</div>
                                <div><span className="text-muted">Phone:</span> {patient.phone || 'N/A'}</div>
                                <div><span className="text-muted">Address:</span> {patient.address || 'N/A'}</div>
                            </div>
                        )}
                    </div>
                    {report.aiReport && (
                        <div className="glass-card" style={{ marginBottom: 16 }}>
                            <h4 style={{ marginBottom: 12, color: 'var(--accent)' }}><i className="fas fa-robot" style={{ marginRight: 8 }}></i>AI Report</h4>
                            <p className="text-sm" style={{ marginBottom: 12 }}>{report.aiReport.summary}</p>
                            <h5 style={{ margin: '12px 0 8px', color: 'var(--text-secondary)' }}>Findings</h5>
                            <ul style={{ paddingLeft: 16, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {(report.aiReport.findings || []).map((f, i) => <li key={i} style={{ marginBottom: 4 }}>{f}</li>)}
                            </ul>
                            <h5 style={{ margin: '12px 0 8px', color: 'var(--text-secondary)' }}>Suggestions</h5>
                            <ul style={{ paddingLeft: 16, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                {(report.aiReport.suggestions || []).map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                    {session && session.messages && session.messages.length > 0 && (
                        <div className="glass-card" style={{ marginBottom: 16 }}>
                            <h4 style={{ marginBottom: 12 }}><i className="fas fa-comments" style={{ marginRight: 8, color: 'var(--accent)' }}></i>Chat History ({session.messages.length} messages)</h4>
                            <div className="review-chat-log" style={{ maxHeight: 400, overflow: 'auto' }}>
                                {session.messages.map((m, i) => (
                                    <div key={m.id || i} style={{ marginBottom: 12, padding: '8px 12px', background: m.sender === 'user' ? 'var(--accent-glow)' : 'var(--bg-glass)', borderRadius: 8 }}>
                                        <div className="text-xs" style={{ fontWeight: 600, color: m.sender === 'user' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                                            {m.sender === 'user' ? (patient?.firstName || 'Patient') : (m.senderName || 'Agent')}
                                            <span className="text-muted" style={{ fontWeight: 400, marginLeft: 8 }}>{formatTime(m.timestamp)}</span>
                                        </div>
                                        <p className="text-sm" style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{m.text}</p>
                                        {m.attachments?.map((a, j) => (
                                            <div key={j} className="chat-attachment" style={{ marginTop: 4 }}>
                                                <i className={`fas ${a.type === 'image' ? 'fa-image' : a.type === 'audio' ? 'fa-microphone' : 'fa-file'}`}></i>
                                                <span>{a.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {session && session.uploads && session.uploads.length > 0 && (
                        <div className="glass-card">
                            <h4 style={{ marginBottom: 12 }}><i className="fas fa-paperclip" style={{ marginRight: 8, color: 'var(--accent)' }}></i>Uploaded Files ({session.uploads.length})</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {session.uploads.map((u, i) => (
                                    <div key={u.id || i} className="chat-attachment">
                                        <i className={`fas ${u.type === 'image' ? 'fa-image' : u.type === 'audio' ? 'fa-microphone' : 'fa-file'}`}></i>
                                        <span>{u.name}</span><span className="text-xs text-muted">{u.size}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="review-panel">
                    {isReviewed ? (
                        <div className="glass-card" style={{ border: '1px solid var(--success)' }}>
                            <h3 style={{ color: 'var(--success)', marginBottom: 16 }}><i className="fas fa-check-circle" style={{ marginRight: 8 }}></i>Review Submitted</h3>
                            {report.finalReport && (
                                <>
                                    <div style={{ marginBottom: 12 }}>
                                        <h5 className="text-muted" style={{ marginBottom: 4 }}>Doctor's Notes</h5>
                                        <p className="text-sm">{report.finalReport.doctorNotes || 'N/A'}</p>
                                    </div>
                                    {report.finalReport.doctorCorrections && (
                                        <div style={{ marginBottom: 12 }}>
                                            <h5 style={{ color: 'var(--error)', marginBottom: 4 }}>Corrections</h5>
                                            <p className="text-sm">{report.finalReport.doctorCorrections}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h5 style={{ color: 'var(--success)', marginBottom: 4 }}>Recommendations</h5>
                                        <p className="text-sm">{report.finalReport.doctorRecommendations || 'N/A'}</p>
                                    </div>
                                    <p className="text-xs text-muted" style={{ marginTop: 16 }}>Submitted {formatDate(report.finalReport.reviewedAt)}</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="glass-card">
                            <h3 style={{ marginBottom: 20 }}><i className="fas fa-pen" style={{ marginRight: 8, color: 'var(--accent)' }}></i>Your Review</h3>
                            <form className="review-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Notes & Observations</label>
                                    <textarea className="form-input" rows="4" placeholder="Add your clinical notes..." required value={notes} onChange={e => setNotes(e.target.value)}></textarea>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Corrections (if any)</label>
                                    <textarea className="form-input" rows="3" placeholder="Highlight mistakes or corrections..." value={corrections} onChange={e => setCorrections(e.target.value)}></textarea>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Final Recommendations</label>
                                    <textarea className="form-input" rows="4" placeholder="Provide recommendations..." required value={recommendations} onChange={e => setRecommendations(e.target.value)}></textarea>
                                </div>
                                <div className="review-actions">
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : <><i className="fas fa-check"></i> Submit Review</>}
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={() => showToast('Request sent (simulated)', 'info')}><i className="fas fa-question-circle"></i> Request More Info</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
