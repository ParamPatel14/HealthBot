import { STATUS_MAP } from '../../services/constants';

export default function Badge({ status }) {
    const info = STATUS_MAP[status] || { className: 'badge-info', label: status };
    return <span className={`badge ${info.className}`}>{info.label}</span>;
}
