const express = require('express');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Employee = require('../models/Employee');

const PushSubscription = require('../models/PushSubscription');

const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);

/**
 * POST /api/push/subscribe
 * Save Web Push subscription payload
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription, deviceFingerprint } = req.body;
    if (!subscription || !deviceFingerprint) {
      return res.status(400).json({ message: 'Subscription and deviceFingerprint are required' });
    }

    const { endpoint, keys } = subscription;
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ message: 'Invalid subscription payload coordinates' });
    }

    // Check if subscription already exists for this fingerprint & endpoint
    let subEntry = await PushSubscription.findOne({
      userId: req.user.id,
      deviceFingerprint,
      endpoint,
    });

    if (!subEntry) {
      subEntry = new PushSubscription({
        userId: req.user.id,
        userModel: req.user.role === 'user' ? 'User' : 'Employee',
        deviceFingerprint,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
    } else {
      // Update keys if they changed
      subEntry.p256dh = keys.p256dh;
      subEntry.auth = keys.auth;
    }

    await subEntry.save();

    return res.json({ message: 'Web Push subscription registered successfully' });
  } catch (error) {
    console.error('Web Push subscribe error:', error);
    return res.status(500).json({ message: 'Server error saving push subscription' });
  }
});

/**
 * DELETE /api/push/unsubscribe
 * Remove Web Push subscription
 */
router.delete('/unsubscribe', async (req, res) => {
  try {
    const { deviceFingerprint } = req.body;
    if (deviceFingerprint) {
      await PushSubscription.deleteMany({ userId: req.user.id, deviceFingerprint });
    } else {
      await PushSubscription.deleteMany({ userId: req.user.id });
    }

    return res.json({ message: 'Web Push subscription removed successfully' });
  } catch (error) {
    console.error('Web Push unsubscribe error:', error);
    return res.status(500).json({ message: 'Server error removing push subscription' });
  }
});

module.exports = router;
