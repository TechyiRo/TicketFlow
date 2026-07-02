const express = require('express');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Employee = require('../models/Employee');

const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);

/**
 * POST /api/push/subscribe
 * Save Web Push subscription payload
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) {
      return res.status(400).json({ message: 'Subscription payload is required' });
    }

    if (req.user.role === 'user') {
      await User.findByIdAndUpdate(req.user.id, { pushSubscription: subscription });
    } else {
      await Employee.findByIdAndUpdate(req.user.id, { pushSubscription: subscription });
    }

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
    if (req.user.role === 'user') {
      await User.findByIdAndUpdate(req.user.id, { $unset: { pushSubscription: 1 } });
    } else {
      await Employee.findByIdAndUpdate(req.user.id, { $unset: { pushSubscription: 1 } });
    }

    return res.json({ message: 'Web Push subscription removed successfully' });
  } catch (error) {
    console.error('Web Push unsubscribe error:', error);
    return res.status(500).json({ message: 'Server error removing push subscription' });
  }
});

module.exports = router;
