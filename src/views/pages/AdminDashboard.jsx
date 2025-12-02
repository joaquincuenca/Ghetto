// src/views/pages/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingService } from '../../services/BookingService';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, completed, cancelled
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    const adminUsername = localStorage.getItem('adminUsername') || 'Admin';

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await BookingService.getAllBookings(100, 0);
            setBookings(data);
            setError(null);
        } catch (err) {
            setError('Failed to load bookings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (bookingNumber, newStatus) => {
        try {
            await BookingService.updateBookingStatus(bookingNumber, newStatus);
            // Refresh bookings
            await loadBookings();
        } catch (err) {
            alert('Failed to update booking status');
            console.error(err);
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesFilter = filter === 'all' || booking.status === filter;
        const matchesSearch = 
            booking.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.dropoff_location.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-600';
            case 'confirmed': return 'bg-blue-600';
            case 'completed': return 'bg-green-600';
            case 'cancelled': return 'bg-red-600';
            default: return 'bg-gray-600';
        }
    };

    const getStatusCount = (status) => {
        return bookings.filter(b => b.status === status).length;
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminUsername');
        navigate('/admin/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading bookings...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-6">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                        <p className="text-gray-400">Manage ride bookings • Welcome, {adminUsername}!</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-sm">Total Bookings</p>
                        <p className="text-3xl font-bold">{bookings.length}</p>
                    </div>
                    <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-700">
                        <p className="text-yellow-400 text-sm">Pending</p>
                        <p className="text-3xl font-bold text-yellow-400">{getStatusCount('pending')}</p>
                    </div>
                    <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700">
                        <p className="text-blue-400 text-sm">Confirmed</p>
                        <p className="text-3xl font-bold text-blue-400">{getStatusCount('confirmed')}</p>
                    </div>
                    <div className="bg-green-900/30 p-4 rounded-lg border border-green-700">
                        <p className="text-green-400 text-sm">Completed</p>
                        <p className="text-3xl font-bold text-green-400">{getStatusCount('completed')}</p>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="🔍 Search by booking number or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                        filter === status
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
                        <p className="text-red-300">❌ {error}</p>
                    </div>
                )}

                {/* Bookings Table */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Booking #</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Pickup</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Dropoff</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Distance</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Fare</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                                            No bookings found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((booking) => (
                                        <tr key={booking.id} className="hover:bg-gray-750">
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-sm text-blue-400">
                                                    {booking.booking_number}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {booking.pickup_location}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {booking.dropoff_location}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {booking.distance.toFixed(2)} km
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold">
                                                ₱{booking.fare.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)} text-white`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-400">
                                                {new Date(booking.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    {booking.status === 'pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(booking.booking_number, 'confirmed')}
                                                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold transition-colors"
                                                            >
                                                                ✓ Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(booking.booking_number, 'cancelled')}
                                                                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold transition-colors"
                                                            >
                                                                ✗ Cancel
                                                            </button>
                                                        </>
                                                    )}
                                                    {booking.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => handleStatusUpdate(booking.booking_number, 'completed')}
                                                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-semibold transition-colors"
                                                        >
                                                            ✓ Complete
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

                {/* Refresh Button */}
                <div className="mt-6 text-center">
                    <button
                        onClick={loadBookings}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                    >
                        🔄 Refresh Bookings
                    </button>
                </div>
            </div>
        </div>
    );
}