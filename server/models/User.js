const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
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
    enum: ['user'],
    default: 'user',
  },
  avatar: {
    type: String,
    required: true,
  },
  company: {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
  },
  logo: {
    type: String, // Cloudinary URL
    default: '',
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
