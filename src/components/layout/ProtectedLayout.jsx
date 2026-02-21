import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function ProtectedLayout() {
    const { isLoggedIn, loading } = useAuth();

    if (loading) return null;
    if (!isLoggedIn) return <Navigate to="/login" replace />;

    return (
        <>
            <Navbar />
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </>
    );
}
