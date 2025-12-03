import StatusBadge from './StatusBadge';

export default function BookingDetailsCard({ booking, userDetails }) {
    if (!booking) return null;

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Booking Details</h3>
            <StatusBadge status={booking.status} />
        </div>
        
        <div className="space-y-4">
            <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Booking Number</p>
            <p className="font-mono text-blue-400 font-bold text-lg">{booking.booking_number}</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                <span className="text-xl">📍</span>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Pickup Location</p>
                    <p className="text-sm">{booking.pickup_location}</p>
                </div>
                </div>
            </div>
            
            <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                <span className="text-xl">🚩</span>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Drop-off Location</p>
                    <p className="text-sm">{booking.dropoff_location}</p>
                </div>
                </div>
            </div>
            </div>

            {userDetails && (
            <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">👤</span>
                <h4 className="text-sm font-semibold text-gray-300">Customer Details</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="text-xs text-gray-400 mb-1">Full Name</p>
                    <p className="text-sm font-medium text-white">{userDetails.name}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 mb-1">Contact Number</p>
                    <p className="text-sm font-medium text-white">{userDetails.contact}</p>
                </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                This information was provided during booking and is used for ride coordination.
                </p>
            </div>
            )}

            <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Distance</p>
                <p className="font-semibold text-lg">{booking.distance?.toFixed(2) || '0.00'} km</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Fare</p>
                <p className="font-semibold text-blue-400 text-lg">₱{booking.fare?.toFixed(2) || '0.00'}</p>
            </div>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Booked On</p>
            <p className="text-sm">
                {new Date(booking.timestamp || booking.created_at).toLocaleString()}
            </p>
            </div>
        </div>
        </div>
    );
}