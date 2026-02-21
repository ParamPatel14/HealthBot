import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Login() {
    const [role, setRole] = useState('patient');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const showToast = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password, role);
        if (result.success) {
            showToast('Login successful!', 'success');
            navigate(role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
        } else {
            setError(result.error);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="navbar-logo" style={{ width: 48, height: 48, fontSize: '1.2rem', margin: '0 auto 16px', borderRadius: 14 }}>H</div>
                    <h2>Welcome Back</h2>
                    <p>Sign in to your account</p>
                </div>
                <div className="auth-toggle">
                    <button className={`auth-toggle-btn ${role === 'patient' ? 'active' : ''}`} onClick={() => setRole('patient')}>Patient</button>
                    <button className={`auth-toggle-btn ${role === 'doctor' ? 'active' : ''}`} onClick={() => setRole('doctor')}>Doctor</button>
                </div>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input type="email" className="form-input" placeholder="Enter your email" required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="relative">
                            <input type={showPass ? 'text' : 'password'} className="form-input" placeholder="Enter your password" required value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', paddingRight: 44 }} />
                            <button type="button" className="password-toggle" onClick={() => setShowPass(!showPass)}>
                                <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="checkbox-group text-sm"><input type="checkbox" /> Remember me</label>
                        <a href="#" className="text-sm">Forgot password?</a>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg w-full">Sign In</button>
                    {error && <div className="form-error text-center">{error}</div>}
                </form>
                <div className="auth-footer">Don't have an account? <Link to="/register">Create one</Link></div>
            </div>
        </div>
    );
}
