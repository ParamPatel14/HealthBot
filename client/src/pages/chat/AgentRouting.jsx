import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SPECIALIZATIONS, SEED_DOCTORS } from '../../services/constants';

export default function AgentRouting() {
    const { specId } = useParams();
    const navigate = useNavigate();
    const spec = SPECIALIZATIONS.find(s => s.id === specId) || SPECIALIZATIONS[SPECIALIZATIONS.length - 1];
    const doctor = SEED_DOCTORS.find(d => d.specialization === spec.name) || SEED_DOCTORS[0];

    useEffect(() => {
        const timer = setTimeout(() => navigate(`/chat/specialist/${specId}`, { replace: true }), 3000);
        return () => clearTimeout(timer);
    }, [specId, navigate]);

    return (
        <div className="routing-page">
            <div>
                <div className="routing-circle"><i className={`fas ${spec.icon}`}></i></div>
                <h2>Connecting you to</h2>
                <h1 className="gradient-text" style={{ marginTop: 8 }}>{spec.name} Specialist</h1>
                <p className="routing-text">{spec.description}</p>
                <div style={{ marginTop: 32 }}>
                    <div className="specialist-card glass-card">
                        <div className="navbar-avatar" style={{ width: 48, height: 48, fontSize: '1rem' }}>{doctor.initials}</div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 600 }}>{doctor.name}</div>
                            <div className="text-sm text-muted">{doctor.specialization} · {doctor.experience}</div>
                        </div>
                    </div>
                </div>
                <p className="text-sm text-muted" style={{ marginTop: 24 }}><i className="fas fa-circle-notch fa-spin"></i> Preparing your consultation...</p>
            </div>
        </div>
    );
}
