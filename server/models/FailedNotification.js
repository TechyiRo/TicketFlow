const mongoose = require('mongoose');

const FailedNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userModel: {
    type: String,
    enum: ['User', 'Employee'],
    required: true,
  },
  scheduleItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduleItem',
    required: true,
  },
  itemTitle: {
    type: String,
    required: true,
  },
  reminderTime: {
    type: Date,
    required: true,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  lastAttempt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['retrying', 'failed', 'delivered'],
    default: 'retrying',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FailedNotification', FailedNotificationSchema);
