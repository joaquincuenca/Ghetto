export default function ProgressSteps({ status }) {
    const steps = [
        { number: 1, label: 'Requested', active: ['pending', 'confirmed', 'completed'].includes(status) },
        { number: 2, label: 'Accepted', active: ['confirmed', 'completed'].includes(status) },
        { number: 3, label: 'Completed', active: status === 'completed' }
    ];

    return (
        <div className="p-6 relative">
        <div className="relative z-10">
            <div className="flex justify-between items-center mb-2">
            {steps.map((step) => (
                <div
                key={step.number}
                className={`flex flex-col items-center ${
                    step.active ? 'text-blue-400' : 'text-gray-400'
                }`}
                >
                <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                    step.active
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                >
                    {step.number}
                </div>
                <span className="text-xs font-semibold">{step.label}</span>
                </div>
            ))}
            </div>
        </div>

        <div className="absolute top-12 left-6 right-6 h-1 -z-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-700"></div>
            <div
            className={`absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-700 ease-out ${
                status === 'pending' ? 'w-0' :
                status === 'confirmed' ? 'w-1/2' :
                status === 'completed' ? 'w-full' :
                'w-0'
            }`}
            ></div>
        </div>
        </div>
    );
}