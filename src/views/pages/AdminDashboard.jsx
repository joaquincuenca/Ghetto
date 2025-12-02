// src/views/pages/AdminDashboard.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingService } from '../../services/BookingService';
import NotificationSound from '../../assets/notification.mp3';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [lastBookingCount, setLastBookingCount] = useState(0);
    const [notificationSettings, setNotificationSettings] = useState({
        sound: true,
        desktop: true,
        toast: true,
        autoRefresh: true
    });
    const [isPolling, setIsPolling] = useState(true);
    const [showNotificationSettings, setShowNotificationSettings] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingDetails, setShowBookingDetails] = useState(false);
    
    // New state for selection and deletion
    const [selectedBookings, setSelectedBookings] = useState([]);
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    const audioRef = useRef(null);
    const pollingRef = useRef(null);
    const notificationRef = useRef(null);
    const dropdownRef = useRef(null);

    const adminUsername = localStorage.getItem('adminUsername') || 'Admin';
    

    const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
        const matchesFilter = filter === 'all' || booking.status === filter;
        const matchesSearch = 
            booking.booking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.dropoff_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (booking.user_details?.fullName && booking.user_details.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (booking.user_details?.contactNumber && booking.user_details.contactNumber.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesFilter && matchesSearch;
    });
}, [bookings, filter, searchTerm]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        loadBookings();
        
        // Load notification settings from localStorage
        const savedSettings = localStorage.getItem('notificationSettings');
        if (savedSettings) {
            setNotificationSettings(JSON.parse(savedSettings));
        }

        // Load notification sound
        audioRef.current = new Audio(NotificationSound);
        audioRef.current.volume = 0.5;

        // Start polling for new bookings
        if (notificationSettings.autoRefresh) {
            startPolling();
        }

        // Cleanup on unmount
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Save notification settings to localStorage
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
        
        if (notificationSettings.autoRefresh && !isPolling) {
            startPolling();
        } else if (!notificationSettings.autoRefresh && isPolling) {
            stopPolling();
        }
    }, [notificationSettings]);

    // Reset selection when filter/search changes
    useEffect(() => {
        setSelectedBookings([]);
        setIsSelectAll(false);
    }, [filter, searchTerm]);

    const startPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }
        
        pollingRef.current = setInterval(() => {
            checkForNewBookings();
        }, 10000); // Check every 10 seconds
        
        setIsPolling(true);
    };

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        setIsPolling(false);
    };

    const checkForNewBookings = async () => {
        try {
            const currentCount = bookings.length;
            const data = await BookingService.getAllBookings(100, 0);
            
            if (data.length > currentCount) {
                const newBookings = data.slice(0, data.length - currentCount);
                handleNewBookings(newBookings);
                setBookings(data);
                setLastBookingCount(data.length);
            }
        } catch (err) {
            console.error('Error checking for new bookings:', err);
        }
    };

    const handleNewBookings = (newBookings) => {
        newBookings.reverse().forEach(booking => {
            if (booking.status === 'pending') {
                const customerName = booking.user_details?.fullName || booking.user_details?.name || 'Customer';
                const phoneNumber = booking.user_details?.contactNumber || booking.user_details?.phone || 'No contact';
                
                addNotification({
                    id: Date.now(),
                    type: 'new_booking',
                    title: 'New Booking Request!',
                    message: `Booking #${booking.booking_number} from ${customerName}`,
                    bookingId: booking.id,
                    timestamp: new Date().toISOString(),
                    read: false,
                    details: {
                        customerName,
                        phoneNumber,
                        pickup: booking.pickup_location,
                        dropoff: booking.dropoff_location,
                        fare: booking.fare
                    }
                });
            }
        });
    };

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep only last 10
        
        // Play sound
        if (notificationSettings.sound && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
        
        // Desktop notification
        if (notificationSettings.desktop && "Notification" in window) {
            if (Notification.permission === "granted") {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/favicon.ico',
                    tag: 'new-booking'
                });
            } else if (Notification.permission === "default") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification(notification.title, {
                            body: notification.message,
                            icon: '/favicon.ico'
                        });
                    }
                });
            }
        }
        
        // Browser tab title notification
        if (notificationSettings.toast) {
            showBrowserNotification(notification.title);
        }
    };

    const showBrowserNotification = (message) => {
        const originalTitle = document.title;
        let isBlink = false;
        let blinkInterval;
        
        // Blink effect for tab title
        blinkInterval = setInterval(() => {
            document.title = isBlink ? "" + message : originalTitle;
            isBlink = !isBlink;
        }, 1000);
        
        // Stop blinking after 10 seconds or when window gains focus
        const stopBlinking = () => {
            clearInterval(blinkInterval);
            document.title = originalTitle;
            window.removeEventListener('focus', stopBlinking);
        };
        
        setTimeout(stopBlinking, 10000);
        window.addEventListener('focus', stopBlinking);
    };

    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await BookingService.getAllBookings(100, 0);
            
            // Check for new bookings
            if (lastBookingCount > 0 && data.length > lastBookingCount) {
                const newBookings = data.slice(0, data.length - lastBookingCount);
                handleNewBookings(newBookings);
            }
            
            setBookings(data);
            setLastBookingCount(data.length);
            setSelectedBookings([]);
            setIsSelectAll(false);
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
            
            // Add notification for status change
            if (newStatus === 'confirmed') {
                addNotification({
                    id: Date.now(),
                    type: 'booking_accepted',
                    title: 'Booking Accepted',
                    message: `Booking #${bookingNumber} has been confirmed`,
                    timestamp: new Date().toISOString(),
                    read: false
                });
            } else if (newStatus === 'completed') {
                addNotification({
                    id: Date.now(),
                    type: 'booking_completed',
                    title: 'Booking Completed',
                    message: `Booking #${bookingNumber} has been marked as completed`,
                    timestamp: new Date().toISOString(),
                    read: false
                });
            }
            
            await loadBookings();
        } catch (err) {
            alert('Failed to update booking status');
            console.error(err);
        }
    };

    // Update the handleDeleteBookings function in AdminDashboard.jsx
    const handleDeleteBookings = async () => {
        if (selectedBookings.length === 0) return;
        
        try {
            setDeleteLoading(true);
            
            // Delete selected bookings using bulk delete
            const result = await BookingService.deleteBookings(selectedBookings);
            
            if (result.success) {
                // Add notification
                addNotification({
                    id: Date.now(),
                    type: 'booking_deleted',
                    title: 'Bookings Deleted',
                    message: result.message,
                    timestamp: new Date().toISOString(),
                    read: false
                });
                
                // Refresh bookings
                await loadBookings();
                setSelectedBookings([]);
                setShowDeleteConfirm(false);
            } else {
                throw new Error(result.message || 'Failed to delete bookings');
            }
            
        } catch (err) {
            alert(err.message || 'Failed to delete bookings');
            console.error(err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const viewBookingDetails = (booking) => {
        setSelectedBooking(booking);
        setShowBookingDetails(true);
    };

    // Selection handlers
    const handleSelectBooking = (bookingId) => {
        setSelectedBookings(prev => {
            if (prev.includes(bookingId)) {
                return prev.filter(id => id !== bookingId);
            } else {
                return [...prev, bookingId];
            }
        });
    };

    const handleSelectAll = () => {
        if (isSelectAll) {
            // Deselect all
            setSelectedBookings([]);
        } else {
            // Select all filtered bookings
            const allIds = filteredBookings.map(booking => booking.id);
            setSelectedBookings(allIds);
        }
        setIsSelectAll(!isSelectAll);
    };

    // Check if all filtered bookings are selected
    useEffect(() => {
        if (filteredBookings.length > 0) {
            const allSelected = filteredBookings.every(booking => 
                selectedBookings.includes(booking.id)
            );
            setIsSelectAll(allSelected);
        } else {
            setIsSelectAll(false);
        }
    }, [selectedBookings, filteredBookings]);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

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

    // Format user details for display
    const formatUserDetails = (userDetails) => {
        if (!userDetails) return null;
        
        return {
            name: userDetails.fullName || userDetails.name || 'Not provided',
            contact: userDetails.contactNumber || userDetails.phone || userDetails.contact || 'Not provided'
        };
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
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-red-400">⚠️ Confirm Deletion</h3>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                                disabled={deleteLoading}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-gray-300">
                                Are you sure you want to delete <span className="font-bold text-white">{selectedBookings.length}</span> selected booking(s)?
                            </p>
                            <p className="text-sm text-gray-400">
                                This action cannot be undone. All booking data including customer information will be permanently removed.
                            </p>
                            
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-500 py-3 rounded-xl font-semibold transition-colors"
                                    disabled={deleteLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteBookings}
                                    className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete Selected'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Details Modal */}
            {showBookingDetails && selectedBooking && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Booking Details</h3>
                            <button
                                onClick={() => setShowBookingDetails(false)}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="bg-gray-900 p-4 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Booking Number</p>
                                <p className="font-mono text-blue-400 font-bold text-lg">{selectedBooking.booking_number}</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold mt-2 inline-block ${getStatusColor(selectedBooking.status)}`}>
                                    {selectedBooking.status}
                                </span>
                            </div>

                            <div className="grid gap-3">
                                <div className="bg-gray-900 p-4 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">📍</span>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Pickup Location</p>
                                            <p className="text-sm">{selectedBooking.pickup_location}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-900 p-4 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">🚩</span>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Drop-off Location</p>
                                            <p className="text-sm">{selectedBooking.dropoff_location}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Details */}
                            <div className="bg-gray-900 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">👤</span>
                                    <h4 className="text-sm font-semibold text-gray-300">Customer Details</h4>
                                </div>
                                {selectedBooking.user_details ? (
                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Full Name</p>
                                            <p className="text-sm font-medium">
                                                {selectedBooking.user_details.fullName || selectedBooking.user_details.name || 'Not provided'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Contact Number</p>
                                            <p className="text-sm font-medium">
                                                {selectedBooking.user_details.contactNumber || selectedBooking.user_details.phone || 'Not provided'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No customer details available</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-900 p-4 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">Distance</p>
                                    <p className="font-semibold text-lg">{selectedBooking.distance?.toFixed(2) || '0'} km</p>
                                </div>
                                <div className="bg-gray-900 p-4 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">Fare</p>
                                    <p className="font-semibold text-blue-400 text-lg">₱{selectedBooking.fare?.toFixed(2) || '0'}</p>
                                </div>
                            </div>

                            <div className="bg-gray-900 p-4 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Booked On</p>
                                <p className="text-sm">{new Date(selectedBooking.timestamp || selectedBooking.created_at).toLocaleString()}</p>
                            </div>

                            {/* Action Buttons */}
                            {selectedBooking.status === 'pending' && (
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => {
                                            handleStatusUpdate(selectedBooking.booking_number, 'confirmed');
                                            setShowBookingDetails(false);
                                        }}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition-colors"
                                    >
                                        ✓ Accept Booking
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleStatusUpdate(selectedBooking.booking_number, 'cancelled');
                                            setShowBookingDetails(false);
                                        }}
                                        className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold transition-colors"
                                    >
                                        ✗ Cancel
                                    </button>
                                </div>
                            )}
                            
                            {selectedBooking.status === 'confirmed' && (
                                <div className="pt-4">
                                    <button
                                        onClick={() => {
                                            handleStatusUpdate(selectedBooking.booking_number, 'completed');
                                            setShowBookingDetails(false);
                                        }}
                                        className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-semibold transition-colors"
                                    >
                                        ✓ Mark as Completed
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4 md:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Admin Dashboard</h1>
                            <p className="text-gray-400 text-sm md:text-base">Manage ride bookings • Welcome, {adminUsername}!</p>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Notification Bell */}
                            <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    setShowNotificationSettings(false);
                                }}
                                className="relative p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors touch-manipulation"
                                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                            >
                                <span className="text-xl">🔔</span>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center min-w-[1.5rem]">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                                
                                {/* Notifications Dropdown */}
                                {showNotifications && (
                                    <div className="fixed md:absolute inset-0 md:inset-auto md:right-0 md:mt-2 md:top-full z-50">
                                        <div className="md:max-h-[80vh] h-screen md:h-auto md:w-80 w-full bg-gray-800 border border-gray-700 md:rounded-lg shadow-xl flex flex-col">
                                            {/* Notification header */}
                                            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 sticky top-0">
                                                <h3 className="font-semibold text-base">Notifications</h3>
                                                <div className="flex gap-3">
                                                    {unreadCount > 0 && (
                                                        <button
                                                            onClick={markAllAsRead}
                                                            className="text-blue-400 hover:text-blue-300 px-2 py-1"
                                                        >
                                                            Mark all read
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={clearNotifications}
                                                        className="text-red-400 hover:text-red-300 px-2 py-1"
                                                    >
                                                        Clear all
                                                    </button>
                                                    <button
                                                        onClick={() => setShowNotifications(false)}
                                                        className="md:hidden text-gray-400 hover:text-white"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* Scrollable notifications */}
                                            <div className="flex-1 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-400">
                                                        No notifications
                                                    </div>
                                                ) : (
                                                    notifications.map(notification => (
                                                        <div
                                                            key={notification.id}
                                                            className={`p-4 border-b border-gray-700 hover:bg-gray-750 cursor-pointer ${!notification.read ? 'bg-blue-900/10' : ''}`}
                                                            onClick={() => {
                                                                if (notification.details) {
                                                                    const booking = bookings.find(b => b.id === notification.bookingId);
                                                                    if (booking) {
                                                                        setSelectedBooking(booking);
                                                                        setShowBookingDetails(true);
                                                                    }
                                                                }
                                                                setShowNotifications(false);
                                                            }}
                                                        >
                                                            <div className="flex gap-3">
                                                                <div className="flex-shrink-0">
                                                                    {notification.type === 'new_booking' && (
                                                                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                                                            <span className="text-sm">📌</span>
                                                                        </div>
                                                                    )}
                                                                    {notification.type === 'booking_accepted' && (
                                                                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                                                                            <span className="text-sm">✓</span>
                                                                        </div>
                                                                    )}
                                                                    {notification.type === 'booking_completed' && (
                                                                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                                                                            <span className="text-sm">✅</span>
                                                                        </div>
                                                                    )}
                                                                    {notification.type === 'booking_deleted' && (
                                                                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                                                                            <span className="text-sm">🗑️</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <h4 className="font-semibold text-sm truncate">
                                                                            {notification.title}
                                                                        </h4>
                                                                        {!notification.read && (
                                                                            <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-300 mt-1 break-words">
                                                                        {notification.message}
                                                                    </p>
                                                                    
                                                                    {notification.details && (
                                                                        <div className="mt-3 space-y-1 text-sm text-gray-400">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs">👤</span>
                                                                                <span className="truncate">{notification.details.customerName}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-xs">📞</span>
                                                                                <span>{notification.details.phoneNumber}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    <p className="text-xs text-gray-500 mt-3">
                                                                        {new Date(notification.timestamp).toLocaleTimeString([], { 
                                                                            hour: '2-digit', 
                                                                            minute: '2-digit'
                                                                        })}
                                                                        <span className="mx-2">•</span>
                                                                        {new Date(notification.timestamp).toLocaleDateString([], {
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                            
                            {/* Notification Settings Button */}
                            <button
                                onClick={() => {
                                    setShowNotificationSettings(!showNotificationSettings);
                                    setShowNotifications(false);
                                }}
                                className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                title="Notification Settings"
                            >
                                <span className="text-lg md:text-xl">⚙️</span>
                            </button>
                            
                            <button
                                onClick={handleLogout}
                                className="px-3 py-2 md:px-4 md:py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-sm md:text-base whitespace-nowrap"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 md:p-6">
                {/* Selection Actions Bar */}
                {selectedBookings.length > 0 && (
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                            <span className="text-blue-400 font-semibold">
                                {selectedBookings.length} booking(s) selected
                            </span>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center gap-2"
                            >
                                <span>🗑️</span>
                                Delete Selected
                            </button>
                            <button
                                onClick={() => setSelectedBookings([])}
                                className="flex-1 sm:flex-none px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg font-semibold transition-colors text-sm"
                            >
                                Clear Selection
                            </button>
                        </div>
                    </div>
                )}

                {/* Stats Cards with Auto-refresh Indicator */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
                    <div className="bg-gray-800 p-3 md:p-4 rounded-lg border border-gray-700">
                        <p className="text-gray-400 text-xs md:text-sm">Total Bookings</p>
                        <p className="text-xl md:text-3xl font-bold">{bookings.length}</p>
                    </div>
                    <div className="bg-yellow-900/30 p-3 md:p-4 rounded-lg border border-yellow-700">
                        <p className="text-yellow-400 text-xs md:text-sm">Pending</p>
                        <p className="text-xl md:text-3xl font-bold text-yellow-400">{getStatusCount('pending')}</p>
                    </div>
                    <div className="bg-blue-900/30 p-3 md:p-4 rounded-lg border border-blue-700">
                        <p className="text-blue-400 text-xs md:text-sm">Confirmed</p>
                        <p className="text-xl md:text-3xl font-bold text-blue-400">{getStatusCount('confirmed')}</p>
                    </div>
                    <div className="bg-green-900/30 p-3 md:p-4 rounded-lg border border-green-700">
                        <p className="text-green-400 text-xs md:text-sm">Completed</p>
                        <p className="text-xl md:text-3xl font-bold text-green-400">{getStatusCount('completed')}</p>
                    </div>
                    <div className="bg-purple-900/30 p-3 md:p-4 rounded-lg border border-purple-700 col-span-2 md:col-span-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-400 text-xs md:text-sm">Live Updates</p>
                                <p className="text-xl md:text-3xl font-bold text-purple-400">
                                    {isPolling ? 'ON' : 'OFF'}
                                </p>
                            </div>
                            <button
                                onClick={() => setNotificationSettings(prev => ({
                                    ...prev,
                                    autoRefresh: !prev.autoRefresh
                                }))}
                                className={`p-1 md:p-2 rounded-full ${isPolling ? 'bg-green-600' : 'bg-red-600'}`}
                            >
                                <span className="text-sm md:text-base">{isPolling ? '🔴' : '⚫'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notification Settings Panel - Mobile Dropdown */}
                {showNotificationSettings && (
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
                        <h3 className="font-semibold mb-3 text-sm md:text-base">📢 Notification Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                            <label className="flex items-center gap-2 text-sm md:text-base">
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.sound}
                                    onChange={(e) => setNotificationSettings(prev => ({
                                        ...prev,
                                        sound: e.target.checked
                                    }))}
                                    className="rounded"
                                />
                                <span>Sound Alert</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm md:text-base">
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.desktop}
                                    onChange={(e) => setNotificationSettings(prev => ({
                                        ...prev,
                                        desktop: e.target.checked
                                    }))}
                                    className="rounded"
                                />
                                <span>Desktop Notifications</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm md:text-base">
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.toast}
                                    onChange={(e) => setNotificationSettings(prev => ({
                                        ...prev,
                                        toast: e.target.checked
                                    }))}
                                    className="rounded"
                                />
                                <span>Browser Tab Alert</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm md:text-base">
                                <input
                                    type="checkbox"
                                    checked={notificationSettings.autoRefresh}
                                    onChange={(e) => setNotificationSettings(prev => ({
                                        ...prev,
                                        autoRefresh: e.target.checked
                                    }))}
                                    className="rounded"
                                />
                                <span>Auto-refresh (10s)</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Filters and Search */}
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by booking number, location, or customer name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold transition-colors text-sm md:text-base whitespace-nowrap flex-shrink-0 ${
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
                        <p className="text-red-300 text-sm md:text-base">❌ {error}</p>
                    </div>
                )}

                {/* Bookings Table - Now horizontally scrollable on mobile */}
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="min-w-[1100px]"> {/* Increased minimum width for checkbox column */}
                            <table className="w-full">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap w-10">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelectAll && filteredBookings.length > 0}
                                                    onChange={handleSelectAll}
                                                    className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-600"
                                                    title={isSelectAll ? "Deselect all" : "Select all"}
                                                />
                                            </div>
                                        </th>
                                        <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Booking #</th>
                                        <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Customer</th>
                                        <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Pickup</th>
                                        <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Dropoff</th>
                                        <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Distance</th>
                                        <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Fare</th>
                                        <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Status</th>
                                        <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Date</th>
                                        <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {filteredBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan="10" className="px-4 py-8 text-center text-gray-400 text-sm md:text-base">
                                                No bookings found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBookings.map((booking) => {
                                            const userDetails = formatUserDetails(booking.user_details);
                                            const isSelected = selectedBookings.includes(booking.id);
                                            return (
                                                <tr key={booking.id} className={`hover:bg-gray-750 ${isSelected ? 'bg-blue-900/20' : ''}`}>
                                                    <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap w-10">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectBooking(booking.id)}
                                                            className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-600"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 md:px-4 md:py-3 whitespace-nowrap">
                                                        <button
                                                            onClick={() => viewBookingDetails(booking)}
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
                                                                onClick={() => viewBookingDetails(booking)}
                                                                className="px-2 py-1 md:px-3 md:py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs font-semibold transition-colors whitespace-nowrap"
                                                            >
                                                                View Details
                                                            </button>
                                                            {booking.status === 'pending' && (
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => handleStatusUpdate(booking.booking_number, 'confirmed')}
                                                                        className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold transition-colors whitespace-nowrap"
                                                                    >
                                                                        ✓ Accept
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleStatusUpdate(booking.booking_number, 'cancelled')}
                                                                        className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold transition-colors whitespace-nowrap"
                                                                    >
                                                                        ✗ Cancel
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {booking.status === 'confirmed' && (
                                                                <button
                                                                    onClick={() => handleStatusUpdate(booking.booking_number, 'completed')}
                                                                    className="w-full px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-semibold transition-colors whitespace-nowrap"
                                                                >
                                                                    ✓ Complete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Scroll hint for mobile */}
                <div className="mt-4 text-center text-gray-400 text-sm md:hidden">
                    <p>← Scroll horizontally to view full table →</p>
                </div>

                {/* Refresh Button */}
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
                    <button
                        onClick={loadBookings}
                        className="px-4 py-2 md:px-6 md:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors text-sm md:text-base"
                    >
                        Refresh Bookings
                    </button>
                    <button
                        onClick={() => {
                            if (audioRef.current) {
                                audioRef.current.play();
                            }
                        }}
                        className="px-4 py-2 md:px-6 md:py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors text-sm md:text-base"
                    >
                        Test Notification Sound
                    </button>
                    <button
                        onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                        className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors text-sm md:text-base md:hidden"
                    >
                        Notification Settings
                    </button>
                </div>
            </div>
        </div>
    );
}