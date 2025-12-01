export default function ErrorModal({ message, onClose }) {
    if (!message) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
        <div className="bg-gray-900 text-gray-100 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center border border-red-600">
            <div className="text-6xl sm:text-7xl mb-4">🚫</div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-red-500">Out of Range!</h2>
            <p className="text-sm sm:text-base text-gray-300 mb-4">{message}</p>
            <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs sm:text-sm text-gray-400 mb-2">📍 Service Area:</p>
            <p className="text-sm font-semibold text-blue-400">Camarines Norte, Bicol Region</p>
            <p className="text-xs text-gray-400 mt-2">Covered municipalities: Daet, Basud, Mercedes, Vinzons, Talisay, San Lorenzo Ruiz, Paracale, Jose Panganiban, and more.</p>
            </div>
            <button
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold"
            >
            Got it
            </button>
        </div>
        </div>
    );
}