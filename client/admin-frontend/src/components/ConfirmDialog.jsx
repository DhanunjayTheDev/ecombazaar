import { AlertCircle, Trash2, X } from 'lucide-react';

export default function ConfirmDialog({ 
  isOpen, 
  title = 'Confirm Action', 
  message = 'Are you sure?', 
  onConfirm, 
  onCancel, 
  confirmText = 'Delete', 
  cancelText = 'Cancel', 
  isDangerous = false,
  isLoading = false 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center gap-3 ${isDangerous ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'}`}>
          {isDangerous ? (
            <Trash2 size={20} className="text-red-500 shrink-0" />
          ) : (
            <AlertCircle size={20} className="text-orange-500 shrink-0" />
          )}
          <h2 className={`font-bold text-lg ${isDangerous ? 'text-red-900' : 'text-orange-900'}`}>{title}</h2>
        </div>

        {/* Message */}
        <div className="px-6 py-4">
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 border border-gray-200 rounded-xl py-2.5 font-medium text-gray-700 hover:bg-gray-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-xl py-2.5 font-medium text-white transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              isDangerous
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
