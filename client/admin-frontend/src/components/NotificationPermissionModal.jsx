import { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2 } from 'lucide-react';
import { requestNotificationPermission, notificationExamples } from '../utils/notifications';

export default function NotificationPermissionModal() {
  const [showModal, setShowModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if notifications are supported and not already granted
    if ('Notification' in window && Notification.permission === 'default') {
      // Show modal after admin has spent some time on the site
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    setIsRequesting(true);
    const granted = await requestNotificationPermission();
    setIsRequesting(false);
    
    if (granted) {
      setShowModal(false);
      // Optionally show a success message
    } else {
      setShowModal(false);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4 pt-24">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 hover:bg-orange-400 rounded-lg transition"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Bell size={24} />
            </div>
            <h2 className="text-xl font-bold">Stay in the Loop!</h2>
          </div>
          <p className="text-orange-100 text-sm">Get real-time notifications about your store</p>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-700 font-medium mb-4">
            You'll receive alerts for:
          </p>

          <div className="space-y-2 mb-6">
            {notificationExamples.map((example, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span>{example}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 text-center mb-6">
            You can disable notifications anytime from your browser settings
          </p>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 text-gray-700 font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition"
          >
            Not Now
          </button>
          <button
            onClick={handleEnable}
            disabled={isRequesting}
            className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium rounded-lg transition"
          >
            {isRequesting ? 'Enabling...' : 'Enable Notifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
