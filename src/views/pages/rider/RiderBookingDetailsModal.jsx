import { useState, useEffect } from 'react';
import { FaUser, FaPhone, FaMapMarkerAlt, FaFlagCheckered, FaMotorcycle, FaCheckCircle, FaTimesCircle, FaDollarSign, FaRoute, FaCalendar } from 'react-icons/fa';

export default function RiderBookingDetailsModal({
    isOpen,
    onClose,
    booking,
    onAcceptBooking,
    onCompleteBooking,
    onCancelBooking,
    loading = false
    }) {
    const [userDetails, setUserDetails] = useState(null);

    useEffect(() => {
        if (booking) {
            console.log('📊 Modal booking status:', booking.status);
            console.log('📊 Booking object:', booking);
        }
        if (booking && booking.user_details) {
        setUserDetails({
            name: booking.user_details.fullName || booking.user_details.name || 'Customer',
            contact: booking.user_details.contactNumber || booking.user_details.phone || 'Not provided'
        });
        }
    }, [booking]);

    if (!isOpen || !booking) return null;

    const handleAccept = () => {
        console.log('🎯 ====== MODAL: Accept button clicked ======');
        console.log('🎯 Booking number:', booking?.booking_number);
        console.log('🎯 Booking status:', booking?.status);
        console.log('🎯 onAcceptBooking exists:', !!onAcceptBooking);
        console.log('🎯 loading state:', loading);
        
        if (!onAcceptBooking) {
            console.error('❌ ERROR: onAcceptBooking prop is NULL or UNDEFINED');
            alert('Error: Accept function not available');
            return;
        }
        
        if (!booking?.booking_number) {
            console.error('❌ ERROR: No booking number');
            alert('Error: No booking number found');
            return;
        }
        
        if (loading) {
            console.log('⏳ Loading, skipping click');
            return;
        }
        
        console.log('✅ Calling onAcceptBooking with:', booking.booking_number);
        onAcceptBooking(booking.booking_number);
    };

    const handleComplete = () => {
        if (onCompleteBooking) {
        onCompleteBooking(booking.booking_number);
        }
    };

    const handleCancel = () => {
        if (onCancelBooking) {
        onCancelBooking(booking.booking_number);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                <FaMotorcycle />
                Booking Details
                </h3>
                <p className="font-mono text-blue-400 text-sm mt-1">{booking.booking_number}</p>
            </div>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl"
                disabled={loading}
            >
                ✕
            </button>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
            <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                booking.status === 'assigned' ? 'bg-yellow-600' :
                booking.status === 'confirmed' ? 'bg-blue-600' :
                booking.status === 'completed' ? 'bg-green-600' :
                'bg-red-600'
            }`}>
                {booking.status.toUpperCase()}
            </span>
            </div>

            {/* Customer Details */}
            <div className="bg-gray-900/50 rounded-xl p-5 mb-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaUser className="text-yellow-400" />
                Customer Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <p className="text-sm text-gray-400 mb-1">Full Name</p>
                <p className="font-medium flex items-center gap-2">
                    <FaUser className="text-gray-500" />
                    {userDetails?.name || 'Customer'}
                </p>
                </div>
                <div>
                <p className="text-sm text-gray-400 mb-1">Contact Number</p>
                <p className="font-medium flex items-center gap-2">
                    <FaPhone className="text-gray-500" />
                    {userDetails?.contact || 'Not provided'}
                </p>
                </div>
            </div>
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Pickup Location */}
            <div className="bg-gray-900/50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center">
                    <FaMapMarkerAlt className="text-blue-400 text-xl" />
                </div>
                <div>
                    <h4 className="font-semibold">Pickup Location</h4>
                    <p className="text-sm text-gray-400">Where to pick up the customer</p>
                </div>
                </div>
                <p className="text-lg font-medium">{booking.pickup_location}</p>
            </div>

            {/* Dropoff Location */}
            <div className="bg-gray-900/50 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-900/30 rounded-full flex items-center justify-center">
                    <FaFlagCheckered className="text-green-400 text-xl" />
                </div>
                <div>
                    <h4 className="font-semibold">Drop-off Location</h4>
                    <p className="text-sm text-gray-400">Where to drop off the customer</p>
                </div>
                </div>
                <p className="text-lg font-medium">{booking.dropoff_location}</p>
            </div>
            </div>

            {/* Ride Details */}
            <div className="bg-gray-900/50 rounded-xl p-5 mb-6">
            <h4 className="text-lg font-semibold mb-4">Ride Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                <p className="text-sm text-gray-400 mb-1">Distance</p>
                <div className="flex items-center gap-2">
                    <FaRoute className="text-blue-400" />
                    <p className="font-bold text-lg">{booking.distance?.toFixed(2) || '0'} km</p>
                </div>
                </div>
                <div>
                <p className="text-sm text-gray-400 mb-1">Fare</p>
                <div className="flex items-center gap-2">
                    <FaDollarSign className="text-green-400" />
                    <p className="font-bold text-lg text-green-400">₱{booking.fare?.toFixed(2) || '0'}</p>
                </div>
                </div>
                <div>
                <p className="text-sm text-gray-400 mb-1">Assigned On</p>
                <div className="flex items-center gap-2">
                    <FaCalendar className="text-purple-400" />
                    <p className="text-sm">
                    {new Date(booking.assigned_at || booking.created_at).toLocaleDateString()}
                    </p>
                </div>
                </div>
                <div>
                <p className="text-sm text-gray-400 mb-1">Booking Time</p>
                <div className="flex items-center gap-2">
                    <FaCalendar className="text-yellow-400" />
                    <p className="text-sm">
                    {new Date(booking.created_at || booking.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}
                    </p>
                </div>
                </div>
            </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
            {/* Accept Button (for assigned bookings) */}
            {(booking.status === 'assigned' || booking.status === 'confirmed') && ( // CHANGE THIS LINE
                <button
                    onClick={handleAccept}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaCheckCircle className="text-xl" />
                    Accept & Start Ride
                </button>
            )}

            {booking.status === 'in_progress' && (
                <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaCheckCircle className="text-xl" />
                    Mark as Completed
                </button>
            )}

            {/* Cancel Button (for assigned/confirmed bookings) */}
            {(booking.status === 'assigned' || booking.status === 'confirmed') && (
                <button
                onClick={handleCancel}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                <FaTimesCircle className="text-xl" />
                Cancel Ride
                </button>
            )}

            {/* Close Button */}
            <button
                onClick={onClose}
                className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold transition-colors"
                disabled={loading}
            >
                Close
            </button>
            </div>

            {/* Notes */}
            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-300">
                <span className="font-semibold">Note:</span> When you accept a booking, the customer will be notified and can track your location in real-time.
            </p>
            </div>
        </div>
        </div>
    );
}