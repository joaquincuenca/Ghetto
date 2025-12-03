export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    selectedCount,
    deleteLoading
    }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-red-400">⚠️ Confirm Deletion</h3>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-2xl"
                disabled={deleteLoading}
            >
                ✕
            </button>
            </div>
            
            <div className="space-y-4">
            <p className="text-gray-300">
                Are you sure you want to delete <span className="font-bold text-white">{selectedCount}</span> selected booking(s)?
            </p>
            <p className="text-sm text-gray-400">
                This action cannot be undone. All booking data including customer information will be permanently removed.
            </p>
            
            <div className="flex gap-3 pt-4">
                <button
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-500 py-3 rounded-xl font-semibold transition-colors"
                disabled={deleteLoading}
                >
                Cancel
                </button>
                <button
                onClick={onConfirm}
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
    );
}