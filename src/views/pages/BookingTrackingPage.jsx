import { useBookingTracking } from '../../viewmodels/BookingTrackingViewModel';
import ChatModal from '../components/booking/ChatModal';
import CancelConfirmModal from '../components/booking/CancelConfirmModal';
import StatusCard from '../components/booking/StatusCard';
import BookingDetailsCard from '../components/booking/BookingDetailsCard';
import ProgressSteps from '../components/booking/ProgressSteps';
import StatusBadge from '../components/booking/StatusBadge';

export default function BookingTrackingPage() {
    const {
        // State
        booking,
        loading,
        error,
        isRefreshing,
        autoRefresh,
        isCancelling,
        showCancelConfirm,
        lastStatus,
        statusUpdateTime,
        messages,
        newMessage,
        isSendingMessage,
        showChat,
        unreadCount,
        chatLoading,
        userRole,
        statusChangedRef,
        messagesEndRef,
        
        // Actions
        setAutoRefresh,
        setShowCancelConfirm,
        setShowChat,
        setNewMessage,
        
        // Functions
        loadBooking,
        sendMessage,
        handleCancelBooking,
        getStatusIcon,
        getStatusMessage,
        getEstimatedTime,
        formatUserDetails,
        retryLoading,
        
        // Navigation
        navigate,
        bookingNumber
    } = useBookingTracking();

    // Loading state
    if (loading) {
        return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-white text-xl">Loading booking...</p>
            <p className="text-gray-400 mt-2">#{bookingNumber}</p>
            <button
                onClick={retryLoading}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
            >
                Retry Loading
            </button>
            </div>
        </div>
        );
    }

    // Error state
    if (error || !booking) {
        return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md w-full text-center border border-gray-700">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-2">
                {error ? 'Error Loading Booking' : 'Booking Not Found'}
            </h2>
            <p className="text-gray-400 mb-4">
                {error || 'The booking could not be loaded.'}
            </p>
            <p className="text-gray-500 text-sm mb-6">Booking #: {bookingNumber}</p>
            <div className="flex gap-3 justify-center">
                <button
                onClick={retryLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                >
                Try Again
                </button>
                <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                >
                Back to Home
                </button>
            </div>
            </div>
        </div>
        );
    }

    const canCancel = ['pending', 'confirmed'].includes(booking.status);
    const userDetails = formatUserDetails(booking?.user_details);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
        {/* Chat Modal */}
        <ChatModal
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            bookingNumber={bookingNumber}
            messages={messages}
            newMessage={newMessage}
            onMessageChange={setNewMessage}
            onSendMessage={sendMessage}
            isSending={isSendingMessage}
            userRole={userRole}
            isLoading={chatLoading}
            messagesEndRef={messagesEndRef}
        />

        {/* Cancel Confirmation Modal */}
        <CancelConfirmModal
            isOpen={showCancelConfirm}
            onClose={() => setShowCancelConfirm(false)}
            onConfirm={handleCancelBooking}
            bookingNumber={bookingNumber}
            userDetails={userDetails}
            isCancelling={isCancelling}
        />

        {/* Floating Chat Button */}
        <button
            onClick={() => setShowChat(true)}
            className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-40 group"
        >
            <span className="text-2xl">💬</span>
            {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {unreadCount}
            </span>
            )}
            <span className="absolute right-16 bg-gray-800 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Chat Support
            </span>
        </button>

        <div className="max-w-2xl mx-auto py-8">
            {/* Header */}
            <div className="text-center mb-8 relative">
            <div className="absolute top-0 right-0 flex items-center gap-2">
                <button
                onClick={() => setShowChat(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-700 text-sm transition-colors relative"
                >
                <span className="text-lg">💬</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                    </span>
                )}
                </button>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">Track Your Booking</h1>
            <p className="text-gray-400">Real-time updates on your ride</p>
            <p className="text-blue-400 font-mono text-sm mt-1">#{bookingNumber}</p>
            </div>

            {/* Status Change Notification */}
            {statusChangedRef.current && (
            <div className="mb-6 animate-fade-in">
                <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                    <p className="font-semibold">Status Updated!</p>
                    <p className="text-sm text-gray-300">
                        Your booking is now <span className="font-semibold capitalize">{booking.status}</span>
                    </p>
                    </div>
                </div>
                <button
                    onClick={() => statusChangedRef.current = false}
                    className="text-gray-400 hover:text-white"
                >
                    ✕
                </button>
                </div>
            </div>
            )}

            {/* Status Card with Progress Steps */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden mb-6">
            <StatusCard
                status={booking.status}
                getStatusIcon={getStatusIcon}
                getStatusMessage={getStatusMessage}
                getEstimatedTime={getEstimatedTime}
            />
            <ProgressSteps status={booking.status} />
            
            {statusUpdateTime && (
                <div className="px-6 pb-6">
                <div className="text-center text-sm text-gray-500">
                    Last updated: {new Date(statusUpdateTime).toLocaleTimeString()}
                </div>
                </div>
            )}
            </div>

            {/* Booking Details */}
            <BookingDetailsCard booking={booking} userDetails={userDetails} />

            {/* Action Buttons */}
            <div className="flex flex-col gap-4">
            {/* Cancel Button */}
            {canCancel && (
                <button
                onClick={() => setShowCancelConfirm(true)}
                disabled={isCancelling}
                className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                {isCancelling ? (
                    <>
                    <div className="animate-spin">⟳</div>
                    Cancelling...
                    </>
                ) : (
                    <>
                    <span className="text-xl">✕</span>
                    Cancel Booking
                    </>
                )}
                </button>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                ← Back to Home
                </button>
                <button
                onClick={loadBooking}
                disabled={isRefreshing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                {isRefreshing ? (
                    <>
                    <div className="animate-spin">⟳</div>
                    Refreshing...
                    </>
                ) : (
                    'Refresh Now'
                )}
                </button>
            </div>
            </div>
        </div>

        <style>{`
            @keyframes fade-in {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
            }
            .animate-fade-in {
            animation: fade-in 0.3s ease-out;
            }
        `}</style>
        </div>
    );
}