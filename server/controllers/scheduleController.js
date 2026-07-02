const ScheduleItem = require('../models/ScheduleItem');
const PushSubscription = require('../models/PushSubscription');
const FailedNotification = require('../models/FailedNotification');
const User = require('../models/User');
const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');

// Helper to authenticate background actions from service workers
const verifyAction = async (itemId, actionToken, reqUser) => {
  const item = await ScheduleItem.findById(itemId);
  if (!item) return null;

  if (actionToken) {
    try {
      const decoded = jwt.verify(actionToken, process.env.JWT_ACCESS_SECRET);
      if (decoded.itemId === itemId) {
        return item;
      }
    } catch (err) {
      console.error('Background actionToken verification failed:', err.message);
    }
  }

  // Fallback to standard request user auth check
  if (reqUser && item.userId.toString() === reqUser.id) {
    return item;
  }

  return null;
};

/**
 * Fetch schedule items for a specific date
 */
exports.getItems = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const items = await ScheduleItem.find({
      userId: req.user.id,
      dateStr: date,
    }).sort({ startTime: 1 });

    return res.status(200).json(items);
  } catch (error) {
    console.error('Get items error:', error);
    return res.status(500).json({ message: 'Server error retrieving schedule items' });
  }
};

/**
 * Create a new schedule item
 */
exports.createItem = async (req, res) => {
  try {
    const { title, category, startTime, endTime, description, priority, reminderEnabled, reminderTrigger, dateStr } = req.body;

    if (!title || !category || !startTime || !endTime || !description || !priority) {
      return res.status(400).json({ message: 'All fields are required before saving' });
    }

    const startDT = new Date(startTime);
    let dateStrVal = dateStr;
    if (!dateStrVal) {
      const year = startDT.getFullYear();
      const month = (startDT.getMonth() + 1).toString().padStart(2, '0');
      const dateDay = startDT.getDate().toString().padStart(2, '0');
      dateStrVal = `${year}-${month}-${dateDay}`;
    }

    const item = new ScheduleItem({
      userId: req.user.id,
      userModel: req.user.role === 'user' ? 'User' : 'Employee',
      title,
      dateStr: dateStrVal,
      category,
      startTime: startDT,
      endTime: new Date(endTime),
      description,
      priority,
      reminderEnabled: !!reminderEnabled,
      reminderTrigger: reminderTrigger || 'at_start',
    });

    await item.save();
    return res.status(201).json(item);
  } catch (error) {
    console.error('Create item error:', error);
    return res.status(500).json({ message: 'Server error creating schedule item' });
  }
};

/**
 * Update an existing schedule item
 */
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, startTime, endTime, description, priority, reminderEnabled, reminderTrigger, dateStr } = req.body;

    const item = await ScheduleItem.findOne({ _id: id, userId: req.user.id });
    if (!item) {
      return res.status(404).json({ message: 'Schedule item not found' });
    }

    item.title = title || item.title;
    item.category = category || item.category;
    if (startTime) {
      item.startTime = new Date(startTime);
      if (dateStr) {
        item.dateStr = dateStr;
      } else {
        const startDT = new Date(startTime);
        const year = startDT.getFullYear();
        const month = (startDT.getMonth() + 1).toString().padStart(2, '0');
        const dateDay = startDT.getDate().toString().padStart(2, '0');
        item.dateStr = `${year}-${month}-${dateDay}`;
      }
    } else if (dateStr) {
      item.dateStr = dateStr;
    }
    if (endTime) item.endTime = new Date(endTime);
    item.description = description || item.description;
    item.priority = priority || item.priority;
    item.reminderEnabled = reminderEnabled !== undefined ? !!reminderEnabled : item.reminderEnabled;
    item.reminderTrigger = reminderTrigger || item.reminderTrigger;

    // Reset status if timings changed
    if (startTime || reminderEnabled) {
      item.reminderStatus = 'pending';
      item.snoozeCount = 0;
    }

    await item.save();
    return res.status(200).json(item);
  } catch (error) {
    console.error('Update item error:', error);
    return res.status(500).json({ message: 'Server error updating schedule item' });
  }
};

/**
 * Toggle schedule item completion state
 */
exports.toggleComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ScheduleItem.findOne({ _id: id, userId: req.user.id });
    if (!item) {
      return res.status(404).json({ message: 'Schedule item not found' });
    }

    item.isCompleted = !item.isCompleted;
    if (item.isCompleted) {
      item.reminderStatus = 'delivered'; // Mutes active alert states
    }
    await item.save();

    return res.status(200).json(item);
  } catch (error) {
    console.error('Toggle complete error:', error);
    return res.status(500).json({ message: 'Server error toggling completion status' });
  }
};

/**
 * Delete a schedule item
 */
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ScheduleItem.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!item) {
      return res.status(404).json({ message: 'Schedule item not found' });
    }

    return res.status(200).json({ message: 'Schedule item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    return res.status(500).json({ message: 'Server error deleting schedule item' });
  }
};

/**
 * Background Snooze update endpoint (service worker accessible)
 */
