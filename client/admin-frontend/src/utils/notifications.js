/**
 * Notification utilities for requesting and handling notification permissions
 */

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=80&h=80&fit=crop',
      ...options,
    });
  }
};

export const notificationExamples = [
  '📦 New Orders - Get alerts when customers place new orders',
  '💬 Customer Reviews - Be notified of new product reviews',
  '📈 Sales Reports - Daily sales summaries and analytics',
  '⚠️ Low Stock Alerts - Know when inventory is running low',
  '💰 Revenue Updates - Track your store performance',
  '🔔 Important Announcements - System updates and promotions',
];
