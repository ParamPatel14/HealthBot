// ===== CONSTANTS =====
// Specializations, agent configs, and other constants.
// When integrating with CrewAI/LangChain, each specialization maps to an agent.

export const SPECIALIZATIONS = [
    { id: 'cardiology', name: 'Cardiology', icon: 'fa-heartbeat', color: '#ef4444', description: 'Heart and cardiovascular system', keywords: ['heart', 'chest', 'cardio', 'blood pressure', 'palpitation'] },
    { id: 'dermatology', name: 'Dermatology', icon: 'fa-hand-dots', color: '#f59e0b', description: 'Skin, hair, and nails', keywords: ['skin', 'rash', 'acne', 'itch', 'derma'] },
    { id: 'orthopedics', name: 'Orthopedics', icon: 'fa-bone', color: '#3b82f6', description: 'Bones, joints, and muscles', keywords: ['bone', 'joint', 'fracture', 'muscle', 'back pain', 'knee'] },
    { id: 'neurology', name: 'Neurology', icon: 'fa-brain', color: '#8b5cf6', description: 'Brain and nervous system', keywords: ['head', 'brain', 'migraine', 'dizzy', 'neuro', 'seizure'] },
    { id: 'general', name: 'General Medicine', icon: 'fa-stethoscope', color: '#10b981', description: 'General health concerns', keywords: [] },
    { id: 'pulmonology', name: 'Pulmonology', icon: 'fa-lungs', color: '#06b6d4', description: 'Lungs and respiratory system', keywords: ['breath', 'lung', 'cough', 'asthma', 'respiratory'] },
];

// Seeded doctors — will come from DB (MongoDB/PostgreSQL) later
export const SEED_DOCTORS = [
    { id: 'doc1', name: 'Dr. Sarah Chen', specialization: 'cardiology', initials: 'SC', experience: '12 years', status: 'available' },
    { id: 'doc2', name: 'Dr. James Patel', specialization: 'dermatology', initials: 'JP', experience: '8 years', status: 'available' },
    { id: 'doc3', name: 'Dr. Maria Gonzalez', specialization: 'orthopedics', initials: 'MG', experience: '15 years', status: 'available' },
    { id: 'doc4', name: 'Dr. Ahmed Khan', specialization: 'neurology', initials: 'AK', experience: '10 years', status: 'available' },
    { id: 'doc5', name: 'Dr. Emily Woods', specialization: 'general', initials: 'EW', experience: '6 years', status: 'available' },
    { id: 'doc6', name: 'Dr. David Lee', specialization: 'pulmonology', initials: 'DL', experience: '14 years', status: 'available' },
];

// Status mappings for badges
export const STATUS_MAP = {
    active: { className: 'badge-info', label: 'Active' },
    awaiting_review: { className: 'badge-warning', label: 'Awaiting Review' },
    completed: { className: 'badge-success', label: 'Completed' },
    ai_generated: { className: 'badge-info', label: 'AI Generated' },
    under_review: { className: 'badge-warning', label: 'Under Review' },
    doctor_reviewed: { className: 'badge-accent', label: 'Doctor Reviewed' },
    final: { className: 'badge-success', label: 'Final Report' },
};

// Detect specialization from text (will be replaced by CrewAI/LangChain agent routing)
export function detectSpecialization(text) {
    const lower = text.toLowerCase();
    for (const spec of SPECIALIZATIONS) {
        if (spec.keywords.some(kw => lower.includes(kw))) return spec.id;
    }
    return 'general';
}

// Utility helpers
export function generateId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
}

export function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substr(0, 2);
}

export function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatTime(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatRelative(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
}
