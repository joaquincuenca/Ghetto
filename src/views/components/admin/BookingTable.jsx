export default function BookingTable({
    bookings,
    selectedBookings,
    onSelectBooking,
    onSelectAll,
    isSelectAll,
    onViewDetails,
    onStatusUpdate,
    getStatusColor,
    formatUserDetails
    }) {
    if (bookings.length === 0) {
        return (
        <tr>
            <td colSpan="11" className="px-4 py-8 text-center text-gray-400 text-sm md:text-base">
            No bookings found
            </td>
        </tr>
        );
    }

    return bookings.map((booking) => {
        const userDetails = formatUserDetails(booking.user_details);
        const isSelected = selectedBookings.includes(booking.id);
        
        return (
        <tr key={booking.id} className={`hover:bg-gray-750 ${isSelected ? 'bg-blue-900/20' : ''}`}>
            <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap w-10">
            <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelectBooking(booking.id)}
                className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-600"
            />
            </td>
            <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
            <button
                onClick={() => onViewDetails(booking)}
                className="font-mono text-xs md:text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors text-left"
            >
                {booking.booking_number}
            </button>
            </td>
            <td className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm whitespace-nowrap">
            {userDetails ? (
                <div className="min-w-[150px]">
                <p className="font-medium truncate">{userDetails.name}</p>
                <p className="text-gray-400 text-xs truncate">{userDetails.contact}</p>
                </div>
            ) : (
                <span className="text-gray-500 text-xs">No details</span>
            )}
            </td>
            <td className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm max-w-[150px] truncate" title={booking.pickup_location}>
            {booking.pickup_location}
            </td>
            <td className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm max-w-[150px] truncate" title={booking.dropoff_location}>
            {booking.dropoff_location}
            </td>
            <td className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm whitespace-nowrap">
            {booking.distance?.toFixed(2) || '0'} km
            </td>
            <td className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm font-semibold whitespace-nowrap">
            ₱{booking.fare?.toFixed(2) || '0'}
            </td>
            <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)} text-white`}>
                {booking.status}
            </span>
            </td>
            <td className="px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm text-gray-400 whitespace-nowrap">
            {new Date(booking.timestamp || booking.created_at).toLocaleDateString()}
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>
            <span className="text-xs">{new Date(booking.timestamp || booking.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </td>
            <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
            <div className="flex flex-col gap-1">
                <button
                onClick={() => onViewDetails(booking)}
                className="px-2 py-1 md:px-3 md:py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs font-semibold transition-colors whitespace-nowrap"
                >
                View Details
                </button>
                {booking.status === 'pending' && (
                <div className="flex gap-1">
                    <button
                    onClick={() => onStatusUpdate(booking.booking_number, 'confirmed')}
                    className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                    ✓ Accept
                    </button>
                    <button
                    onClick={() => onStatusUpdate(booking.booking_number, 'cancelled')}
                    className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                    ✗ Cancel
                    </button>
                </div>
                )}
                {booking.status === 'confirmed' && (
                <button
                    onClick={() => onStatusUpdate(booking.booking_number, 'completed')}
                    className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-semibold transition-colors whitespace-nowrap"
                >
                    ✓ Complete
                </button>
                )}
            </div>
            </td>
            <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
            <button
                onClick={() => onViewDetails(booking)}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-semibold transition-colors"
                title="Open Chat"
            >
                💬 Chat
            </button>
            </td>
        </tr>
        );
    });
}