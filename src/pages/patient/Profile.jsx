import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getInitials, formatDate } from '../../services/constants';

export default function Profile() {
    const { user, updateProfile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ ...user });

    if (!user) return null;
    const initials = getInitials(`${user.firstName} ${user.lastName}`);
    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSave = async (e) => {
        e.preventDefault();
        await updateProfile(form);
        setEditing(false);
    };

    return (
        <>
            <div className="dashboard-header">
                <h1>My Profile</h1>
                <p className="text-muted">Manage your personal information</p>
            </div>
            <div className="profile-header-card glass-card">
                <div className="profile-avatar-wrapper">
                    <div className="profile-avatar">{initials}</div>
                    <div className="profile-avatar-edit"><i className="fas fa-camera"></i></div>
                </div>
                <div className="profile-info">
                    <h2>{user.firstName} {user.lastName}</h2>
                    <p>{user.email}</p>
                    <p className="text-sm text-muted">Member since {formatDate(user.createdAt)}</p>
                </div>
                <button className={`btn ${editing ? 'btn-danger' : 'btn-secondary'} btn-sm`} style={{ marginLeft: 'auto' }} onClick={() => { setEditing(!editing); if (editing) setForm({ ...user }); }}>
                    <i className={`fas ${editing ? 'fa-times' : 'fa-edit'}`}></i> {editing ? 'Cancel' : 'Edit Profile'}
                </button>
            </div>
            <form onSubmit={handleSave}>
                <div className="profile-section">
                    <h3><i className="fas fa-user" style={{ marginRight: 8, color: 'var(--accent)' }}></i>Personal Information</h3>
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input className="form-input" value={form.firstName || ''} onChange={e => update('firstName', e.target.value)} disabled={!editing} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input className="form-input" value={form.lastName || ''} onChange={e => update('lastName', e.target.value)} disabled={!editing} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" value={form.email || ''} onChange={e => update('email', e.target.value)} disabled={!editing} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input type="tel" className="form-input" value={form.phone || ''} onChange={e => update('phone', e.target.value)} disabled={!editing} />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Date of Birth</label>
                                <input type="date" className="form-input" value={form.dob || ''} onChange={e => update('dob', e.target.value)} disabled={!editing} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select className="form-input" value={form.gender || ''} onChange={e => update('gender', e.target.value)} disabled={!editing}>
                                    <option value="">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                    <option value="prefer_not">Prefer not to say</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <input className="form-input" value={form.address || ''} onChange={e => update('address', e.target.value)} disabled={!editing} />
                        </div>
                    </div>
                </div>
                <div className="profile-section">
                    <h3><i className="fas fa-phone-alt" style={{ marginRight: 8, color: 'var(--accent)' }}></i>Emergency Contact</h3>
                    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Contact Name</label>
                                <input className="form-input" value={form.emergencyName || ''} onChange={e => update('emergencyName', e.target.value)} disabled={!editing} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact Phone</label>
                                <input type="tel" className="form-input" value={form.emergencyPhone || ''} onChange={e => update('emergencyPhone', e.target.value)} disabled={!editing} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Relationship</label>
                            <input className="form-input" value={form.emergencyRelation || ''} onChange={e => update('emergencyRelation', e.target.value)} disabled={!editing} />
                        </div>
                    </div>
                </div>
                {editing && <button type="submit" className="btn btn-primary btn-lg"><i className="fas fa-save"></i> Save Changes</button>}
            </form>
        </>
    );
}
