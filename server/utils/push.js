const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
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
 * @param {Object} payload - Notification payload { type, title, body, url, tag, ticketId, itemId }
 */
const sendPushToUser = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    const pushData = JSON.stringify({
      type: payload.type || 'TASK',
      title: payload.title,
      body: payload.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      url: payload.url || '/dashboard',
      tag: payload.tag || `${payload.type || 'task'}-${payload.itemId || payload.ticketId || Date.now()}`,
      ticketId: payload.ticketId || undefined,
      itemId: payload.itemId || undefined,
    });

    const deliveries = subscriptions.map(async (sub) => {
      const subDetails = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(subDetails, pushData);
      } catch (error) {
        // If push service returns 410 (Gone) or 404 (Not Found), delete subscription from DB
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Pruning invalid push subscription: ${sub.endpoint}`);
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error(`Error delivering push payload:`, error.message);
        }
      }
    });

    await Promise.all(deliveries);
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error.message);
  }
};

module.exports = {
  sendPushToUser,
};
