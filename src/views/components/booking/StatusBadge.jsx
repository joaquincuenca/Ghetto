export default function StatusBadge({ status }) {
    const statusConfig = {
        pending: { color: 'bg-yellow-600', text: 'Pending', icon: '⏳' },
        confirmed: { color: 'bg-blue-600', text: 'Confirmed', icon: '✅' },
        completed: { color: 'bg-green-600', text: 'Completed', icon: '🎉' },
        cancelled: { color: 'bg-red-600', text: 'Cancelled', icon: '❌' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.icon} {config.text}
        </span>
    );
}