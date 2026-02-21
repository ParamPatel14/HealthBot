import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Register() {
    const [step, setStep] = useState(1);
    const [data, setData] = useState({ role: 'patient', firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '', dob: '', gender: '', address: '' });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const showToast = useToast();
    const navigate = useNavigate();

    const update = (field, value) => setData(prev => ({ ...prev, [field]: value }));

    const handleNext = (e) => {
        e.preventDefault();
        setError('');
        if (step === 2 && data.password !== data.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setStep(step + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await register(data);
        if (result.success) {
            showToast('Account created successfully!', 'success');
            navigate(data.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: 520 }}>
                <div className="auth-header">
                    <div className="navbar-logo" style={{ width: 48, height: 48, fontSize: '1.2rem', margin: '0 auto 16px', borderRadius: 14 }}>H</div>
                    <h2>Create Account</h2>
                    <p>Join us and get started with AI-powered healthcare</p>
                </div>
                <div className="step-indicator">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`step-dot ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}></div>
                    ))}
                </div>

                {step === 1 && (
                    <form className="auth-form" onSubmit={handleNext}>
                        <div className="auth-toggle">
                            <button type="button" className={`auth-toggle-btn ${data.role === 'patient' ? 'active' : ''}`} onClick={() => update('role', 'patient')}>Patient</button>
                            <button type="button" className={`auth-toggle-btn ${data.role === 'doctor' ? 'active' : ''}`} onClick={() => update('role', 'doctor')}>Doctor</button>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">First Name</label>
                                <input type="text" className="form-input" value={data.firstName} onChange={e => update('firstName', e.target.value)} placeholder="John" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Last Name</label>
                                <input type="text" className="form-input" value={data.lastName} onChange={e => update('lastName', e.target.value)} placeholder="Doe" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input type="email" className="form-input" value={data.email} onChange={e => update('email', e.target.value)} placeholder="john@example.com" required />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg w-full">Continue <i className="fas fa-arrow-right"></i></button>
                    </form>
                )}

                {step === 2 && (
                    <form className="auth-form" onSubmit={handleNext}>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-input" value={data.password} onChange={e => update('password', e.target.value)} placeholder="Min 8 characters" minLength={8} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm Password</label>
                            <input type="password" className="form-input" value={data.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Confirm password" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input type="tel" className="form-input" value={data.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 234 567 890" />
                        </div>
                        {error && <div className="form-error">{error}</div>}
                        <div style={{ display: 'flex', gap: 16 }}>
                            <button type="button" className="btn btn-secondary w-full" onClick={() => setStep(1)}><i className="fas fa-arrow-left"></i> Back</button>
                            <button type="submit" className="btn btn-primary w-full">Continue <i className="fas fa-arrow-right"></i></button>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Date of Birth</label>
                                <input type="date" className="form-input" value={data.dob} onChange={e => update('dob', e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <select className="form-input" value={data.gender} onChange={e => update('gender', e.target.value)} required>
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
                            <input type="text" className="form-input" value={data.address} onChange={e => update('address', e.target.value)} placeholder="Your address" />
                        </div>
                        <label className="checkbox-group" style={{ marginTop: 8 }}>
                            <input type="checkbox" required />
                            <span className="text-sm text-muted">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
                        </label>
                        {error && <div className="form-error">{error}</div>}
                        <div style={{ display: 'flex', gap: 16 }}>
                            <button type="button" className="btn btn-secondary w-full" onClick={() => setStep(2)}><i className="fas fa-arrow-left"></i> Back</button>
                            <button type="submit" className="btn btn-primary w-full"><i className="fas fa-check"></i> Create Account</button>
                        </div>
                    </form>
                )}

                <div className="auth-footer">Already have an account? <Link to="/login">Sign In</Link></div>
            </div>
        </div>
    );
}
