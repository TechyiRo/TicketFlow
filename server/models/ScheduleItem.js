const mongoose = require('mongoose');

const ScheduleItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userModel: {
    type: String,
    enum: ['User', 'Employee'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  dateStr: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['work', 'meeting', 'personal', 'urgent'],
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true,
  },
  reminderEnabled: {
    type: Boolean,
    default: false,
  },
  reminderTrigger: {
    type: String,
    enum: ['at_start', '5_min', '10_min', '15_min', '30_min', '1_hour'],
    default: 'at_start',
  },
  reminderTime: {
    type: Date,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  reminderStatus: {
    type: String,
    enum: ['pending', 'delivered', 'snoozed'],
    default: 'pending',
  },
  snoozeCount: {
    type: Number,
    default: 0,
  },
  lastReminderFired: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Pre-save calculation of the exact trigger timestamp
ScheduleItemSchema.pre('save', function(next) {
  if (this.reminderEnabled && this.startTime) {
    let offsetMinutes = 0;
    switch (this.reminderTrigger) {
      case '5_min': offsetMinutes = 5; break;
      case '10_min': offsetMinutes = 10; break;
      case '15_min': offsetMinutes = 15; break;
      case '30_min': offsetMinutes = 30; break;
      case '1_hour': offsetMinutes = 60; break;
      default: offsetMinutes = 0; break;
    }
    this.reminderTime = new Date(new Date(this.startTime).getTime() - offsetMinutes * 60000);
  } else {
    this.reminderTime = undefined;
  }
  next();
});

module.exports = mongoose.model('ScheduleItem', ScheduleItemSchema);
