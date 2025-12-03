import { useAdminDashboard } from '../../viewmodels/AdminDashboardViewModel';
import NotificationDropdown from '../components/admin/NotificationDropdown';
import BookingDetailsModal from '../components/admin/BookingDetailsModal';
import DeleteConfirmModal from '../components/admin/DeleteConfirmModal';
import BookingTable from '../components/admin/BookingTable';

export default function AdminDashboard() {
    const {
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
        scrollChatToBottom
    } = useAdminDashboard();

    // Loading state
    if (loading) {
        return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-white text-xl">Loading bookings...</div>
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
        {/* Modals */}
        <BookingDetailsModal
            isOpen={showBookingDetails}
            onClose={() => {
            setShowBookingDetails(false);
            }}
            booking={selectedBooking}
            chatMessages={chatMessages}
            newChatMessage={newChatMessage}
            onMessageChange={setNewChatMessage}
            onSendMessage={sendChatMessage}
            isSendingMessage={isSendingMessage}
            chatLoading={chatLoading}
            onStatusUpdate={handleStatusUpdate}
            messagesEndRef={chatMessagesEndRef}
        />

        <DeleteConfirmModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDeleteBookings}
            selectedCount={selectedBookings.length}
            deleteLoading={deleteLoading}
        />

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
                    
                    <NotificationDropdown
                    isOpen={showNotifications}
                    onClose={() => setShowNotifications(false)}
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkAllRead={markAllAsRead}
                    onClearAll={clearNotifications}
                    onNotificationClick={viewBookingDetails}
                    bookings={bookings}
                    />
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

            {/* Stats Cards */}
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

            {/* Notification Settings Panel */}
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

            {/* Bookings Table */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <div className="min-w-[1200px]">
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
                        <th className="px-3 py-2 md:px-4 md:py-3 text-left text-xs md:text-sm font-semibold whitespace-nowrap">Chat</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                    <BookingTable
                        bookings={filteredBookings}
                        selectedBookings={selectedBookings}
                        onSelectBooking={handleSelectBooking}
                        onSelectAll={handleSelectAll}
                        isSelectAll={isSelectAll}
                        onViewDetails={viewBookingDetails}
                        onStatusUpdate={handleStatusUpdate}
                        getStatusColor={getStatusColor}
                        formatUserDetails={formatUserDetails}
                    />
                    </tbody>
                </table>
                </div>
            </div>
            </div>

            {/* Scroll hint for mobile */}
            <div className="mt-4 text-center text-gray-400 text-sm md:hidden">
            <p>← Scroll horizontally to view full table →</p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
            <button
                onClick={loadBookings}
                className="px-4 py-2 md:px-6 md:py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors text-sm md:text-base"
            >
                Refresh Bookings
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