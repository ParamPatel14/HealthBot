import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar() {
    const { role } = useAuth();

    if (role === 'doctor') {
        return (
            <aside className="sidebar">
                <div className="sidebar-section">
                    <div className="sidebar-section-title">Overview</div>
                    <NavLink to="/doctor/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <i className="fas fa-th-large"></i>Dashboard
                    </NavLink>
                </div>
                <div className="sidebar-section">
                    <div className="sidebar-section-title">Reviews</div>
                    <NavLink to="/doctor/queue" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <i className="fas fa-clipboard-list"></i>Patient Queue
                    </NavLink>
                </div>
            </aside>
        );
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-section">
                <div className="sidebar-section-title">Overview</div>
                <NavLink to="/patient/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <i className="fas fa-th-large"></i>Dashboard
                </NavLink>
                <NavLink to="/patient/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <i className="fas fa-user"></i>My Profile
                </NavLink>
            </div>
            <div className="sidebar-section">
                <div className="sidebar-section-title">Consultations</div>
                <NavLink to="/chat/triage" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <i className="fas fa-comment-medical"></i>New Consultation
                </NavLink>
                <NavLink to="/patient/chat-history" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <i className="fas fa-history"></i>Chat History
                </NavLink>
            </div>
            <div className="sidebar-section">
                <div className="sidebar-section-title">Reports</div>
                <NavLink to="/patient/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <i className="fas fa-file-medical-alt"></i>My Reports
                </NavLink>
            </div>
        </aside>
    );
}
