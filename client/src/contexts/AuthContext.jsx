import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getCurrentSession, updateUserProfile } from '../services/auth';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const showToast = useToast();

    // Restore session on mount
    useEffect(() => {
        const session = getCurrentSession();
        if (session.user) {
            setUser(session.user);
            setRole(session.role);
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email, password, selectedRole) => {
        const result = await loginUser(email, password, selectedRole);
        if (result.success) {
            setUser(result.user);
            setRole(selectedRole);
        }
        return result;
    }, []);

    const register = useCallback(async (userData) => {
        const result = await registerUser(userData);
        if (result.success) {
            setUser(result.user);
            setRole(userData.role || 'patient');
        }
        return result;
    }, []);

    const logout = useCallback(async () => {
        await logoutUser();
        setUser(null);
        setRole(null);
    }, []);

    const updateProfile = useCallback(async (updates) => {
        if (!user) return;
        const result = await updateUserProfile(user.id, updates);
        if (result.success) {
            setUser(result.user);
            showToast('Profile updated successfully!', 'success');
        }
        return result;
    }, [user, showToast]);

    const value = {
        user,
        role,
        loading,
        isLoggedIn: !!user,
        login,
        register,
        logout,
        updateProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
