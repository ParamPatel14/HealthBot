export default function StatCard({ icon, iconClass, value, label }) {
    return (
        <div className="stat-card glass-card">
            <div className={`stat-icon ${iconClass}`}><i className={`fas ${icon}`}></i></div>
            <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
            </div>
        </div>
    );
}
