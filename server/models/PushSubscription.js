const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userModel',
  },
  userModel: {
    type: String,
    enum: ['User', 'Employee'],
    required: true,
  },
  deviceFingerprint: {
    type: String,
    required: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  p256dh: {
    type: String,
    required: true,
  },
  auth: {
    type: String,
    required: true,
  },
}, {
  collection: 'push_subscriptions',
  timestamps: true,
});

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);
