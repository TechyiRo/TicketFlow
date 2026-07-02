const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  plainTextPassword: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['employee', 'admin'],
    default: 'employee',
  },
  avatar: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    required: true,
  },
  assignedTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
  }],
  refreshToken: {
    type: String,
  },
  pushSubscription: {
    type: mongoose.Schema.Types.Mixed, // Object for Web Push
  },
  notificationPermissionGranted: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Employee', EmployeeSchema);
