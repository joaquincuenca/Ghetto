import { useState, useEffect } from 'react';
import { FaUser, FaPhone, FaMapMarkerAlt, FaFlagCheckered, FaMotorcycle, FaCheckCircle, FaTimesCircle, FaDollarSign, FaRoute, FaCalendar, FaTimes, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

// Status Dialog Component (built-in, no separate file)
function StatusDialog({
    isOpen,
    onClose,
    type = 'success', // 'success', 'error', 'info'
    title = '',
    message = '',
    actionText = '',
    onAction = null,
    showCloseButton = true,
    autoClose = false,
    autoCloseDelay = 3000,
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            
            if (autoClose) {
                const timer = setTimeout(() => {
                    handleClose();
                }, autoCloseDelay);
                return () => clearTimeout(timer);
            }
        }
    }, [isOpen, autoClose, autoCloseDelay]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            if (onClose) onClose();
        }, 300);
    };

    const handleAction = () => {
        if (onAction) {
            onAction();
        }
        handleClose();
    };

    if (!isOpen && !isVisible) return null;

    const config = {
        success: {
            icon: FaCheckCircle,
            bgColor: 'bg-green-900/20',
            borderColor: 'border-green-700',
            iconColor: 'text-green-400',
            titleColor: 'text-green-300',
            buttonColor: 'bg-green-600 hover:bg-green-700',
            defaultTitle: 'Success!',
        },
        error: {
            icon: FaExclamationCircle,
            bgColor: 'bg-red-900/20',
            borderColor: 'border-red-700',
            iconColor: 'text-red-400',
            titleColor: 'text-red-300',
            buttonColor: 'bg-red-600 hover:bg-red-700',
            defaultTitle: 'Error!',
        },
        info: {
            icon: FaInfoCircle,
            bgColor: 'bg-blue-900/20',
            borderColor: 'border-blue-700',
            iconColor: 'text-blue-400',
            titleColor: 'text-blue-300',
            buttonColor: 'bg-blue-600 hover:bg-blue-700',
            defaultTitle: 'Information',
        },
    }[type];

    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div
                className={`fixed inset-0 bg-black/70 transition-opacity duration-300 ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={showCloseButton ? handleClose : undefined}
            />
            
            <div
                className={`relative rounded-2xl border ${config.borderColor} ${config.bgColor} p-6 w-full max-w-md transform transition-all duration-300 ${
                    isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}
            >
                {showCloseButton && (
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                )}
                
                <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${config.bgColor} border ${config.borderColor}`}>
                        <Icon className={`text-4xl ${config.iconColor}`} />
                    </div>
                </div>
                
                <h3 className={`text-center text-xl font-bold mb-2 ${config.titleColor}`}>
                    {title || config.defaultTitle}
                </h3>
                
                <p className="text-gray-300 text-center mb-6">
                    {message}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    {onAction && actionText && (
                        <button
                            onClick={handleAction}
                            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${config.buttonColor} text-white`}
                        >
                            {actionText}
                        </button>
                    )}
                    
                    {showCloseButton && (
                        <button
                            onClick={handleClose}
                            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                                onAction ? 'bg-gray-700 hover:bg-gray-600' : config.buttonColor
                            } text-white`}
                        >
                            {onAction ? 'Cancel' : 'Close'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Main Modal Component
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
    const [showStatusDialog, setShowStatusDialog] = useState(false);
    const [statusDialogConfig, setStatusDialogConfig] = useState({
        type: 'success',
        title: '',
        message: '',
    });
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (booking && booking.user_details) {
            setUserDetails({
                name: booking.user_details.fullName || booking.user_details.name || 'Customer',
                contact: booking.user_details.contactNumber || booking.user_details.phone || 'Not provided'
            });
        }
    }, [booking]);

    const showSuccessDialog = (message, callback = null) => {
        setStatusDialogConfig({
            type: 'success',
            title: 'Success!',
            message: message,
        });
        setShowStatusDialog(true);
        
        setTimeout(() => {
            setShowStatusDialog(false);
            if (callback) callback();
        }, 2000);
    };

    const showErrorDialog = (message) => {
        setStatusDialogConfig({
            type: 'error',
            title: 'Error!',
            message: message,
        });
        setShowStatusDialog(true);
    };

    const handleAccept = async () => {
        if (!onAcceptBooking) {
            showErrorDialog('Accept function is not available. Please try again later.');
            return;
        }
        
        if (!booking?.booking_number) {
            showErrorDialog('No booking number found. Please contact support.');
            return;
        }
        
        if (loading || isProcessing) return;
        
        setIsProcessing(true);
        try {
            await onAcceptBooking(booking.booking_number);
            showSuccessDialog('Booking accepted successfully! You can now start the ride.', () => {
                onClose();
            });
        } catch (error) {
            showErrorDialog(error.message || 'Failed to accept booking. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleComplete = async () => {
        if (!onCompleteBooking) {
            showErrorDialog('Complete function is not available. Please try again later.');
            return;
        }
        
        if (loading || isProcessing) return;
        
        setIsProcessing(true);
        try {
            await onCompleteBooking(booking.booking_number);
            showSuccessDialog('Ride completed successfully! Payment will be processed.', () => {
                onClose();
            });
        } catch (error) {
            showErrorDialog(error.message || 'Failed to complete ride. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!onCancelBooking) {
            showErrorDialog('Cancel function is not available. Please try again later.');
            return;
        }
        
        if (loading || isProcessing) return;
        
        setStatusDialogConfig({
            type: 'error',
            title: 'Confirm Cancellation',
            message: 'Are you sure you want to cancel this ride? This action cannot be undone.',
            actionText: 'Yes, Cancel Ride',
            onAction: async () => {
                try {
                    await onCancelBooking(booking.booking_number);
                    showSuccessDialog('Ride cancelled successfully.', () => {
                        onClose();
                    });
                } catch (error) {
                    showErrorDialog(error.message || 'Failed to cancel ride. Please try again.');
                }
            }
        });
        setShowStatusDialog(true);
    };

    if (!isOpen || !booking) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                            disabled={loading || isProcessing}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="mb-6">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                            booking.status === 'assigned' ? 'bg-yellow-600' :
                            booking.status === 'confirmed' ? 'bg-blue-600' :
                            booking.status === 'completed' ? 'bg-green-600' :
                            booking.status === 'in_progress' ? 'bg-purple-600' :
                            'bg-red-600'
                        }`}>
                            {booking.status.toUpperCase()}
                        </span>
                    </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

                    <div className="space-y-3">
                        {(booking.status === 'assigned' || booking.status === 'confirmed') && (
                            <button
                                onClick={handleAccept}
                                disabled={loading || isProcessing}
                                className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaCheckCircle className="text-xl" />
                                        Accept & Start Ride
                                    </>
                                )}
                            </button>
                        )}

                        {booking.status === 'in_progress' && (
                            <button
                                onClick={handleComplete}
                                disabled={loading || isProcessing}
                                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <FaCheckCircle className="text-xl" />
                                        Mark as Completed
                                    </>
                                )}
                            </button>
                        )}

                        {(booking.status === 'assigned' || booking.status === 'confirmed' || booking.status === 'in_progress') && (
                            <button
                                onClick={handleCancel}
                                disabled={loading || isProcessing}
                                className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaTimesCircle className="text-xl" />
                                Cancel Ride
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold transition-colors"
                            disabled={loading || isProcessing}
                        >
                            Close
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                        <p className="text-sm text-yellow-300">
                            <span className="font-semibold">Note:</span> When you accept a booking, the customer will be notified and can track your location in real-time.
                        </p>
                    </div>
                </div>
            </div>

            <StatusDialog
                isOpen={showStatusDialog}
                onClose={() => setShowStatusDialog(false)}
                type={statusDialogConfig.type}
                title={statusDialogConfig.title}
                message={statusDialogConfig.message}
                actionText={statusDialogConfig.actionText}
                onAction={statusDialogConfig.onAction}
                showCloseButton={!statusDialogConfig.onAction}
                autoClose={statusDialogConfig.type === 'success' && !statusDialogConfig.onAction}
                autoCloseDelay={2000}
            />
        </>
    );
}