import { useEffect } from 'react';

export default function BookingDetailsModal({
    isOpen,
    onClose,
    booking,
    chatMessages,
    newChatMessage,
    onMessageChange,
    onSendMessage,
    isSendingMessage,
    chatLoading,
    onStatusUpdate,
    messagesEndRef
    }) {
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isOpen, chatMessages]);

    if (!isOpen || !booking) return null;

    const getStatusColor = (status) => {
        switch (status) {
        case 'pending': return 'bg-yellow-600';
        case 'confirmed': return 'bg-blue-600';
        case 'completed': return 'bg-green-600';
        case 'cancelled': return 'bg-red-600';
        default: return 'bg-gray-600';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Booking Details & Chat</h3>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl"
            >
                ✕
            </button>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
            {/* Left Column - Booking Details */}
            <div className="lg:w-1/2 flex flex-col space-y-4 overflow-y-auto">
                <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Booking Number</p>
                <p className="font-mono text-blue-400 font-bold text-lg">{booking.booking_number}</p>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold mt-2 inline-block ${getStatusColor(booking.status)}`}>
                    {booking.status}
                </span>
                </div>

                <div className="grid gap-3">
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

                {/* Customer Details */}
                <div className="bg-gray-900 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">👤</span>
                    <h4 className="text-sm font-semibold text-gray-300">Customer Details</h4>
                </div>
                {booking.user_details ? (
                    <div className="space-y-2">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Full Name</p>
                        <p className="text-sm font-medium">
                        {booking.user_details.fullName || booking.user_details.name || 'Not provided'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Contact Number</p>
                        <p className="text-sm font-medium">
                        {booking.user_details.contactNumber || booking.user_details.phone || 'Not provided'}
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
                    <p className="font-semibold text-lg">{booking.distance?.toFixed(2) || '0'} km</p>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Fare</p>
                    <p className="font-semibold text-blue-400 text-lg">₱{booking.fare?.toFixed(2) || '0'}</p>
                </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Booked On</p>
                <p className="text-sm">{new Date(booking.timestamp || booking.created_at).toLocaleString()}</p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                {booking.status === 'pending' && (
                    <>
                    <button
                        onClick={() => {
                        onStatusUpdate(booking.booking_number, 'confirmed');
                        onClose();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition-colors"
                    >
                        ✓ Accept Booking
                    </button>
                    <button
                        onClick={() => {
                        onStatusUpdate(booking.booking_number, 'cancelled');
                        onClose();
                        }}
                        className="bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold transition-colors"
                    >
                        ✗ Cancel
                    </button>
                    </>
                )}
                
                {booking.status === 'confirmed' && (
                    <button
                    onClick={() => {
                        onStatusUpdate(booking.booking_number, 'completed');
                        onClose();
                    }}
                    className="col-span-2 bg-green-600 hover:bg-green-700 py-3 rounded-xl font-semibold transition-colors"
                    >
                    ✓ Mark as Completed
                    </button>
                )}
                </div>
            </div>

            {/* Right Column - Chat */}
            <div className="lg:w-1/2 flex flex-col border-l border-gray-700 lg:pl-6">
                <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">💬</span>
                <h4 className="text-lg font-bold">Chat with Customer</h4>
                </div>
                
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto bg-gray-900 rounded-lg p-4 mb-4">
                {chatLoading ? (
                    <div className="text-center py-8">
                    <div className="animate-spin text-3xl mb-2">⏳</div>
                    <p className="text-gray-400">Loading messages...</p>
                    </div>
                ) : chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="text-gray-400">No messages yet</p>
                    <p className="text-gray-500 text-sm mt-1">
                        Start a conversation with the customer
                    </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                    {chatMessages.map((message) => (
                        <div
                        key={message.id}
                        className={`flex ${message.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                        <div
                            className={`max-w-[80%] rounded-2xl p-3 ${message.sender_role === 'admin'
                            ? 'bg-blue-600 rounded-br-none'
                            : 'bg-gray-700 rounded-bl-none'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">
                                {message.sender_role === 'admin' ? 'You' : 'Customer'}
                            </span>
                            {!message.is_read && message.sender_role === 'admin' && (
                                <span className="text-xs text-gray-300">✓</span>
                            )}
                            </div>
                            <p className="text-sm break-words">{message.message}</p>
                            <p className="text-xs text-gray-300 mt-2 opacity-70">
                            {new Date(message.created_at).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                            </p>
                        </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                    </div>
                )}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-700 pt-4">
                <div className="flex gap-2">
                    <input
                    type="text"
                    value={newChatMessage}
                    onChange={(e) => onMessageChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
                    placeholder="Type your message to customer..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSendingMessage}
                    />
                    <button
                    onClick={onSendMessage}
                    disabled={isSendingMessage || !newChatMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                    {isSendingMessage ? (
                        <>
                        <div className="animate-spin">⟳</div>
                        Sending...
                        </>
                    ) : (
                        'Send'
                    )}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Chat is associated with Booking #{booking.booking_number}
                </p>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
}