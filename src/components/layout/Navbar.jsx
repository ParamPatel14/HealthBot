import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials } from '../../services/constants';

export default function Navbar() {
    const { user, role, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    const initials = user ? getInitials(`${user.firstName} ${user.lastName}`) : '?';

    const patientLinks = [
        { label: 'Dashboard', to: '/patient/dashboard' },
        { label: 'Consultations', to: '/chat/triage' },
        { label: 'Reports', to: '/patient/reports' },
    ];
    const doctorLinks = [
        { label: 'Dashboard', to: '/doctor/dashboard' },
        { label: 'Patient Queue', to: '/doctor/queue' },
    ];
    const links = role === 'doctor' ? doctorLinks : patientLinks;

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <Link to={role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} className="navbar-brand">
                <div className="navbar-logo">H</div>
                <span className="navbar-title">AI Health</span>
            </Link>
            <div className="navbar-nav">
                {links.map(l => (
                    <NavLink key={l.to} to={l.to} className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
                        {l.label}
                    </NavLink>
                ))}
            </div>
            <div className="navbar-actions">
                <button className="btn-icon relative">
                    <i className="fas fa-bell"></i>
                </button>
                <div className="relative" ref={menuRef}>
                    <div className="navbar-avatar" onClick={() => setMenuOpen(!menuOpen)}>{initials}</div>
                    <div className={`user-menu ${menuOpen ? 'show' : ''}`}>
                        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-glass)', marginBottom: 4 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.firstName} {user?.lastName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user?.email}</div>
                        </div>
                        {role !== 'doctor' && (
                            <>
                                <Link to="/patient/profile" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                                    <i className="fas fa-user"></i>Profile
                                </Link>
                                <Link to="/patient/chat-history" className="user-menu-item" onClick={() => setMenuOpen(false)}>
                                    <i className="fas fa-history"></i>Chat History
                                </Link>
                            </>
                        )}
                        <button className="user-menu-item" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt"></i>Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
