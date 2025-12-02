// src/components/ReceiptModal.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FARE_CONFIG } from "../../utils/constants";
import { BookingService } from "../../services/BookingService";

export default function ReceiptModal({ show, booking, pickupText, dropoffText, onClose }) {
    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saved, setSaved] = useState(false);
    const FACEBOOK_PAGE_URL = "https://www.facebook.com/profile.php?id=61582462506784";

    // Extract values from booking prop with safe defaults
    const bookingNumber = booking?.bookingNumber || "N/A";
    const distance = booking?.distance || 0;
    const duration = booking?.duration || 0;
    const fare = booking?.fare || 0;
    
    // Safely format timestamp
    const formatTimestamp = (timestamp) => {
        if (!timestamp) return new Date().toLocaleString();
        
        try {
            let date;
            if (typeof timestamp === 'string') {
                date = new Date(timestamp);
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else if (typeof timestamp === 'number') {
                date = new Date(timestamp);
            } else {
                date = new Date();
            }
            
            if (isNaN(date.getTime())) {
                return new Date().toLocaleString();
            }
            
            return date.toLocaleString();
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return new Date().toLocaleString();
        }
    };

    const formattedTimestamp = formatTimestamp(booking?.timestamp);

    // Get fare configuration
    const { BASE_KM, BASE_FARE, EXTRA_RATE } = FARE_CONFIG;

    // Calculate fare breakdown
    const extraDistance = Math.max(0, distance - BASE_KM);
    const extraFare = extraDistance * EXTRA_RATE;

    const handleBookOnFB = async () => {
        setShowConfirm(false);
        setSaving(true);
        setSaveError(null);

        try {
            // Create a proper booking object with location names
            const bookingWithNames = {
                ...booking,
                pickup: {
                    ...booking.pickup,
                    displayName: pickupText || 'Unknown Location'
                },
                dropoff: {
                    ...booking.dropoff,
                    displayName: dropoffText || 'Unknown Location'
                }
            };

            await BookingService.saveBooking(bookingWithNames);
            console.log('✅ Booking saved successfully!');
            setSaved(true);
            
            // Redirect to tracking page
            setTimeout(() => {
                navigate(`/track/${booking.bookingNumber}`);
            }, 1000);
        } catch (error) {
            console.error('Failed to save booking:', error);
            setSaveError("Failed to save booking. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // Function to handle Facebook link click
    const handleFacebookClick = () => {
        window.open(FACEBOOK_PAGE_URL, '_blank', 'noopener,noreferrer');
    };

    // Check if the modal should be shown
    if (!show) {
        return null;
    }

    return (
        <>
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

                        {saveError && (
                            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg">
                                <p className="text-red-300 text-sm">❌ {saveError}</p>
                            </div>
                        )}

                        {saved && (
                            <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg">
                                <p className="text-green-300 text-sm">✅ Booking saved to database!</p>
                            </div>
                        )}

                        <div className="text-center text-xs text-gray-400 border-t border-gray-700 pt-3">
                            <p> {formattedTimestamp}</p>
                            <p className="mt-2">
                                Screenshot this receipt for your booking or{" "}
                                <button
                                    onClick={handleFacebookClick}
                                    className="text-blue-400 hover:text-blue-300 underline transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                                    title="Go to our Facebook page"
                                >
                                    direct to send to our facebook page
                                </button>
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-800 rounded-b-2xl flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold transition-colors"
                            disabled={saving}
                        >
                            Close
                        </button>

                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={saving}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Saving...
                                </>
                            ) : (
                                "Continue"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10000] p-4">
                    <div className="bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-gray-700">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-3">⚠️</div>
                            <h3 className="text-xl font-bold text-white mb-2">Confirm Your Booking</h3>
                            <p className="text-sm text-gray-300">
                                Are your pickup and drop-off locations correct?
                            </p>
                        </div>

                        <div className="bg-gray-900 rounded-lg p-3 mb-6 space-y-2">
                            <div>
                                <p className="text-xs text-gray-400">From:</p>
                                <p className="text-sm text-white font-medium">{pickupText}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">To:</p>
                                <p className="text-sm text-white font-medium">{dropoffText}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBookOnFB}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}