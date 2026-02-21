import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllReports, getUserByIdSync } from '../../services/api';
import { SPECIALIZATIONS, formatDate, getInitials } from '../../services/constants';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';

export default function PatientQueue() {
    const [reports, setReports] = useState([]);
    const [patients, setPatients] = useState({});

    useEffect(() => {
        const load = async () => {
            const r = await getAllReports();
            setReports(r);
            const ids = [...new Set(r.map(rep => rep.userId))];
            const map = {};
            for (const id of ids) {
                const p = await getUserByIdSync(id);
                if (p) map[id] = p;
            }
            setPatients(map);
        };
        load();
    }, []);

    if (reports.length === 0) {
        return (
            <>
                <div className="dashboard-header"><h1>Patient Queue</h1></div>
                <EmptyState icon="fa-clipboard-list" title="No patients in queue" message="Reports appear here as consultations are completed." />
            </>
        );
    }

    return (
        <>
            <div className="dashboard-header">
                <h1>Patient Queue</h1>
                <p className="text-muted">All reports requiring your attention</p>
            </div>
            <div className="glass-card" style={{ overflowX: 'auto' }}>
                <table className="queue-table">
                    <thead>
                        <tr><th>Patient</th><th>Specialization</th><th>Status</th><th>Submitted</th><th>Time Elapsed</th><th></th></tr>
                    </thead>
                    <tbody>
                        {reports.map(r => {
                            const patient = patients[r.userId];
                            const spec = SPECIALIZATIONS.find(s => s.id === r.specialization);
                            const elapsed = Date.now() - new Date(r.createdAt).getTime();
                            const hrs = Math.floor(elapsed / 3600000);
                            const mins = Math.floor((elapsed % 3600000) / 60000);
                            const priority = r.status === 'ai_generated' ? (hrs > 12 ? 'high' : hrs > 4 ? 'medium' : 'low') : 'low';
                            return (
                                <tr key={r.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="navbar-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                                                {patient ? getInitials(`${patient.firstName} ${patient.lastName}`) : '?'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown'}</div>
                                                <div className="text-xs text-muted">{patient?.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {spec && <i className={`fas ${spec.icon}`} style={{ color: spec.color }}></i>}
                                            {spec ? spec.name : 'General'}
                                        </div>
                                    </td>
                                    <td><Badge status={r.status} /></td>
                                    <td className="text-muted">{formatDate(r.createdAt)}</td>
                                    <td className={`priority-${priority}`}>{hrs > 0 ? `${hrs}h ` : ''}{mins}m</td>
                                    <td><Link to={`/doctor/review/${r.id}`} className="btn btn-primary btn-sm">Review</Link></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
}
