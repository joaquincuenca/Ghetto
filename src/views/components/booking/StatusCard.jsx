export default function StatusCard({ 
    status, 
    getStatusIcon, 
    getStatusMessage, 
    getEstimatedTime 
    }) {
    const statusColors = {
        pending: 'bg-yellow-900/30',
        confirmed: 'bg-blue-900/30',
        completed: 'bg-green-900/30',
        cancelled: 'bg-red-900/30'
    };

    return (
        <div className={`p-6 text-center ${statusColors[status] || statusColors.pending}`}>
        <div className="text-7xl mb-4">
            {getStatusIcon(status)}
        </div>
        <h2 className="text-2xl font-bold mb-2 capitalize">
            {status}
        </h2>
        <p className="text-gray-300 mb-3">
            {getStatusMessage(status)}
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-full">
            <span className="text-sm">Estimated: </span>
            <span className="font-semibold">{getEstimatedTime(status)}</span>
        </div>
        </div>
    );
}