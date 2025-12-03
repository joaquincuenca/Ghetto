import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingService } from '../services/BookingService';
import NotificationSound from '../assets/notification.mp3';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function useAdminDashboard() {
    const navigate = useNavigate();
    
    // State
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
    const [selectedBookings, setSelectedBookings] = useState([]);
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    // Chat states
    const [chatMessages, setChatMessages] = useState([]);
    const [newChatMessage, setNewChatMessage] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [activeChatBooking, setActiveChatBooking] = useState(null);

    // Rider assignment states
    const [showAssignRider, setShowAssignRider] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    
    // Refs
    const audioRef = useRef(null);
    const chatAudioRef = useRef(null);
    const pollingRef = useRef(null);
    const dropdownRef = useRef(null);
    const chatMessagesEndRef = useRef(null);
    
    const adminUsername = localStorage.getItem('adminUsername') || 'Admin';
    
    // Memoized filtered bookings
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

    const assignBookingToRider = async (bookingNumber, riderId) => {
        try {
            setAssignLoading(true);
            
            const result = await BookingService.assignBookingToRider(bookingNumber, riderId);
            
            if (result.success) {
                // Add notification
                addNotification({
                    id: Date.now(),
                    type: 'rider_assigned',
                    title: 'Booking Assigned',
                    message: `Booking #${bookingNumber} assigned to rider`,
                    timestamp: new Date().toISOString(),
                    read: false
                });
                
                // Refresh bookings
                await loadBookings();
                setShowAssignRider(false);
            }
        } catch (err) {
            console.error('Error assigning booking:', err);
            alert('Failed to assign booking to rider');
        } finally {
            setAssignLoading(false);
        }
    };

    const unassignBookingFromRider = async (bookingNumber) => {
        try {
            setAssignLoading(true);
            
            const result = await BookingService.unassignBookingFromRider(bookingNumber);
            
            if (result.success) {
                // Add notification
                addNotification({
                    id: Date.now(),
                    type: 'rider_unassigned',
                    title: 'Booking Unassigned',
                    message: `Booking #${bookingNumber} unassigned from rider`,
                    timestamp: new Date().toISOString(),
                    read: false
                });
                
                // Refresh bookings
                await loadBookings();
                setShowAssignRider(false);
            }
        } catch (err) {
            console.error('Error unassigning booking:', err);
            alert('Failed to unassign booking from rider');
        } finally {
            setAssignLoading(false);
        }
    };

    const openAssignRiderModal = (booking) => {
        setSelectedBooking(booking);
        setShowAssignRider(true);
    };
    
    // Initialize
    useEffect(() => {
        loadBookings();
        
        const savedSettings = localStorage.getItem('notificationSettings');
        if (savedSettings) {
            setNotificationSettings(JSON.parse(savedSettings));
        }
        
        audioRef.current = new Audio(NotificationSound);
        audioRef.current.volume = 0.5;
        
        chatAudioRef.current = new Audio('/message-notification.mp3');
        chatAudioRef.current.volume = 0.3;
        
        if (notificationSettings.autoRefresh) {
            startPolling();
        }
        
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);
    
    // Save settings to localStorage
    useEffect(() => {
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
        
        if (notificationSettings.autoRefresh && !isPolling) {
            startPolling();
        } else if (!notificationSettings.autoRefresh && isPolling) {
            stopPolling();
        }
    }, [notificationSettings]);
    
    // Load chat when booking details is shown
    useEffect(() => {
        if (showBookingDetails && selectedBooking) {
            loadChatMessages(selectedBooking.booking_number);
            subscribeToChatMessages(selectedBooking.booking_number);
        }
        
        return () => {
            if (activeChatBooking) {
                supabase.removeChannel(`chat-${activeChatBooking}`);
            }
        };
    }, [showBookingDetails, selectedBooking]);
    
    // Reset selection when filter/search changes
    useEffect(() => {
        setSelectedBookings([]);
        setIsSelectAll(false);
    }, [filter, searchTerm]);
    
    // Update select all state
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
    
    // Scroll chat to bottom
    useEffect(() => {
        scrollChatToBottom();
    }, [chatMessages]);
    
    // Functions
    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await BookingService.getAllBookings(100, 0);
            
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
    
    const startPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
        }
        
        pollingRef.current = setInterval(() => {
            checkForNewBookings();
        }, 10000);
        
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
        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        
        if (notificationSettings.sound && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
        
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
        
        if (notificationSettings.toast) {
            showBrowserNotification(notification.title);
        }
    };
    
    const showBrowserNotification = (message) => {
        const originalTitle = document.title;
        let isBlink = false;
        let blinkInterval;
        
        blinkInterval = setInterval(() => {
            document.title = isBlink ? "" + message : originalTitle;
            isBlink = !isBlink;
        }, 1000);
        
        const stopBlinking = () => {
            clearInterval(blinkInterval);
            document.title = originalTitle;
            window.removeEventListener('focus', stopBlinking);
        };
        
        setTimeout(stopBlinking, 10000);
        window.addEventListener('focus', stopBlinking);
    };
    
    const handleStatusUpdate = async (bookingNumber, newStatus) => {
        try {
            await BookingService.updateBookingStatus(bookingNumber, newStatus);
            
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
    
    const handleDeleteBookings = async () => {
        if (selectedBookings.length === 0) return;
        
        try {
            setDeleteLoading(true);
            
            const result = await BookingService.deleteBookings(selectedBookings);
            
            if (result.success) {
                addNotification({
                    id: Date.now(),
                    type: 'booking_deleted',
                    title: 'Bookings Deleted',
                    message: result.message,
                    timestamp: new Date().toISOString(),
                    read: false
                });
                
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
            setSelectedBookings([]);
        } else {
            const allIds = filteredBookings.map(booking => booking.id);
            setSelectedBookings(allIds);
        }
        setIsSelectAll(!isSelectAll);
    };
    
    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };
    
    const clearNotifications = () => {
        setNotifications([]);
    };
    
    const getStatusCount = (status) => {
        return bookings.filter(b => b.status === status).length;
    };
    
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-600';
            case 'confirmed': return 'bg-blue-600';
            case 'completed': return 'bg-green-600';
            case 'cancelled': return 'bg-red-600';
            case 'assigned': return 'bg-purple-600'; // Add this for assigned status
            default: return 'bg-gray-600';
        }
    };
    
    const formatUserDetails = (userDetails) => {
        if (!userDetails) return null;
        
        return {
            name: userDetails.fullName || userDetails.name || 'Not provided',
            contact: userDetails.contactNumber || userDetails.phone || userDetails.contact || 'Not provided'
        };
    };
    
    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('adminUsername');
        navigate('/admin/login');
    };
    
    const viewBookingDetails = (booking) => {
        setSelectedBooking(booking);
        setShowBookingDetails(true);
    };
    
    // Chat functions
    const loadChatMessages = async (bookingNumber) => {
        if (!bookingNumber) return;
        
        try {
            setChatLoading(true);
            const { data, error } = await supabase
                .from('booking_messages')
                .select('*')
                .eq('booking_number', bookingNumber)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            
            setChatMessages(data || []);
            setActiveChatBooking(bookingNumber);
            
            markChatMessagesAsRead(data);
        } catch (err) {
            console.error('Error loading chat messages:', err);
        } finally {
            setChatLoading(false);
        }
    };
    
    const subscribeToChatMessages = (bookingNumber) => {
        if (!bookingNumber) return;
        
        try {
            const channel = supabase
                .channel(`chat-${bookingNumber}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'booking_messages',
                        filter: `booking_number=eq.${bookingNumber}`
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            setChatMessages(prev => [...prev, payload.new]);
                            
                            if (payload.new.sender_role !== 'admin') {
                                playChatSound();
                            }
                            
                            if (showBookingDetails) {
                                markMessageAsRead(payload.new.id);
                            }
                        }
                    }
                )
                .subscribe();
            
            return () => {
                supabase.removeChannel(channel);
            };
        } catch (err) {
            console.error('Error subscribing to messages:', err);
        }
    };
    
    const sendChatMessage = async () => {
        if (!newChatMessage.trim() || !selectedBooking?.booking_number) return;
        
        try {
            setIsSendingMessage(true);
            
            const messageData = {
                booking_number: selectedBooking.booking_number,
                message: newChatMessage.trim(),
                sender_role: 'admin',
                sender_id: adminUsername,
                is_read: false,
                created_at: new Date().toISOString()
            };
            
            const { error } = await supabase
                .from('booking_messages')
                .insert([messageData]);
            
            if (error) throw error;
            
            setNewChatMessage('');
            scrollChatToBottom();
        } catch (err) {
            console.error('Error sending message:', err);
            throw err;
        } finally {
            setIsSendingMessage(false);
        }
    };
    
    const playChatSound = () => {
        if (chatAudioRef.current) {
            chatAudioRef.current.currentTime = 0;
            chatAudioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
    };
    
    const markChatMessagesAsRead = async (messages) => {
        if (!messages || messages.length === 0) return;
        
        try {
            const unreadMessageIds = messages
                .filter(msg => !msg.is_read && msg.sender_role !== 'admin')
                .map(msg => msg.id);
            
            if (unreadMessageIds.length > 0) {
                const { error } = await supabase
                    .from('booking_messages')
                    .update({ is_read: true })
                    .in('id', unreadMessageIds);
                
                if (error) throw error;
            }
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    };
    
    const markMessageAsRead = async (messageId) => {
        try {
            const { error } = await supabase
                .from('booking_messages')
                .update({ is_read: true })
                .eq('id', messageId);
            
            if (error) throw error;
        } catch (err) {
            console.error('Error marking message as read:', err);
        }
    };
    
    const scrollChatToBottom = () => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    
    const unreadCount = notifications.filter(n => !n.read).length;
    
    return {
        // State
        bookings,
        loading,
        filter,
        searchTerm,
        error,
        notifications,
        showNotifications,
        notificationSettings,
        isPolling,
        showNotificationSettings,
        selectedBooking,
        showBookingDetails,
        selectedBookings,
        isSelectAll,
        showDeleteConfirm,
        deleteLoading,
        chatMessages,
        newChatMessage,
        isSendingMessage,
        chatLoading,
        adminUsername,
        filteredBookings,
        unreadCount,
        showAssignRider,
        assignLoading,
        
        // Refs
        dropdownRef,
        chatMessagesEndRef,
        
        // Setters
        setFilter,
        setSearchTerm,
        setShowNotifications,
        setShowNotificationSettings,
        setSelectedBookings,
        setIsSelectAll,
        setShowDeleteConfirm,
        setShowBookingDetails,
        setNewChatMessage,
        setShowAssignRider,
        
        // Functions
        loadBookings,
        handleStatusUpdate,
        handleDeleteBookings,
        handleSelectBooking,
        handleSelectAll,
        markAllAsRead,
        clearNotifications,
        getStatusCount,
        getStatusColor,
        formatUserDetails,
        handleLogout,
        viewBookingDetails,
        sendChatMessage,
        scrollChatToBottom,
        assignBookingToRider,
        unassignBookingFromRider,
        openAssignRiderModal
    };
}