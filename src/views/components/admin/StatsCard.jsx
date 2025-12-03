export default function StatsCard({ title, count, color, icon }) {
    return (
        <div className={`bg-${color}-900/30 p-4 rounded-lg border border-${color}-700`}>
        <p className={`text-${color}-400 text-sm`}>{title}</p>
        <p className={`text-3xl font-bold text-${color}-400`}>{count}</p>
        </div>
    );
}