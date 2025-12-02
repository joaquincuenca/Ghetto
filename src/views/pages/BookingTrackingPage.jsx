// src/views/pages/BookingTrackingPage.jsx
import { useState, useEffect } from 'react';
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

    useEffect(() => {
        if (bookingNumber) {
            loadBooking();
            subscribeToUpdates();
        }
    }, [bookingNumber]);

    const loadBooking = async () => {
        try {
            setLoading(true);
            const data = await BookingService.getBookingByNumber(bookingNumber);
            setBooking(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToUpdates = () => {
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
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin text-6xl mb-4">⏳</div>
                    <p className="text-white text-xl">Loading booking...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full text-center border border-gray-700">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Booking Not Found</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
            <div className="max-w-2xl mx-auto py-8">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Track Your Booking</h1>
                    <p className="text-gray-400">Real-time updates on your ride</p>
                </div>

                {/* Status Card */}
                <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden mb-6">
                    <div className={`p-6 text-center ${
                        booking.status === 'pending' ? 'bg-yellow-900/30' :
                        booking.status === 'confirmed' ? 'bg-blue-900/30' :
                        booking.status === 'completed' ? 'bg-green-900/30' :
                        'bg-red-900/30'
                    }`}>
                        <div className="text-7xl mb-4">
                            {booking.status === 'pending' && '⏳'}
                            {booking.status === 'confirmed' && '✅'}
                            {booking.status === 'completed' && '🎉'}
                            {booking.status === 'cancelled' && '❌'}
                        </div>
                        <h2 className="text-2xl font-bold mb-2 capitalize">
                            {booking.status}
                        </h2>
                        <p className="text-gray-300">
                            {booking.status === 'pending' && 'Waiting for driver to accept...'}
                            {booking.status === 'confirmed' && 'Driver has accepted!'}
                            {booking.status === 'completed' && 'Ride completed. Thank you!'}
                            {booking.status === 'cancelled' && 'Booking cancelled.'}
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="p-6 relative">

                        {/* Steps Container */}
                        <div className="relative z-10">
                            {/* Steps */}
                            <div className="flex justify-between items-center mb-2">
                                {/* Step 1 */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                    ['pending', 'confirmed', 'completed'].includes(booking.status)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-400'
                                }`}>1</div>

                                {/* Step 2 */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                    ['confirmed', 'completed'].includes(booking.status)
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-400'
                                }`}>2</div>

                                {/* Step 3 */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                                    booking.status === 'completed'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-400'
                                }`}>3</div>
                            </div>

                            {/* Labels */}
                            <div className="flex justify-between text-xs text-gray-400">
                                <span className="text-left w-10">Pending</span>
                                <span className="text-center w-10">Confirmed</span>
                                <span className="text-right w-10">Completed</span>
                            </div>
                        </div>

                        {/* Background Line Container */}
                        <div className="absolute top-10 left-6 right-6 h-1 -z-0">
                            {/* Background Line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gray-700"></div>
                            
                            {/* Active Progress Line */}
                            <div
                                className={`absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-500 ${
                                    booking.status === 'pending' ? 'w-0' :
                                    booking.status === 'confirmed' ? 'w-1/2' :
                                    booking.status === 'completed' ? 'w-full' : 'w-0'
                                }`}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Booking Details */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">Booking Details</h3>

                    <div className="space-y-4">
                        <div className="bg-gray-900 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Booking Number</p>
                            <p className="font-mono text-blue-400 font-bold">{booking.booking_number}</p>
                        </div>

                        <div className="bg-gray-900 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">📍 Pickup Location</p>
                            <p className="text-sm">{booking.pickup_location}</p>
                        </div>

                        <div className="bg-gray-900 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">🚩 Drop-off Location</p>
                            <p className="text-sm">{booking.dropoff_location}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-900 p-3 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Distance</p>
                                <p className="font-semibold">{booking.distance.toFixed(2)} km</p>
                            </div>
                            <div className="bg-gray-900 p-3 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Fare</p>
                                <p className="font-semibold text-blue-400">₱{booking.fare.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="bg-gray-900 p-3 rounded-lg">
                            <p className="text-xs text-gray-400 mb-1">Booked On</p>
                            <p className="text-sm">{new Date(booking.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold transition-colors"
                    >
                        Back to Home
                    </button>
                    <button
                        onClick={loadBooking}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                {/* Live Indicator */}
                <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full border border-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm text-gray-400">Live updates enabled</span>
                    </div>
                </div>
            </div>
        </div>
    );
}