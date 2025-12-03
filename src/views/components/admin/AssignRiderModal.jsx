import { useState, useEffect } from 'react';
import { FaMotorcycle, FaUser, FaPhone, FaCar, FaTimes, FaCheck } from 'react-icons/fa';

export default function AssignRiderModal({
    isOpen,
    onClose,
    booking,
    onAssign,
    onUnassign,
    loading = false
}) {
    const [selectedRiderId, setSelectedRiderId] = useState(null);
    const [availableRiders, setAvailableRiders] = useState([]);
    const [currentAssignment, setCurrentAssignment] = useState(null);
    const [loadingRiders, setLoadingRiders] = useState(false);

    // Load available riders and current assignment
    useEffect(() => {
        if (isOpen && booking) {
            loadRidersData();
        }
    }, [isOpen, booking]);

    const loadRidersData = async () => {
        setLoadingRiders(true);
        try {
            // Static rider data - you can fetch from API later
            const riders = [
                { id: 1, name: 'Drew', contact: '+639123456789', vehicle: 'Honda Click', plateNumber: 'ABC123', status: 'active' },
                { id: 2, name: 'JM', contact: '+639987654321', vehicle: 'Suzuki Smash', plateNumber: 'DEF456', status: 'active' },
                { id: 3, name: 'Joaquin', contact: '+639111223344', vehicle: 'Yamaha Sniper', plateNumber: 'GHI789', status: 'active' },
                { id: 4, name: 'Hanz', contact: '+639555666777', vehicle: 'Honda Wave', plateNumber: 'JKL012', status: 'active' }
            ];
            setAvailableRiders(riders);

            // Check if booking already has a rider assigned
            if (booking.assigned_rider_id) {
                const assignedRider = riders.find(r => r.id === booking.assigned_rider_id);
                setCurrentAssignment({
                    rider: assignedRider,
                    assignedAt: booking.assigned_at
                });
                setSelectedRiderId(booking.assigned_rider_id);
            }
        } catch (error) {
            console.error('Error loading riders:', error);
        } finally {
            setLoadingRiders(false);
        }
    };

    const handleAssign = () => {
        if (selectedRiderId) {
            onAssign(booking.booking_number, selectedRiderId);
        }
    };

    const handleUnassign = () => {
        onUnassign(booking.booking_number);
    };

    if (!isOpen || !booking) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 sm:p-6 max-w-md w-full max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold text-yellow-400 flex items-center gap-2">
                        <FaMotorcycle className="text-base sm:text-xl" />
                        <span className="hidden xs:inline">Assign to Rider</span>
                        <span className="xs:hidden">Assign Rider</span>
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-xl sm:text-2xl"
                        disabled={loading}
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Booking Info */}
                <div className="bg-gray-900/50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                    <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 mb-1">Booking Number</p>
                            <p className="font-mono text-sm sm:text-base text-blue-400 font-bold truncate">{booking.booking_number}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            booking.status === 'confirmed' ? 'bg-blue-600' :
                            booking.status === 'assigned' ? 'bg-yellow-600' :
                            booking.status === 'completed' ? 'bg-green-600' :
                            'bg-red-600'
                        }`}>
                            {booking.status}
                        </span>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div className="min-w-0">
                            <p className="text-xs text-gray-400">Pickup</p>
                            <p className="truncate" title={booking.pickup_location}>{booking.pickup_location}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-gray-400">Dropoff</p>
                            <p className="truncate" title={booking.dropoff_location}>{booking.dropoff_location}</p>
                        </div>
                    </div>

                    {booking.user_details && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">Customer</p>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                                <FaUser className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">{booking.user_details.fullName || booking.user_details.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm">
                                <FaPhone className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">{booking.user_details.contactNumber || booking.user_details.phone}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Current Assignment (if any) */}
                {currentAssignment && (
                    <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 mb-3">
                            <h4 className="font-semibold text-sm sm:text-base text-yellow-400 flex items-center gap-2">
                                <FaCheck />
                                Currently Assigned
                            </h4>
                            <button
                                onClick={handleUnassign}
                                disabled={loading}
                                className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded font-semibold transition-colors disabled:opacity-50 w-full xs:w-auto"
                            >
                                Unassign
                            </button>
                        </div>
                        
                        <div className="space-y-2 text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                                <FaUser className="text-gray-400 flex-shrink-0" />
                                <span className="font-medium truncate">{currentAssignment.rider.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaPhone className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">{currentAssignment.rider.contact}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaCar className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">{currentAssignment.rider.vehicle} - {currentAssignment.rider.plateNumber}</span>
                            </div>
                        </div>
                        
                        {currentAssignment.assignedAt && (
                            <p className="text-xs text-gray-400 mt-3">
                                Assigned: {new Date(currentAssignment.assignedAt).toLocaleString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        )}
                    </div>
                )}

                {/* Available Riders */}
                <div className="mb-4 sm:mb-6">
                    <h4 className="font-semibold mb-3 text-sm sm:text-base text-gray-300">
                        {currentAssignment ? 'Change Rider:' : 'Select Rider:'}
                    </h4>
                    
                    {loadingRiders ? (
                        <div className="text-center py-4">
                            <div className="animate-spin text-2xl text-yellow-400">⏳</div>
                            <p className="text-gray-400 text-xs sm:text-sm mt-2">Loading riders...</p>
                        </div>
                    ) : availableRiders.length === 0 ? (
                        <div className="text-center py-4 text-gray-400 text-xs sm:text-sm">
                            No available riders at the moment.
                        </div>
                    ) : (
                        <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-60 overflow-y-auto pr-1 sm:pr-2">
                            {availableRiders.map((rider) => (
                                <div
                                    key={rider.id}
                                    className={`p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all ${
                                        selectedRiderId === rider.id
                                            ? 'bg-yellow-900/30 border-yellow-600'
                                            : 'bg-gray-900/50 border-gray-700 hover:bg-gray-900'
                                    }`}
                                    onClick={() => setSelectedRiderId(rider.id)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <FaUser className="text-gray-400 flex-shrink-0 text-xs sm:text-sm" />
                                                <span className="font-medium text-sm sm:text-base truncate">{rider.name}</span>
                                                <span className="text-xs px-2 py-0.5 bg-green-900/50 border border-green-700 rounded-full whitespace-nowrap">
                                                    Available
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                                                <FaPhone className="flex-shrink-0" />
                                                <span className="truncate">{rider.contact}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mt-1">
                                                <FaCar className="flex-shrink-0" />
                                                <span className="truncate">{rider.vehicle} ({rider.plateNumber})</span>
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                                            selectedRiderId === rider.id
                                                ? 'bg-yellow-500 border-yellow-500'
                                                : 'border-gray-500'
                                        } flex items-center justify-center`}>
                                            {selectedRiderId === rider.id && (
                                                <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 py-2.5 sm:py-3 rounded-xl font-semibold transition-colors text-sm sm:text-base"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={loading || !selectedRiderId || (currentAssignment && selectedRiderId === currentAssignment.rider.id)}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 py-2.5 sm:py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin">⟳</div>
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <FaCheck />
                                <span>{currentAssignment ? 'Reassign' : 'Assign Booking'}</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Instructions */}
                <p className="text-xs text-gray-500 mt-3 sm:mt-4 text-center">
                    Rider will receive this booking in their dashboard immediately.
                </p>
            </div>
        </div>
    );
}