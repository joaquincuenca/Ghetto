// src/views/pages/BookingTrackingPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookingService } from '../../services/BookingService';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function BookingTrackingPage() {
    const { bookingNumber } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastStatus, setLastStatus] = useState(null);
    const [statusUpdateTime, setStatusUpdateTime] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    
    const pollingRef = useRef(null);
    const audioRef = useRef(null);
    const statusChangedRef = useRef(false);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        if (bookingNumber && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            initializeTracking();
        }

        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, [bookingNumber]);

    const initializeTracking = async () => {
        try {
            await loadBooking();
            subscribeToUpdates();
            setupPolling();
            
            // Load notification sound
            audioRef.current = new Audio('/notification.mp3');
            audioRef.current.volume = 0.3;
        } catch (err) {
            console.error('Failed to initialize tracking:', err);
        }
    };

    useEffect(() => {
        if (booking) {
            // Check if status changed
            if (lastStatus && booking.status !== lastStatus) {
                statusChangedRef.current = true;
                setStatusUpdateTime(new Date().toISOString());
                playStatusChangeSound(booking.status);
            }
            setLastStatus(booking.status);
        }
    }, [booking]);

    const setupPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }
        
        if (autoRefresh && booking) {
            pollingRef.current = setInterval(() => {
                if (!isRefreshing && booking?.status !== 'completed' && booking?.status !== 'cancelled') {
                    loadBooking();
                }
            }, 5000);
        }
    };

    useEffect(() => {
        setupPolling();
    }, [autoRefresh, booking]);

    const loadBooking = async () => {
        if (!bookingNumber) return;
        
        try {
            setIsRefreshing(true);
            const data = await BookingService.getBookingByNumber(bookingNumber);
            
            if (!data) {
                throw new Error('Booking not found');
            }
            
            setBooking(data);
            setError(null);
        } catch (err) {
            console.error('Error loading booking:', err);
            setError(err.message || 'Failed to load booking');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const subscribeToUpdates = () => {
        if (!bookingNumber) return;

        try {
            const channel = supabase
                .channel(`booking-${bookingNumber}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'bookings',
                        filter: `booking_number=eq.${bookingNumber}`
                    },
                    (payload) => {
                        setBooking(payload.new);
                    }
                )
                .subscribe((status) => {
                    console.log('Supabase subscription status:', status);
                });

            return () => {
                supabase.removeChannel(channel);
            };
        } catch (err) {
            console.error('Error subscribing to updates:', err);
        }
    };

    const handleCancelBooking = async () => {
        if (!booking || !bookingNumber) return;
        
        try {
            setIsCancelling(true);
            setShowCancelConfirm(false);
            
            // Call the cancel booking service
            const result = await BookingService.cancelBooking(bookingNumber);
            
            if (result.success) {
                // Update local state immediately
                setBooking(prev => ({
                    ...prev,
                    status: 'cancelled'
                }));
                
                // Show success message
                alert('Booking has been cancelled successfully.');
                
                // Stop auto-refresh since booking is cancelled
                setAutoRefresh(false);
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                }
            } else {
                throw new Error(result.message || 'Failed to cancel booking');
            }
        } catch (err) {
            console.error('Error cancelling booking:', err);
            alert(`Failed to cancel booking: ${err.message}`);
        } finally {
            setIsCancelling(false);
        }
    };

    const playStatusChangeSound = (status) => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
        
        if ("Notification" in window && Notification.permission === "granted") {
            const statusMessages = {
                'pending': 'Waiting for driver to accept...',
                'confirmed': '🚗 Driver has accepted your booking!',
                'completed': '✅ Ride completed successfully!',
                'cancelled': '❌ Booking has been cancelled'
            };
            
            new Notification(`Booking #${bookingNumber}`, {
                body: `Status changed to ${status}: ${statusMessages[status]}`,
                icon: '/favicon.ico',
                tag: 'booking-update'
            });
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return '⏳';
            case 'confirmed': return '✅';
            case 'completed': return '🎉';
            case 'cancelled': return '❌';
            default: return '📋';
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case 'pending': return 'Waiting for driver to accept...';
            case 'confirmed': return 'Driver has accepted your booking!';
            case 'completed': return 'Ride completed successfully!';
            case 'cancelled': return 'Booking has been cancelled.';
            default: return 'Booking received.';
        }
    };

    const getEstimatedTime = (status) => {
        if (status === 'pending') return '5-10 minutes';
        if (status === 'confirmed') return '3-5 minutes';
        if (status === 'completed') return 'Arrived';
        return 'N/A';
    };

    const retryLoading = () => {
        setLoading(true);
        setError(null);
        loadBooking();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin text-6xl mb-4">⏳</div>
                    <p className="text-white text-xl">Loading booking...</p>
                    <p className="text-gray-400 mt-2">#{bookingNumber}</p>
                    <button
                        onClick={retryLoading}
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                    >
                        Retry Loading
                    </button>
                </div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full text-center border border-gray-700">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {error ? 'Error Loading Booking' : 'Booking Not Found'}
                    </h2>
                    <p className="text-gray-400 mb-4">
                        {error || 'The booking could not be loaded.'}
                    </p>
                    <p className="text-gray-500 text-sm mb-6">Booking #: {bookingNumber}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={retryLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Check if booking can be cancelled
    const canCancel = ['pending', 'confirmed'].includes(booking.status);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-md w-full">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold mb-2">Cancel Booking?</h3>
                            <p className="text-gray-400 text-sm">
                                Are you sure you want to cancel booking #{bookingNumber}? 
                                This action cannot be undone.
                            </p>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold transition-colors"
                                disabled={isCancelling}
                            >
                                Go Back
                            </button>
                            <button
                                onClick={handleCancelBooking}
                                disabled={isCancelling}
                                className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                {isCancelling ? (
                                    <>
                                        <div className="animate-spin">⟳</div>
                                        Cancelling...
                                    </>
                                ) : (
                                    'Yes, Cancel'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-2xl mx-auto py-8">
                {/* Header with Auto-refresh Toggle */}
                <div className="text-center mb-8 relative">
                    <div className="absolute top-0 right-0">
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-700 text-sm transition-colors"
                        >
                            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                            <span className="text-gray-400">
                                {autoRefresh ? 'Live' : 'Manual'}
                            </span>
                        </button>
                    </div>
                    
                    <h1 className="text-3xl font-bold mb-2">Track Your Booking</h1>
                    <p className="text-gray-400">Real-time updates on your ride</p>
                    <p className="text-blue-400 font-mono text-sm mt-1">#{bookingNumber}</p>
                </div>

                {/* Status Change Notification */}
                {statusChangedRef.current && (
                    <div className="mb-6 animate-fade-in">
                        <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div>
                                    <p className="font-semibold">Status Updated!</p>
                                    <p className="text-sm text-gray-300">
                                        Your booking is now <span className="font-semibold capitalize">{booking.status}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => statusChangedRef.current = false}
                                className="text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Status Card */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden mb-6">
                    <div className={`p-6 text-center ${
                        booking.status === 'pending' ? 'bg-yellow-900/30' :
                        booking.status === 'confirmed' ? 'bg-blue-900/30' :
                        booking.status === 'completed' ? 'bg-green-900/30' :
                        'bg-red-900/30'
                    }`}>
                        <div className="text-7xl mb-4">
                            {getStatusIcon(booking.status)}
                        </div>
                        <h2 className="text-2xl font-bold mb-2 capitalize">
                            {booking.status}
                        </h2>
                        <p className="text-gray-300 mb-3">
                            {getStatusMessage(booking.status)}
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/30 rounded-full">
                            <span className="text-sm">Estimated: </span>
                            <span className="font-semibold">{getEstimatedTime(booking.status)}</span>
                        </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="p-6 relative">
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-2">
                                {/* Step 1 */}
                                <div className={`flex flex-col items-center ${['confirmed', 'completed'].includes(booking.status) ? 'text-blue-400' : 'text-gray-400'}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                                        ['pending', 'confirmed', 'completed'].includes(booking.status)
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                            : 'bg-gray-700 text-gray-400'
                                    }`}>
                                        1
                                    </div>
                                    <span className="text-xs font-semibold">Requested</span>
                                </div>

                                {/* Step 2 */}
                                <div className={`flex flex-col items-center ${['confirmed', 'completed'].includes(booking.status) ? 'text-blue-400' : 'text-gray-400'}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                                        ['confirmed', 'completed'].includes(booking.status)
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                            : 'bg-gray-700 text-gray-400'
                                    }`}>
                                        2
                                    </div>
                                    <span className="text-xs font-semibold">Accepted</span>
                                </div>

                                {/* Step 3 */}
                                <div className={`flex flex-col items-center ${booking.status === 'completed' ? 'text-blue-400' : 'text-gray-400'}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-2 ${
                                        booking.status === 'completed'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                            : 'bg-gray-700 text-gray-400'
                                    }`}>
                                        3
                                    </div>
                                    <span className="text-xs font-semibold">Completed</span>
                                </div>
                            </div>
                        </div>

                        {/* Background Line Container */}
                        <div className="absolute top-12 left-6 right-6 h-1 -z-0">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gray-700"></div>
                            <div
                                className={`absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-700 ease-out ${
                                    booking.status === 'pending' ? 'w-0' :
                                    booking.status === 'confirmed' ? 'w-1/2' :
                                    booking.status === 'completed' ? 'w-full' : 'w-0'
                                }`}
                            ></div>
                        </div>
                    </div>

                    {statusUpdateTime && (
                        <div className="px-6 pb-6">
                            <div className="text-center text-sm text-gray-500">
                                Last updated: {new Date(statusUpdateTime).toLocaleTimeString()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Booking Details */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Booking Details</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'pending' ? 'bg-yellow-600' :
                            booking.status === 'confirmed' ? 'bg-blue-600' :
                            booking.status === 'completed' ? 'bg-green-600' :
                            'bg-red-600'
                        }`}>
                            {booking.status}
                        </span>
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-900 p-4 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Distance</p>
                                <p className="font-semibold text-lg">{booking.distance.toFixed(2)} km</p>
                            </div>
                            <div className="bg-gray-900 p-4 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Fare</p>
                                <p className="font-semibold text-blue-400 text-lg">₱{booking.fare.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="bg-gray-900 p-4 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Booked On</p>
                            <p className="text-sm">{new Date(booking.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4">
                    {/* Cancel Button (only show if booking can be cancelled) */}
                    {canCancel && (
                        <button
                            onClick={() => setShowCancelConfirm(true)}
                            disabled={isCancelling}
                            className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCancelling ? (
                                <>
                                    <div className="animate-spin">⟳</div>
                                    Cancelling...
                                </>
                            ) : (
                                <>
                                    <span className="text-xl">✕</span>
                                    Cancel Booking
                                </>
                            )}
                        </button>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            ← Back to Home
                        </button>
                        <button
                            onClick={loadBooking}
                            disabled={isRefreshing}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isRefreshing ? (
                                <>
                                    <div className="animate-spin">⟳</div>
                                    Refreshing...
                                </>
                            ) : (
                                'Refresh Now'
                            )}
                        </button>
                    </div>
                </div>

                {/* Live Indicator & Last Refresh */}
                <div className="mt-6 flex flex-col items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full border border-gray-700">
                        <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                        <span className="text-sm text-gray-400">
                            {autoRefresh ? 'Live updates enabled' : 'Manual refresh mode'}
                        </span>
                    </div>
                    
                    <div className="text-center text-sm text-gray-500">
                        {autoRefresh && (
                            <>
                                <p>Auto-refreshing every 5 seconds</p>
                                <p className="text-xs mt-1">Last checked: {new Date().toLocaleTimeString()}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Status Explanation */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                    <h4 className="font-semibold mb-3 text-gray-300">What each status means:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-yellow-400">⏳</span>
                                <span className="font-semibold text-sm">Pending</span>
                            </div>
                            <p className="text-xs text-gray-400">Waiting for driver to accept your booking request.</p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-blue-400">✅</span>
                                <span className="font-semibold text-sm">Confirmed</span>
                            </div>
                            <p className="text-xs text-gray-400">Driver has accepted and is on the way to pick you up.</p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-green-400">🎉</span>
                                <span className="font-semibold text-sm">Completed</span>
                            </div>
                            <p className="text-xs text-gray-400">Ride has been completed successfully.</p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-red-400">❌</span>
                                <span className="font-semibold text-sm">Cancelled</span>
                            </div>
                            <p className="text-xs text-gray-400">Booking has been cancelled by you or the driver.</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}