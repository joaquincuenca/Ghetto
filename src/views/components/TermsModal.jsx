export default function TermsModal({ show, accepted, onAcceptChange, onContinue }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-gray-100 border border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">Terms of Use</h2>
            <div className="space-y-3 text-sm sm:text-base max-h-64 overflow-y-auto">
            <p>By booking a ride, you agree to our terms and conditions:</p>
            <ul className="list-disc list-inside space-y-1">
                <li>All bookings are subject to availability.</li>
                <li>Fare estimates are calculated based on distance and rates.</li>
                <li>Ensure your pickup and drop-off locations are accurate.</li>
                <li>The service is provided as-is; the company is not liable for delays or incidents.</li>
                <li>Users must follow local traffic rules during rides.</li>
            </ul>
            <div className="mt-4 flex items-center gap-2">
                <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => onAcceptChange(e.target.checked)}
                id="termsCheckbox"
                className="w-4 h-4 accent-blue-500"
                />
                <label htmlFor="termsCheckbox" className="text-sm sm:text-base">
                I have read and agree to the Terms of Use
                </label>
            </div>
            </div>
            <button
            onClick={onContinue}
            disabled={!accepted}
            className={`w-full py-3 mt-6 rounded-xl font-semibold ${accepted ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 cursor-not-allowed"}`}
            >
            Continue
            </button>
        </div>
        </div>
    );
}