import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiderBookingService } from '../services/RiderBookingService';
import { RiderAuthService } from '../services/RiderAuthService';
import { supabase } from '../utils/supabaseClient';

export function useRiderDashboard() {
    const navigate = useNavigate();
    const [rider, setRider] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        active: 0,
        cancelled: 0,
        thisMonth: 0,
        completionRate: 0
    });
    const [filter, setFilter] = useState('active');
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showBookingDetails, setShowBookingDetails] = useState(false); // CHANGED FROM showRiderBookingDetails
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [location, setLocation] = useState(null);
    const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    
    const pollingRef = useRef(null);
    const locationWatchRef = useRef(null);
    
    useEffect(() => {
        // Check authentication
        const riderData = RiderAuthService.getCurrentRider();
        if (!riderData) {
            navigate('/rider/login');
            return;
        }
        
        setRider(riderData);
        loadDashboardData();
        
        // Start auto-refresh
        if (autoRefresh) {
            startPolling();
        }
        
        // Start location tracking
        startLocationTracking();
        
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
            if (locationWatchRef.current) {
                navigator.geolocation.clearWatch(locationWatchRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (autoRefresh) {
            startPolling();
        } else {
            stopPolling();
        }
    }, [autoRefresh]);

    const loadDashboardData = async () => {
        try {
            setIsRefreshing(true);
            const riderData = RiderAuthService.getCurrentRider();
            
            // Load bookings
            const bookingsData = await RiderBookingService.getRiderAssignedBookings(riderData.id);
            setBookings(bookingsData);
            
            // Load stats
            const statsData = await RiderBookingService.getRiderStats(riderData.id);
            setStats(statsData);
            
            setError(null);
        } catch (err) {
            console.error('Error loading dashboard:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };
    
    const startPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }
        
        pollingRef.current = setInterval(() => {
            if (!isRefreshing) {
                loadDashboardData();
            }
        }, 10000); // 10 seconds
    };
    
    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };
    
    const startLocationTracking = () => {
        if ('geolocation' in navigator && rider) {
            locationWatchRef.current = navigator.geolocation.watchPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ lat: latitude, lng: longitude });
                    
                    // Update location in database
                    try {
                        setIsUpdatingLocation(true);
                        await updateRiderLocation(rider.id, latitude, longitude);
                    } catch (err) {
                        console.error('Error updating location:', err);
                    } finally {
                        setIsUpdatingLocation(false);
                    }
                },
                (error) => {
                    console.error('Error getting location:', error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 30000,
                    timeout: 27000
                }
            );
        }
    };

    const updateRiderLocation = async (riderId, lat, lng) => {
        try {
            const { error } = await supabase
                .from('rider_locations')
                .insert({
                    rider_id: riderId,
                    latitude: lat,
                    longitude: lng,
                    timestamp: new Date().toISOString()
                });
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating rider location:', error);
            throw error;
        }
    };
    
    // In your handleAcceptBooking function:
    const handleAcceptBooking = async (bookingNumber) => {
        try {
            console.log('🏍️ ViewModel: Accepting/Starting ride for:', bookingNumber);
            setActionLoading(true);
            
            // Get current rider
            const riderData = RiderAuthService.getCurrentRider();
            
            // Check current booking status
            const { data: currentBooking } = await supabase
                .from('bookings')
                .select('status')
                .eq('booking_number', bookingNumber)
                .single();
            
            console.log('📋 Current booking status:', currentBooking?.status);
            
            let result;
            if (currentBooking?.status === 'assigned') {
                // If assigned, update to confirmed
                result = await RiderBookingService.updateBookingStatus(bookingNumber, 'confirmed');
            } else if (currentBooking?.status === 'confirmed') {
                // If already confirmed, start the ride (update to in_progress)
                result = await RiderBookingService.startRide(bookingNumber, riderData.id);
            } else {
                throw new Error(`Cannot accept booking with status: ${currentBooking?.status}`);
            }
            
            console.log('📊 Service result:', result);
            
            if (result.success) {
                // Refresh data
                await loadDashboardData();
                setShowBookingDetails(false);
                
                if (currentBooking?.status === 'confirmed') {
                    alert('Ride started! Customer can now track your location.');
                } else {
                    alert('Booking accepted!');
                }
            } else {
                throw new Error(result.message || 'Failed to accept/start booking');
            }
        } catch (err) {
            console.error('❌ Error accepting/starting booking:', err);
            alert('Failed to accept/start booking: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusUpdate = async (bookingNumber, status) => { // ADDED THIS FUNCTION
        try {
            setActionLoading(true);
            const result = await RiderBookingService.updateBookingStatus(bookingNumber, status);
            
            if (result.success) {
                // Refresh data
                await loadDashboardData();
                if (status === 'completed') {
                    alert('Booking marked as completed!');
                }
            } else {
                throw new Error(result.message || `Failed to update booking to ${status}`);
            }
        } catch (err) {
            console.error(`Error updating booking to ${status}:`, err);
            alert(`Failed to update booking: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

        const handleCompleteBooking = async (bookingNumber) => {
            try {
                setActionLoading(true);
                console.log('📊 Completing booking:', bookingNumber);
                
                const result = await RiderBookingService.updateBookingStatus(bookingNumber, 'completed');
                
                if (result.success) {
                    // Refresh data
                    await loadDashboardData();
                    setShowBookingDetails(false);
                    alert('Booking marked as completed!');
                } else {
                    throw new Error(result.message || 'Failed to complete booking');
                }
            } catch (err) {
                console.error('Error completing booking:', err);
                alert('Failed to complete booking: ' + err.message);
            } finally {
                setActionLoading(false);
            }
        };

    const handleCancelBooking = async (bookingNumber) => {
        if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
            return;
        }
        
        try {
            setActionLoading(true);
            const result = await RiderBookingService.updateBookingStatus(bookingNumber, 'cancelled');
            
            if (result.success) {
                // Refresh data
                await loadDashboardData();
                setShowBookingDetails(false); // CHANGED
                alert('Booking cancelled.');
            } else {
                throw new Error(result.message || 'Failed to cancel booking');
            }
        } catch (err) {
            console.error('Error cancelling booking:', err);
            alert('Failed to cancel booking: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleLogout = () => {
        RiderAuthService.logout();
        navigate('/rider/login');
    };
    
    const viewBookingDetails = (booking) => {
        console.log('📋 Viewing booking details:', booking.booking_number); // DEBUG
        setSelectedBooking(booking);
        setShowBookingDetails(true);
    };
    
    const closeBookingDetails = () => { // ADDED THIS FUNCTION
        console.log('❌ Closing booking details'); // DEBUG
        setShowBookingDetails(false);
        setSelectedBooking(null);
    };
    
    const filteredBookings = bookings.filter(booking => {
        if (filter === 'all') return true;
        if (filter === 'active') return booking.status === 'confirmed' || booking.status === 'assigned';
        if (filter === 'pending') return booking.status === 'pending';
        if (filter === 'completed') return booking.status === 'completed';
        if (filter === 'cancelled') return booking.status === 'cancelled';
        return true;
    });
    
    const refreshData = () => {
        setIsRefreshing(true);
        loadDashboardData();
    };
    
    return {
        // State
        rider,
        bookings,
        loading,
        error,
        stats,
        filter,
        selectedBooking,
        showBookingDetails, // CHANGED FROM showRiderBookingDetails
        isRefreshing,
        autoRefresh,
        location,
        isUpdatingLocation,
        actionLoading,
        filteredBookings,
        
        // Setters
        setFilter,
        setAutoRefresh,
        setShowBookingDetails: setShowBookingDetails, // CHANGED
        
        // Functions
        handleLogout,
        handleAcceptBooking,
        handleCompleteBooking,
        handleCancelBooking,
        handleStatusUpdate, // ADDED
        viewBookingDetails,
        closeBookingDetails, // ADDED
        refreshData
    };
}