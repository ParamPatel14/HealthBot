import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedLayout from './components/layout/ProtectedLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/patient/Dashboard';
import PatientProfile from './pages/patient/Profile';
import ChatHistory from './pages/patient/ChatHistory';
import ReportsList from './pages/patient/ReportsList';
import ReportView from './pages/patient/ReportView';
import ChatView from './pages/patient/ChatView';
import TriageChat from './pages/chat/TriageChat';
import AgentRouting from './pages/chat/AgentRouting';
import SpecialistChat from './pages/chat/SpecialistChat';
import DoctorDashboard from './pages/doctor/Dashboard';
import PatientQueue from './pages/doctor/PatientQueue';
import DoctorReview from './pages/doctor/DoctorReview';

function PublicRoute({ children }) {
  const { isLoggedIn, role } = useAuth();
  if (isLoggedIn) return <Navigate to={role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected routes */}
        <Route element={<ProtectedLayout />}>
          {/* Patient Portal */}
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
          <Route path="/patient/chat-history" element={<ChatHistory />} />
          <Route path="/patient/chat-history/:id" element={<ChatView />} />
          <Route path="/patient/reports" element={<ReportsList />} />
          <Route path="/patient/reports/:id" element={<ReportView />} />

          {/* AI Chat */}
          <Route path="/chat/triage" element={<TriageChat />} />
          <Route path="/chat/routing/:specId" element={<AgentRouting />} />
          <Route path="/chat/specialist/:specId" element={<SpecialistChat />} />

          {/* Doctor Portal */}
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/queue" element={<PatientQueue />} />
          <Route path="/doctor/review/:id" element={<DoctorReview />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div>
              <h1 style={{ fontSize: '6rem', marginBottom: 16 }} className="gradient-text">404</h1>
              <p className="text-muted" style={{ marginBottom: 24 }}>Page not found</p>
              <a href="/" className="btn btn-primary">Go Home</a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
