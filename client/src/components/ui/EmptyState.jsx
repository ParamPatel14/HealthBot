import { Link } from 'react-router-dom';

export default function EmptyState({ icon, title, message, actionLabel, actionTo }) {
    return (
        <div className="empty-state">
            <i className={`fas ${icon}`}></i>
            <h3>{title}</h3>
            <p>{message}</p>
            {actionLabel && actionTo && (
                <Link to={actionTo} className="btn btn-primary">{actionLabel}</Link>
            )}
        </div>
    );
}
