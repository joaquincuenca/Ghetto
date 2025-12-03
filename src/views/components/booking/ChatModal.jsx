import { useEffect } from 'react';

export default function ChatModal({
    isOpen,
    onClose,
    bookingNumber,
    messages,
    newMessage,
    onMessageChange,
    onSendMessage,
    isSending,
    userRole,
    isLoading,
    messagesEndRef
    }) {
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isOpen, messages]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl h-[80vh] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-bold">Chat Support</h3>
                <p className="text-sm text-gray-400">Booking #{bookingNumber}</p>
            </div>
            <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-lg"
            >
                ✕
            </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
                <div className="text-center py-8">
                <div className="animate-spin text-3xl mb-2">⏳</div>
                <p className="text-gray-400">Loading messages...</p>
                </div>
            ) : messages.length === 0 ? (
                <div className="text-center py-8">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-400">No messages yet</p>
                <p className="text-gray-500 text-sm mt-1">
                    Start a conversation about your booking
                </p>
                </div>
            ) : (
                messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex ${message.sender_role === userRole ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                    className={`max-w-[70%] rounded-2xl p-3 ${message.sender_role === userRole
                        ? 'bg-blue-600 rounded-br-none'
                        : message.sender_role === 'admin'
                        ? 'bg-purple-600 rounded-bl-none'
                        : 'bg-gray-700 rounded-bl-none'
                        }`}
                    >
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">
                        {message.sender_role === 'admin' 
                            ? 'Admin' 
                            : message.sender_role === userRole 
                            ? 'You' 
                            : 'Customer'}
                        </span>
                        {!message.is_read && message.sender_role === userRole && (
                        <span className="text-xs text-gray-300">✓</span>
                        )}
                    </div>
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs text-gray-300 mt-2 opacity-70">
                        {new Date(message.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                        })}
                    </p>
                    </div>
                </div>
                ))
            )}
            <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
                <input
                type="text"
                value={newMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
                placeholder="Type your message..."
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSending}
                />
                <button
                onClick={onSendMessage}
                disabled={isSending || !newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                {isSending ? (
                    <>
                    <div className="animate-spin">⟳</div>
                    Sending...
                    </>
                ) : (
                    'Send'
                )}
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
                This chat is associated with Booking #{bookingNumber}
            </p>
            </div>
        </div>
        </div>
    );
}