export default function CancelConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    bookingNumber,
    userDetails,
    isCancelling
    }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-md w-full">
            <div className="text-center mb-6">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2">Cancel Booking?</h3>
            <p className="text-gray-400 text-sm">
                Are you sure you want to cancel booking #{bookingNumber}? This action cannot be undone.
            </p>
            {userDetails && (
                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-300 mb-1">
                    Customer: <span className="font-semibold">{userDetails.name}</span>
                </p>
                <p className="text-sm text-gray-300">
                    Contact: <span className="font-semibold">{userDetails.contact}</span>
                </p>
                </div>
            )}
            </div>
            <div className="flex gap-3">
            <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-semibold transition-colors"
                disabled={isCancelling}
            >
                Go Back
            </button>
            <button
                onClick={onConfirm}
                disabled={isCancelling}
                className="flex-1 bg-red-600 hover:bg-red-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
                {isCancelling ? (
                <>
                    <div className="animate-spin">⟳</div>
                    Cancelling...
                </>
                ) : (
                'Yes, Cancel'
                )}
            </button>
            </div>
        </div>
        </div>
    );
}