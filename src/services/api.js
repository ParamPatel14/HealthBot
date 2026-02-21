// ===== DATA API SERVICE =====
// Now uses FastAPI backend API for all data operations.
// Sessions, reports, notifications — everything goes through the backend.

const API_BASE = '/api';

// ===== SESSIONS =====

export async function createSession(userId, type, specialization = null) {
    const res = await fetch(`${API_BASE}/sessions?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, specialization }),
    });
    return await res.json();
}

export async function getSession(sessionId) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
    if (!res.ok) return null;
    return await res.json();
}

export async function getUserSessions(userId) {
    const res = await fetch(`${API_BASE}/sessions?user_id=${userId}`);
    return await res.json();
}

export async function addMessage(sessionId, message) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
    });
    return await res.json();
}

export async function addUpload(sessionId, upload) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/uploads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(upload),
    });
    return await res.json();
}

export async function updateSessionStatus(sessionId, status, assignedDoctor = null) {
    await fetch(`${API_BASE}/sessions/${sessionId}/status?status=${status}${assignedDoctor ? `&assigned_doctor=${assignedDoctor}` : ''}`, {
        method: 'PUT',
    });
}

// ===== CHAT (LangChain Agent Endpoint) =====

export async function sendChatMessage(sessionId, message) {
    const res = await fetch(`${API_BASE}/chat/${sessionId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
    });
    return await res.json();
}

export async function getChatMessages(sessionId) {
    const res = await fetch(`${API_BASE}/chat/${sessionId}/messages`);
    return await res.json();
}

// ===== REPORTS =====

export async function createReport(sessionId, content) {
    // Reports are now created by the agent automatically
    return null;
}

export async function getReport(reportId) {
    const res = await fetch(`${API_BASE}/reports/${reportId}`);
    if (!res.ok) return null;
    return await res.json();
}

export async function getUserReports(userId) {
    const res = await fetch(`${API_BASE}/reports?user_id=${userId}`);
    return await res.json();
}

export async function getAllReports() {
    const res = await fetch(`${API_BASE}/reports`);
    return await res.json();
}

export async function getPendingReviews() {
    const res = await fetch(`${API_BASE}/reports/pending`);
    return await res.json();
}

export async function submitDoctorReview(reportId, review) {
    const res = await fetch(`${API_BASE}/reports/${reportId}/review?doctor_id=${review.doctorId}&doctor_name=${encodeURIComponent(review.doctorName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            notes: review.notes,
            corrections: review.corrections,
            recommendations: review.recommendations,
        }),
    });
    return await res.json();
}

// ===== NOTIFICATIONS =====

export async function getUserNotifications(userId) {
    const res = await fetch(`${API_BASE}/notifications?user_id=${userId}`);
    return await res.json();
}

export async function getUnreadCount(userId) {
    const res = await fetch(`${API_BASE}/notifications/unread-count?user_id=${userId}`);
    const data = await res.json();
    return data.count;
}

export async function markNotificationRead(notifId) {
    await fetch(`${API_BASE}/notifications/${notifId}/read`, { method: 'PUT' });
}

// ===== DOCTORS =====

export async function getDoctors() {
    const res = await fetch(`${API_BASE}/doctors`);
    return await res.json();
}

export async function getDoctorsBySpecialization(specId) {
    const res = await fetch(`${API_BASE}/doctors/specialization/${specId}`);
    return await res.json();
}

export async function getDoctorById(docId) {
    const res = await fetch(`${API_BASE}/doctors/${docId}`);
    if (!res.ok) return null;
    return await res.json();
}

// ===== SPECIALIZATIONS =====

export async function getSpecializations() {
    const res = await fetch(`${API_BASE}/specializations`);
    return await res.json();
}

// ===== USER (for doctor portal) =====

export async function getUserByIdSync(userId) {
    try {
        const res = await fetch(`${API_BASE}/auth/user/${userId}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}
