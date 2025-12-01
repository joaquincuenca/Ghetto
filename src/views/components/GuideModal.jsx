export default function GuideModal({ show, onClose }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-gray-100 border border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">How to Book a Ride</h2>
            <div className="space-y-3 text-sm sm:text-base">
            <p>✔ Search for places using the <span className="text-blue-400 font-semibold">enhanced search</span> with autocomplete.</p>
            <p>✔ <span className="text-yellow-400 font-semibold">Tap on the map</span> to manually pin locations.</p>
            <p>✔ View the <span className="text-green-400 font-semibold">route visualization</span> with distance and duration.</p>
            <p>✔ Press <span className="text-green-400 font-semibold">Book Now</span> to confirm your ride.</p>
            </div>
            <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 mt-6 rounded-xl font-semibold"
            >
            Got it!
            </button>
        </div>
        </div>
    );
}