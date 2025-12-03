import { useRiderDashboard } from '../../../viewmodels/RiderDashboardViewModel';
import { FaMotorcycle, FaMapMarkerAlt, FaHistory, FaCheckCircle, FaClock, FaTimesCircle, FaSync, FaSignOutAlt } from 'react-icons/fa';
import RiderBookingDetailsModal from './RiderBookingDetailsModal'; // ADD THIS IMPORT

export default function RiderDashboard() {
    const {
        rider,
        bookings,
        loading,
        error,
        stats,
        filter,
        selectedBooking,
        showBookingDetails,
        isRefreshing,
        autoRefresh,
        location,
        isUpdatingLocation,
        filteredBookings,
        
        setFilter,
        setAutoRefresh,
        setShowBookingDetails,
        handleAcceptBooking,
        
        handleLogout,
        handleStatusUpdate,
        viewBookingDetails,
        refreshData,
        closeBookingDetails // MAKE SURE THIS EXISTS IN YOUR VIEWMODEL
    } = useRiderDashboard();

    if (loading && !rider) {
        return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
            <div className="animate-spin text-6xl text-yellow-400 mb-4">⏳</div>
            <p className="text-white text-xl">Loading rider dashboard...</p>
            </div>
        </div>
        );
    }

    if (!rider) {
        return null; // Will redirect in ViewModel
    }

    // ADD THIS FUNCTION FOR MODAL ACTIONS
    const handleCompleteBooking = (bookingId) => {
        handleStatusUpdate(bookingId, 'completed');
    };

    // ADD THIS FUNCTION FOR CANCEL BOOKING
    const handleCancelBooking = (bookingId) => {
        handleStatusUpdate(bookingId, 'cancelled');
    };

    // ADD THIS FUNCTION FOR GET DIRECTIONS
    const handleGetDirections = () => {
        if (selectedBooking && location) {
            window.open(`https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lng}&destination=${encodeURIComponent(selectedBooking.dropoff_location)}`, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2 flex items-center gap-2">
                    <FaMotorcycle className="text-yellow-400" />
                    Rider Dashboard
                </h1>
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                    <p className="text-gray-400 text-sm md:text-base">
                    Welcome, <span className="font-semibold text-yellow-400">{rider.name}</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                    <FaMapMarkerAlt className="text-green-400" />
                    <span className={`${isUpdatingLocation ? 'animate-pulse' : ''}`}>
                        {location 
                        ? `Live Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                        : 'Location: Updating...'
                        }
                    </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-green-900/30 border border-green-700 rounded-full text-xs">
                        {rider.vehicle}
                    </span>
                    <span className="px-2 py-1 bg-blue-900/30 border border-blue-700 rounded-full text-xs">
                        {rider.plateNumber}
                    </span>
                    </div>
                </div>
                </div>
                <div className="flex items-center gap-3">
                <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-colors text-sm ${
                    autoRefresh 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'animate-pulse bg-green-300' : 'bg-gray-400'}`} />
                    {autoRefresh ? 'Auto ON' : 'Auto OFF'}
                </button>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-sm"
                >
                    <FaSignOutAlt />
                    Logout
                </button>
                </div>
            </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4 mb-6">
            <div className="bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-700 col-span-2 md:col-span-1">
                <p className="text-gray-400 text-xs md:text-sm">Total Jobs</p>
                <p className="text-xl md:text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-yellow-900/30 p-3 md:p-4 rounded-lg border border-yellow-700">
                <p className="text-yellow-400 text-xs md:text-sm">Active</p>
                <p className="text-xl md:text-3xl font-bold text-yellow-400">{stats.active}</p>
            </div>
            <div className="bg-green-900/30 p-3 md:p-4 rounded-lg border border-green-700">
                <p className="text-green-400 text-xs md:text-sm">Completed</p>
                <p className="text-xl md:text-3xl font-bold text-green-400">{stats.completed}</p>
            </div>
            <div className="bg-blue-900/30 p-3 md:p-4 rounded-lg border border-blue-700">
                <p className="text-blue-400 text-xs md:text-sm">This Month</p>
                <p className="text-xl md:text-3xl font-bold text-blue-400">{stats.thisMonth}</p>
            </div>
            <div className="bg-purple-900/30 p-3 md:p-4 rounded-lg border border-purple-700">
                <p className="text-purple-400 text-xs md:text-sm">Success Rate</p>
                <p className="text-xl md:text-3xl font-bold text-purple-400">{stats.completionRate}%</p>
            </div>
            <div className="bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-700 col-span-2 md:col-span-1 flex items-center justify-between">
                <div>
                <p className="text-gray-400 text-xs md:text-sm">Status</p>
                <p className="text-xl md:text-3xl font-bold text-green-400">Online</p>
                </div>
                <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50"
                >
                <FaSync className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
            <div className="flex flex-wrap gap-2">
                {['all', 'active', 'pending', 'completed', 'cancelled'].map(status => (
                <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold transition-colors text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
                    filter === status
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
                ))}
            </div>
            </div>

            {/* Error Message */}
            {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
                <p className="text-red-300 text-sm md:text-base">❌ {error}</p>
            </div>
            )}

            {/* Bookings List */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
            <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-700">
                    <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Booking #</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Pickup</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Dropoff</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Distance</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Fare</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Assigned</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                    {filteredBookings.length === 0 ? (
                    <tr>
                        <td colSpan="9" className="px-4 py-8 text-center text-gray-400">
                        No bookings assigned to you yet.
                        </td>
                    </tr>
                    ) : (
                    filteredBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-750">
                        <td className="px-4 py-3">
                            <button
                            onClick={() => {
                                viewBookingDetails(booking);
                            }}
                            className="font-mono text-sm text-yellow-400 hover:text-yellow-300 hover:underline"
                            >
                            {booking.booking_number}
                            </button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                            {booking.user_details?.fullName || 'Customer'}
                            {booking.user_details?.contactNumber && (
                            <p className="text-xs text-gray-400">{booking.user_details.contactNumber}</p>
                            )}
                        </td>
                        <td className="px-4 py-3 text-sm max-w-[150px] truncate" title={booking.pickup_location}>
                            {booking.pickup_location}
                        </td>
                        <td className="px-4 py-3 text-sm max-w-[150px] truncate" title={booking.dropoff_location}>
                            {booking.dropoff_location}
                        </td>
                        <td className="px-4 py-3 text-sm">{booking.distance?.toFixed(2) || '0'} km</td>
                        <td className="px-4 py-3 text-sm font-semibold">₱{booking.fare?.toFixed(2) || '0'}</td>
                        <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'confirmed' ? 'bg-blue-600' :
                            booking.status === 'assigned' ? 'bg-yellow-600' :
                            booking.status === 'completed' ? 'bg-green-600' :
                            'bg-red-600'
                            } text-white`}>
                            {booking.status}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                            {new Date(booking.assigned_at).toLocaleDateString()}
                            <br />
                            {new Date(booking.assigned_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                            <button
                                onClick={() => {
                                    viewBookingDetails(booking);
                                }}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs font-semibold transition-colors"
                            >
                                View Details
                            </button>
                            {booking.status === 'confirmed' && (
                                <button
                                onClick={() => handleStatusUpdate(booking.booking_number, 'completed')}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-semibold transition-colors"
                                >
                                Mark Completed
                                </button>
                            )}
                            </div>
                        </td>
                        </tr>
                    ))
                    )}
                </tbody>
                </table>
            </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
            <button
                onClick={refreshData}
                disabled={isRefreshing}
                className="px-4 py-2 md:px-6 md:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors text-sm md:text-base flex items-center justify-center gap-2"
            >
                {isRefreshing ? (
                <>
                    <div className="animate-spin">⟳</div>
                    Refreshing...
                </>
                ) : (
                <>
                    <FaSync />
                    Refresh Data
                </>
                )}
            </button>
            <button
                onClick={() => window.open(`https://maps.google.com/?q=${location?.lat},${location?.lng}`, '_blank')}
                className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-sm md:text-base flex items-center justify-center gap-2"
                disabled={!location}
            >
                <FaMapMarkerAlt />
                Open in Maps
            </button>
            </div>
        </div>

        {/* ADD THE MODAL HERE - AT THE END */}
        <RiderBookingDetailsModal
            isOpen={showBookingDetails}
            onClose={closeBookingDetails}
            booking={selectedBooking}
            onAcceptBooking={handleAcceptBooking}
            onCompleteBooking={handleCompleteBooking}
            onCancelBooking={handleCancelBooking}
            loading={isRefreshing}
        />
        </div>
    );
}