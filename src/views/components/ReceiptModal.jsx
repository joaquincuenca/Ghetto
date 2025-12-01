import { FARE_CONFIG } from "../../utils/constants";

export default function ReceiptModal({ show, booking, pickupText, dropoffText, onClose }) {
    // Prevent modal until ready
    if (!show || !booking) return null;

    // Convert booking data into safe numbers
    const safeDistance = Number(booking.distance);
    const safeFare = Number(booking.fare);

    // Block rendering until valid data exists
    if (!Number.isFinite(safeDistance) || !Number.isFinite(safeFare)) {
        console.warn("⏳ Waiting for booking data…", booking);
        return null;
    }

    const distance = safeDistance;
    const fare = safeFare;
    const duration = Number(booking.duration) || 0;

    const { BASE_FARE, BASE_KM, EXTRA_RATE } = FARE_CONFIG;

    const bookingNumber = booking.bookingNumber || "N/A";
    const timestamp = booking.timestamp
        ? new Date(booking.timestamp).toLocaleString()
        : new Date().toLocaleString();

    const extraDistance = distance > BASE_KM ? distance - BASE_KM : 0;
    const extraFare = extraDistance * EXTRA_RATE;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto text-gray-100">
                <div className="p-6 sm:p-8">
                    <div className="text-center border-b-2 border-dashed border-gray-700 pb-4 mb-4">
                        <h2 className="text-xl sm:text-2xl font-bold">Ride Receipt</h2>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">Camarines Norte Booking</p>
                    </div>

                    <div className="space-y-3 mb-4">
                        <div className="bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-400">Booking Number</p>
                            <p className="text-base sm:text-lg font-bold text-blue-400">{bookingNumber}</p>
                        </div>

                        <div className="bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">📍 Pickup Location</p>
                            <p className="text-xs sm:text-sm font-medium break-words">{pickupText || "Not specified"}</p>
                        </div>

                        <div className="bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">🚩 Drop-off Location</p>
                            <p className="text-xs sm:text-sm font-medium break-words">{dropoffText || "Not specified"}</p>
                        </div>

                        <div className="flex justify-between items-center py-2 border-t border-gray-700">
                            <span className="text-xs text-gray-400">Distance</span>
                            <span className="text-sm sm:text-base font-semibold">
                                {distance.toFixed(2)} km
                            </span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-t border-gray-700">
                            <span className="text-xs text-gray-400">Est. Duration</span>
                            <span className="text-sm sm:text-base font-semibold">
                                {Math.round(duration)} min
                            </span>
                        </div>

                        <div className="bg-gray-800 p-3 rounded-lg space-y-2">
                            <p className="text-xs text-gray-400 mb-1">💰 Fare Breakdown</p>

                            <div className="flex justify-between text-sm">
                                <span>Base Fare (First {BASE_KM} km)</span>
                                <span>₱{BASE_FARE.toFixed(2)}</span>
                            </div>

                            {extraDistance > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span>
                                        Extra Distance ({extraDistance.toFixed(2)} km × ₱{EXTRA_RATE})
                                    </span>
                                    <span>₱{extraFare.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="border-t border-gray-700 my-2"></div>

                            <div className="flex justify-between items-center py-2 text-white font-bold text-lg">
                                <span>Total Fare</span>
                                <span>₱{fare.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-xs text-gray-400 border-t border-gray-700 pt-3">
                        <p>📅 {timestamp}</p>
                        <p className="mt-2">📸 Screenshot this receipt for your booking</p>
                    </div>
                </div>

                <div className="p-4 bg-gray-800 rounded-b-2xl flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold transition-colors"
                    >
                        Close
                    </button>

                    <button
                        onClick={() =>
                            window.open("https://www.facebook.com/profile.php?id=61582462506784", "_blank")
                        }
                        className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition-colors"
                    >
                        Book on FB
                    </button>
                </div>
            </div>
        </div>
    );
}