exports.snoozeBackground = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionToken } = req.query;

    const item = await verifyAction(id, actionToken, req.user);
    if (!item) {
      return res.status(403).json({ message: 'Access denied / Invalid authorization' });
    }

    if (item.snoozeCount >= 3) {
      return res.status(400).json({ message: 'Maximum snooze limits reached' });
    }

    item.snoozeCount += 1;
    item.reminderStatus = 'snoozed';
    item.reminderTime = new Date(Date.now() + 10 * 60000); // 10 minutes snooze delay

    await item.save();
    return res.status(200).json({ message: 'Reminder snoozed 10 minutes', item });
  } catch (error) {
    console.error('Snooze error:', error);
    return res.status(500).json({ message: 'Server error processing snooze request' });
  }
};

/**
 * Background Complete update endpoint (service worker accessible)
 */
exports.completeBackground = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionToken } = req.query;

    const item = await verifyAction(id, actionToken, req.user);
    if (!item) {
      return res.status(403).json({ message: 'Access denied / Invalid authorization' });
    }

    item.isCompleted = true;
    item.reminderStatus = 'delivered';

    await item.save();
    return res.status(200).json({ message: 'Task marked complete successfully', item });
  } catch (error) {
    console.error('Complete background error:', error);
    return res.status(500).json({ message: 'Server error completing task in background' });
  }
};

/**
 * Register web push subscription
 */
exports.registerSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Push subscription payload is required' });
    }

    const userId = req.user.id;
    const userModel = req.user.role === 'admin' ? 'Employee' : (req.user.role === 'employee' ? 'Employee' : 'User');

    // Prevent duplicates endpoint urls
    let record = await PushSubscription.findOne({ 'subscription.endpoint': subscription.endpoint });
    if (record) {
      record.userId = userId;
      record.userModel = userModel;
      await record.save();
    } else {
      record = new PushSubscription({
        userId,
        userModel,
        subscription,
      });
      await record.save();
    }

    return res.status(201).json({ message: 'Device push subscription registered successfully' });
  } catch (error) {
    console.error('Subscribe register error:', error);
    return res.status(500).json({ message: 'Server error registering push endpoint' });
  }
};

/**
 * Fetch list of failed notifications to show in warning banner
 */
exports.getFailedNotifications = async (req, res) => {
  try {
    const notifications = await FailedNotification.find({
      userId: req.user.id,
      status: 'failed',
    }).sort({ reminderTime: -1 });

    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Get failed notifications error:', error);
    return res.status(500).json({ message: 'Server error fetching notification logs' });
  }
};

/**
 * Acknowledge/clear failed notifications banner
 */
exports.clearFailedNotifications = async (req, res) => {
  try {
    await FailedNotification.deleteMany({
      userId: req.user.id,
      status: 'failed',
    });
    return res.status(200).json({ message: 'Failed alerts cleared' });
  } catch (error) {
    console.error('Clear failed notifications error:', error);
    return res.status(500).json({ message: 'Server error clearing alerts' });
  }
};

/**
 * Master overview consolidated records for Admins
 */
exports.getAdminOverview = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin only' });
    }

    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const allItemsToday = await ScheduleItem.find({
      dateStr: date,
    });

    const totalScheduledToday = allItemsToday.length;
    const totalCompletedToday = allItemsToday.filter(i => i.isCompleted).length;
    const totalRemindersFiredToday = allItemsToday.filter(i => i.reminderStatus === 'delivered').length;

    // Fetch all users and employees list
    const users = await User.find({}, 'fullName username avatar role');
    const employees = await Employee.find({}, 'fullName username avatar role');

    const combinedList = [];
    for (const u of [...users, ...employees]) {
      const uItems = allItemsToday.filter(i => i.userId.toString() === u._id.toString());
      const completed = uItems.filter(i => i.isCompleted).length;
      const progress = uItems.length > 0 ? Math.round((completed / uItems.length) * 100) : 0;

      combinedList.push({
        _id: u._id,
        fullName: u.fullName,
        username: u.username,
        role: u.role,
        avatar: u.avatar,
        scheduleItems: uItems,
        progress,
      });
    }

    return res.status(200).json({
      summary: {
        totalScheduledToday,
        totalCompletedToday,
        totalRemindersFiredToday,
      },
      usersList: combinedList,
    });
  } catch (error) {
    console.error('Get admin overview error:', error);
    return res.status(500).json({ message: 'Server error fetching administration metrics' });
  }
};

/**
 * Log notification permission status in the database against the user/employee account
 */
exports.updateNotificationPermission = async (req, res) => {
  try {
    const userId = req.user.id;
    const isUser = req.user.role === 'user';

    if (isUser) {
      await User.findByIdAndUpdate(userId, { notificationPermissionGranted: true });
    } else {
      await Employee.findByIdAndUpdate(userId, { notificationPermissionGranted: true });
    }

    return res.status(200).json({ message: 'Notification permission logged successfully' });
  } catch (error) {
    console.error('Update permission error:', error);
    return res.status(500).json({ message: 'Server error saving permission state' });
  }
};
