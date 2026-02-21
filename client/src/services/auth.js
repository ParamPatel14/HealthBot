// ===== AUTH SERVICE =====
// Now uses FastAPI backend API

const API_BASE = '/api';

export async function loginUser(email, password, role) {
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
        });
        if (!res.ok) {
            const err = await res.json();
            return { success: false, error: err.detail || 'Login failed' };
        }
        const data = await res.json();
        // Store session locally for quick access
        localStorage.setItem('healthcare_session', JSON.stringify({ user: data.user, role: data.role || role }));
        return { success: true, user: data.user, role: data.role || role };
    } catch (e) {
        return { success: false, error: 'Network error. Is the backend running?' };
    }
}

export async function registerUser(userData) {
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!res.ok) {
            const err = await res.json();
            return { success: false, error: err.detail || 'Registration failed' };
        }
        const data = await res.json();
        const role = userData.role || 'patient';
        localStorage.setItem('healthcare_session', JSON.stringify({ user: data.user, role }));
        return { success: true, user: data.user };
    } catch (e) {
        return { success: false, error: 'Network error. Is the backend running?' };
    }
}

export async function logoutUser() {
    localStorage.removeItem('healthcare_session');
    return { success: true };
}

export function getCurrentSession() {
    try {
        return JSON.parse(localStorage.getItem('healthcare_session')) || { user: null, role: null };
    } catch {
        return { user: null, role: null };
    }
}

export async function updateUserProfile(userId, updates) {
    try {
        const res = await fetch(`${API_BASE}/auth/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!res.ok) return { success: false, error: 'Update failed' };
        const data = await res.json();
        // Update local session
        const session = getCurrentSession();
        session.user = data.user;
        localStorage.setItem('hal_session', JSON.stringify(session));
        return { success: true, user: data.user };
    } catch (e) {
        return { success: false, error: 'Network error' };
    }
}

export async function getUserById(userId) {
    try {
        const res = await fetch(`${API_BASE}/auth/user/${userId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}
