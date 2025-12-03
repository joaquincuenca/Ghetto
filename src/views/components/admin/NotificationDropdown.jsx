import { useEffect, useRef } from 'react';

export default function NotificationDropdown({
    isOpen,
    onClose,
    notifications,
    unreadCount,
    onMarkAllRead,
    onClearAll,
    onNotificationClick,
    bookings
    }) {
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            onClose();
        }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed md:absolute inset-0 md:inset-auto md:right-0 md:mt-2 md:top-full z-50">
        <div className="md:max-h-[80vh] h-screen md:h-auto md:w-80 w-full bg-gray-800 border border-gray-700 md:rounded-lg shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 sticky top-0">
            <h3 className="font-semibold text-base">Notifications</h3>
            <div className="flex gap-3">
                {unreadCount > 0 && (
                <button
                    onClick={onMarkAllRead}
                    className="text-blue-400 hover:text-blue-300 px-2 py-1"
                >
                    Mark all read
                </button>
                )}
                <button
                onClick={onClearAll}
                className="text-red-400 hover:text-red-300 px-2 py-1"
                >
                Clear all
                </button>
                <button
                onClick={onClose}
                className="md:hidden text-gray-400 hover:text-white"
                >
                ✕
                </button>
            </div>
            </div>
            
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
                        onNotificationClick(booking);
                        }
                    }
                    onClose();
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
    );
}