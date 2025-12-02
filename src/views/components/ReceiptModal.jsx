// src/components/ReceiptModal.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FARE_CONFIG } from "../../utils/constants";
import { BookingService } from "../../services/BookingService";

export default function ReceiptModal({ show, booking, pickupText, dropoffText, onClose }) {
    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);
    const [showUserForm, setShowUserForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [userDetails, setUserDetails] = useState({
        fullName: "",
        contactNumber: ""
    });
    const [formErrors, setFormErrors] = useState({
        fullName: "",
        contactNumber: ""
    });
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
            return new Date().toLocaleString();
        }
    };

    const formattedTimestamp = formatTimestamp(booking?.timestamp);

    // Get fare configuration
    const { BASE_KM, BASE_FARE, EXTRA_RATE } = FARE_CONFIG;

    // Calculate fare breakdown
    const extraDistance = Math.max(0, distance - BASE_KM);
    const extraFare = extraDistance * EXTRA_RATE;

    // Handle user details input change
    const handleUserDetailsChange = (e) => {
        const { name, value } = e.target;
        setUserDetails(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    // Validate user details
    const validateUserDetails = () => {
        const errors = {};
        
        if (!userDetails.fullName.trim()) {
            errors.fullName = "Full name is required";
        } else if (userDetails.fullName.trim().length < 2) {
            errors.fullName = "Name must be at least 2 characters";
        }
        
        if (!userDetails.contactNumber.trim()) {
            errors.contactNumber = "Contact number is required";
        } else {
            const phoneRegex = /^(09|\+639)\d{9}$/;
            const cleanedNumber = userDetails.contactNumber.trim().replace(/\s+/g, '');
            
            if (!phoneRegex.test(cleanedNumber)) {
                errors.contactNumber = "Please enter a valid Philippine phone number (09XXXXXXXXX or +639XXXXXXXXX)";
            }
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleBookOnFB = async () => {
        if (!showUserForm) {
            setShowUserForm(true);
            return;
        }
        
        if (!validateUserDetails()) return;
        
        setShowConfirm(false);
        setSaving(true);
        setSaveError(null);

        try {
            const bookingWithNames = {
                ...booking,
                pickup: {
                    ...booking.pickup,
                    displayName: pickupText || 'Unknown Location'
                },
                dropoff: {
                    ...booking.dropoff,
                    displayName: dropoffText || 'Unknown Location'
                },
                userDetails: {
                    fullName: userDetails.fullName,
                    contactNumber: userDetails.contactNumber
                }
            };

            await BookingService.saveBooking(bookingWithNames);
            setSaved(true);
            
            setTimeout(() => {
                navigate(`/track/${booking.bookingNumber}`);
            }, 1500);
        } catch (error) {
            setSaveError("Failed to save booking. Please try again.");
            setSaving(false);
        }
    };

    const handleFacebookClick = () => {
        window.open(FACEBOOK_PAGE_URL, '_blank', 'noopener,noreferrer');
    };

    useEffect(() => {
        if (!show) {
            setShowUserForm(false);
            setUserDetails({ fullName: "", contactNumber: "" });
            setFormErrors({ fullName: "", contactNumber: "" });
        }
    }, [show]);

    if (!show) return null;

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
                                <span className="text-sm sm:text-base font-semibold">{distance.toFixed(2)} km</span>
                            </div>

                            <div className="flex justify-between items-center py-2 border-t border-gray-700">
                                <span className="text-xs text-gray-400">Est. Duration</span>
                                <span className="text-sm sm:text-base font-semibold">{Math.round(duration)} min</span>
                            </div>

                            <div className="bg-gray-800 p-3 rounded-lg space-y-2">
                                <p className="text-xs text-gray-400 mb-1">💰 Fare Breakdown</p>

                                <div className="flex justify-between text-sm">
                                    <span>Base Fare (First {BASE_KM} km)</span>
                                    <span>₱{BASE_FARE.toFixed(2)}</span>
                                </div>

                                {extraDistance > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>Extra Distance ({extraDistance.toFixed(2)} km × ₱{EXTRA_RATE})</span>
                                        <span>₱{extraFare.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-700 my-2"></div>

                                <div className="flex justify-between items-center py-2 text-white font-bold text-lg">
                                    <span>Total Fare</span>
                                    <span>₱{fare.toFixed(2)}</span>
                                </div>
                            </div>

                            {showUserForm && (
                                <div className="bg-gray-800 p-4 rounded-lg space-y-4 mt-4 border border-gray-700">
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold text-white mb-2">📝 Your Details</h3>
                                        <p className="text-xs text-gray-400">Please provide your details to secure your booking</p>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1" htmlFor="fullName">Full Name *</label>
                                            <input
                                                type="text"
                                                id="fullName"
                                                name="fullName"
                                                value={userDetails.fullName}
                                                onChange={handleUserDetailsChange}
                                                placeholder="Enter your full name"
                                                className={`w-full bg-gray-900 border ${formErrors.fullName ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                disabled={saving}
                                            />
                                            {formErrors.fullName && <p className="text-xs text-red-400 mt-1">{formErrors.fullName}</p>}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1" htmlFor="contactNumber">Contact Number *</label>
                                            <input
                                                type="tel"
                                                id="contactNumber"
                                                name="contactNumber"
                                                value={userDetails.contactNumber}
                                                onChange={handleUserDetailsChange}
                                                placeholder="09XXXXXXXXX or +639XXXXXXXXX"
                                                className={`w-full bg-gray-900 border ${formErrors.contactNumber ? 'border-red-500' : 'border-gray-700'} rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                disabled={saving}
                                            />
                                            {formErrors.contactNumber && <p className="text-xs text-red-400 mt-1">{formErrors.contactNumber}</p>}
                                            <p className="text-xs text-gray-500 mt-1">This is how we'll contact you about your booking</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {saveError && <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg"><p className="text-red-300 text-sm">❌ {saveError}</p></div>}
                        {saved && <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg"><p className="text-green-300 text-sm">✅ Booking saved! Redirecting to tracking...</p></div>}

                        <div className="text-center text-xs text-gray-400 border-t border-gray-700 pt-3">
                            <p>{formattedTimestamp}</p>
                            <p className="mt-2">
                                By booking, you agree to our terms and conditions. Also you can send this receipt to our Facebook page.
                                For inquiries,{" "}
                                <button
                                    onClick={handleFacebookClick}
                                    className="text-blue-400 hover:text-blue-300 underline transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded"
                                    title="Go to our Facebook page"
                                >
                                    contact us on Facebook
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
                            onClick={() => {
                                if (showUserForm) {
                                    if (validateUserDetails()) setShowConfirm(true);
                                } else setShowUserForm(true);
                            }}
                            disabled={saving}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Saving...
                                </>
                            ) : showUserForm ? "Proceed to Confirm" : "Book Now"}
                        </button>
                    </div>
                </div>
            </div>

            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10000] p-4">
                    <div className="bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-gray-700">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-3">⚠️</div>
                            <h3 className="text-xl font-bold text-white mb-2">Confirm Your Booking</h3>
                            <p className="text-sm text-gray-300">Please verify your booking details below:</p>
                        </div>

                        <div className="bg-gray-900 rounded-lg p-3 mb-6 space-y-4">
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-400">From:</p>
                                    <p className="text-sm text-white font-medium">{pickupText}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">To:</p>
                                    <p className="text-sm text-white font-medium">{dropoffText}</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-700 pt-3 space-y-2">
                                <div>
                                    <p className="text-xs text-gray-400">Name:</p>
                                    <p className="text-sm text-white font-medium">{userDetails.fullName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Contact:</p>
                                    <p className="text-sm text-white font-medium">{userDetails.contactNumber}</p>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-700 pt-3">
                                <p className="text-xs text-gray-400">Total Fare:</p>
                                <p className="text-lg text-green-400 font-bold">₱{fare.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="text-xs text-gray-400 mb-6 text-center">
                            <p>Your contact details will be used to notify you about your ride status.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                                disabled={saving}
                            >
                                Edit Details
                            </button>
                            <button
                                onClick={handleBookOnFB}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Saving...
                                    </>
                                ) : (
                                    "Confirm & Save"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
