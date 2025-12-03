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
    const [showBookingDetails, setShowBookingDetails] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [location, setLocation] = useState(null);
    const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    
    const pollingRef = useRef(null);
    const locationWatchRef = useRef(null);
    
    useEffect(() => {
        const riderData = RiderAuthService.getCurrentRider();
        if (!riderData) {
            navigate('/rider/login');
            return;
        }
        
        setRider(riderData);
        loadDashboardData();
        
        if (autoRefresh) {
            startPolling();
        }
        
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
            
            const bookingsData = await RiderBookingService.getRiderAssignedBookings(riderData.id);
            setBookings(bookingsData);
            
            const statsData = await RiderBookingService.getRiderStats(riderData.id);
            setStats(statsData);
            
            setError(null);
        } catch (err) {
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
        }, 10000);
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
                    
                    try {
                        setIsUpdatingLocation(true);
                        await updateRiderLocation(rider.id, latitude, longitude);
                    } catch (err) {
                        // Silently fail for location updates
                    } finally {
                        setIsUpdatingLocation(false);
                    }
                },
                () => {
                    // Silently handle location errors
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
            throw error;
        }
    };
    
    const handleAcceptBooking = async (bookingNumber) => {
        try {
            setActionLoading(true);
            
            const riderData = RiderAuthService.getCurrentRider();
            
            const { data: currentBooking } = await supabase
                .from('bookings')
                .select('status')
                .eq('booking_number', bookingNumber)
                .single();
            let result;
            if (currentBooking?.status === 'assigned') {
                result = await RiderBookingService.updateBookingStatus(bookingNumber, 'confirmed');
            } else if (currentBooking?.status === 'confirmed') {
                result = await RiderBookingService.startRide(bookingNumber, riderData.id);
            } else {
                throw new Error(`Cannot accept booking with status: ${currentBooking?.status}`);
            }
            
            if (result.success) {
                await loadDashboardData();
                setShowBookingDetails(false);
            } else {
                throw new Error(result.message || 'Failed to accept/start booking');
            }
        } catch (err) {
            // Error is already handled by setError state or can be displayed in UI
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusUpdate = async (bookingNumber, status) => {
        try {
            setActionLoading(true);
            const result = await RiderBookingService.updateBookingStatus(bookingNumber, status);
            
            if (result.success) {
                await loadDashboardData();
            } else {
                throw new Error(result.message || `Failed to update booking to ${status}`);
            }
        } catch (err) {
            // Error is already handled by setError state or can be displayed in UI
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteBooking = async (bookingNumber) => {
        try {
            setActionLoading(true);
            
            const result = await RiderBookingService.updateBookingStatus(bookingNumber, 'completed');
            
            if (result.success) {
                await loadDashboardData();
                setShowBookingDetails(false);
            } else {
                throw new Error(result.message || 'Failed to complete booking');
            }
        } catch (err) {
            // Error is already handled by setError state or can be displayed in UI
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelBooking = async (bookingNumber) => {
        try {
            setActionLoading(true);
            const result = await RiderBookingService.updateBookingStatus(bookingNumber, 'cancelled');
            
            if (result.success) {
                await loadDashboardData();
                setShowBookingDetails(false);
            } else {
                throw new Error(result.message || 'Failed to cancel booking');
            }
        } catch (err) {
            // Error is already handled by setError state or can be displayed in UI
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleLogout = () => {
        RiderAuthService.logout();
        navigate('/rider/login');
    };
    
    const viewBookingDetails = (booking) => {
        setSelectedBooking(booking);
        setShowBookingDetails(true);
    };
    
    const closeBookingDetails = () => {
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
        actionLoading,
        filteredBookings,
        
        setFilter,
        setAutoRefresh,
        setShowBookingDetails,
        
        handleLogout,
        handleAcceptBooking,
        handleCompleteBooking,
        handleCancelBooking,
        handleStatusUpdate,
        viewBookingDetails,
        closeBookingDetails,
        refreshData
    };
}