/**
 * Notification utilities for requesting and handling notification permissions
 */

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
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
  '📦 Order Confirmation - Get confirmation when your order is placed',
  '🚚 Delivery Updates - Track when your order ships and arrives',
  '💰 Exclusive Deals - Never miss flash sales and special offers',
  '⏰ Cart Reminders - Get alerted about items you\'ve added to your cart',
  '⭐ Product Alerts - Be notified when out-of-stock items are back',
  '🎁 Special Promotions - Personalized offers based on your preferences',
];
