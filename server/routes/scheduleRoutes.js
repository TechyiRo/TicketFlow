const express = require('express');
const authMiddleware = require('../middleware/auth');
const scheduleController = require('../controllers/scheduleController');

const router = express.Router();

// Middleware to bypass header JWT checks if a query-string actionToken is present
const optionalAuthOrToken = (req, res, next) => {
  if (req.query.actionToken) {
    return next();
  }
  return authMiddleware(req, res, next);
};

// Background action endpoints (called by service worker)
router.post('/items/:id/snooze-bg', optionalAuthOrToken, scheduleController.snoozeBackground);
router.post('/items/:id/complete-bg', optionalAuthOrToken, scheduleController.completeBackground);

// Regular authenticated schedule endpoints
router.get('/', authMiddleware, scheduleController.getItems);
router.post('/', authMiddleware, scheduleController.createItem);
router.put('/:id', authMiddleware, scheduleController.updateItem);
router.delete('/:id', authMiddleware, scheduleController.deleteItem);
router.patch('/:id/toggle', authMiddleware, scheduleController.toggleComplete);

router.post('/subscribe', authMiddleware, scheduleController.registerSubscription);
router.get('/failed-notifications', authMiddleware, scheduleController.getFailedNotifications);
router.delete('/failed-notifications', authMiddleware, scheduleController.clearFailedNotifications);
router.get('/admin-overview', authMiddleware, scheduleController.getAdminOverview);
router.post('/notification-permission', authMiddleware, scheduleController.updateNotificationPermission);

module.exports = router;
