// src/views/components/BookingLookup.jsx
import { useState } from 'react';
import { BookingViewModel } from '../../viewmodels/BookingViewModel';
import ReceiptModal from './ReceiptModal';

export default function BookingLookup() {
    const [bookingNumber, setBookingNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [booking, setBooking] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const viewModel = new BookingViewModel();

    const handleSearch = async (e) => {
        e.preventDefault();
        
        if (!bookingNumber.trim()) {
            setError('Please enter a booking number');
            return;
        }

        setLoading(true);
        setError('');
        setBooking(null);

        try {
            const foundBooking = await viewModel.fetchBooking(bookingNumber.trim());
            setBooking(foundBooking);
            setShowReceipt(true);
        } catch (err) {
            if (err.message === 'Booking not found') {
                setError('No booking found with this number. Please check and try again.');
            } else {
                setError('Failed to fetch booking. Please try again later.');
            }
            console.error('Booking lookup error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseReceipt = () => {
        setShowReceipt(false);
        setBooking(null);
        setBookingNumber('');
    };

    return (
        <>
            <div className="bg-gray-900 rounded-xl shadow-lg p-6 max-w-md mx-auto">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        🔍 Find Your Booking
                    </h2>
                    <p className="text-gray-400 text-sm">
                        Enter your booking number to view receipt
                    </p>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                    <div>
                        <label htmlFor="bookingNumber" className="block text-sm font-medium text-gray-300 mb-2">
                            Booking Number
                        </label>
                        <input
                            id="bookingNumber"
                            type="text"
                            value={bookingNumber}
                            onChange={(e) => {
                                setBookingNumber(e.target.value.toUpperCase());
                                setError('');
                            }}
                            placeholder="e.g., BK20241202ABCD"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
                            <p className="text-red-300 text-sm">❌ {error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !bookingNumber.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Searching...
                            </>
                        ) : (
                            <>
                                🔍 Search Booking
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-700">
                    <p className="text-xs text-gray-400 text-center">
                        💡 Tip: You can find your booking number on your receipt screenshot
                    </p>
                </div>
            </div>

            {booking && (
                <ReceiptModal
                    show={showReceipt}
                    booking={booking}
                    pickupText={booking.pickup.name}
                    dropoffText={booking.dropoff.name}
                    onClose={handleCloseReceipt}
                />
            )}
        </>
    );
}