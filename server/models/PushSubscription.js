const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  userModel: {
    type: String,
    enum: ['User', 'Employee'],
    required: true,
  },
  subscription: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);
