const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel',
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['User', 'Employee'],
  },
  senderName: {
    type: String,
    required: true,
  },
  senderAvatar: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    trim: true,
    default: '',
  },
  messageType: {
    type: String,
    enum: ['text', 'system'],
    default: 'text',
  },
  attachments: [{
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileUrl: { type: String, required: true },
  }],
  reactions: [{
    emoji: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userName: { type: String, required: true },
  }],
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', MessageSchema);
