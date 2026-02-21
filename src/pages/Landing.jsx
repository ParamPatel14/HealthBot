import { Link } from 'react-router-dom';

const features = [
    { icon: 'fa-robot', title: 'AI-Powered Triage', desc: 'Our intelligent agent listens to your symptoms and connects you with the right specialist instantly.' },
    { icon: 'fa-user-md', title: 'Doctor-Backed Reviews', desc: 'Every AI report is reviewed and validated by certified medical professionals before reaching you.' },
    { icon: 'fa-shield-alt', title: 'Secure & Private', desc: 'Your health data is encrypted and stored securely. We prioritize your privacy above all.' },
    { icon: 'fa-file-medical', title: 'Multi-Modal Input', desc: 'Share prescriptions, images, documents, or even voice recordings with our specialized agents.' },
    { icon: 'fa-clock', title: 'Fast Turnaround', desc: 'Get AI-generated insights within minutes and doctor-reviewed reports within hours.' },
    { icon: 'fa-history', title: 'Complete History', desc: 'All your consultations, reports, and chat sessions are stored and accessible anytime.' },
];

const steps = [
    { title: 'Describe Your Problem', desc: 'Start a consultation with our triage agent. Describe your symptoms in your own words.' },
    { title: 'Connect with Specialist', desc: 'Based on your symptoms, our AI routes you to a specialized agent for deeper analysis.' },
    { title: 'Share Your Data', desc: 'Upload prescriptions, reports, and images. The specialist agent collects everything needed.' },
    { title: 'Get Your Report', desc: 'Receive an AI-generated report reviewed and approved by a certified doctor.' },
];

export default function Landing() {
    return (
        <>
            <div className="landing-hero">
                <div className="hero-content">
                    <div className="hero-badge"><i className="fas fa-sparkles"></i> AI-Powered Healthcare</div>
                    <h1 className="hero-title">Your Health, <span className="gradient-text">Amplified by AI</span></h1>
                    <p className="hero-subtitle">Experience healthcare reimagined. Our AI agents, backed by real doctors, provide accurate diagnoses and personalized treatment plans.</p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn btn-primary btn-lg"><i className="fas fa-rocket"></i> Get Started</Link>
                        <Link to="/login" className="btn btn-secondary btn-lg"><i className="fas fa-sign-in-alt"></i> Sign In</Link>
                    </div>
                </div>
            </div>
            <section className="features-section">
                <div className="container">
                    <h2 className="text-center">Why Choose <span className="gradient-text">Our Platform</span>?</h2>
                    <p className="text-center text-muted" style={{ marginTop: 8 }}>Comprehensive healthcare solutions powered by artificial intelligence</p>
                    <div className="features-grid">
                        {features.map((f, i) => (
                            <div key={i} className="feature-card glass-card">
                                <div className="feature-icon"><i className={`fas ${f.icon}`}></i></div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="how-it-works">
                <div className="container">
                    <h2 className="text-center">How It <span className="gradient-text">Works</span></h2>
                    <div className="steps-grid">
                        {steps.map((s, i) => (
                            <div key={i} className="step-card glass-card">
                                <div className="step-number">{i + 1}</div>
                                <h4>{s.title}</h4>
                                <p>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <footer className="landing-footer">
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} Healthcare AI Platform. All rights reserved.</p>
                </div>
            </footer>
        </>
    );
}
