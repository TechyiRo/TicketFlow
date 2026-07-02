const webpush = require('web-push');
const User = require('../models/User');
const Employee = require('../models/Employee');

// Initialize Web Push details
const initWebPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || 'mailto:admin@ticketflow.com';

  if (publicKey && privateKey) {
    webpush.setVapidDetails(email, publicKey, privateKey);
    console.log('Web Push service configured successfully.');
  } else {
    console.warn('Web Push keys are missing in env. Push notifications will be disabled.');
  }
};

// Initialize configuration
initWebPush();

/**
 * Send web push notification to a specific user or employee by ID
 * @param {string} userId - User or Employee ObjectId
 * @param {string} role - 'user' or 'employee'
 * @param {Object} payload - Notification payload { title, body, data: { url } }
 */
const sendPushToUser = async (userId, role, payload) => {
  try {
    let recipient;
    if (role === 'user') {
      recipient = await User.findById(userId);
    } else if (role === 'employee') {
      recipient = await Employee.findById(userId);
    }

    if (!recipient || !recipient.pushSubscription) {
      return;
    }

    const subscription = recipient.pushSubscription;
    await webpush.sendNotification(subscription, JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: payload.data || {},
      }
    }));
    console.log(`Push notification sent successfully to ${recipient.fullName}`);
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error.message);
  }
};

module.exports = {
  sendPushToUser,
};
