const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'comments.authorModel',
  },
  authorModel: {
    type: String,
    required: true,
    enum: ['User', 'Employee'],
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const HistoryLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['status_change', 'assignment_change', 'creation'],
    required: true,
  },
  changedBy: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const TicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  category: {
    type: String,
    enum: ['technical', 'billing', 'general', 'feature', 'bug'],
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'on_hold', 'resolved', 'closed'],
    default: 'open',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null,
  },
  comments: [CommentSchema],
  history: [HistoryLogSchema],
  attachments: [{
    type: String, // Cloudinary URLs
  }],
  callHistory: [{
    callerName: { type: String, required: true },
    participants: [{ type: String }],
    startTime: { type: Date, required: true },
    duration: { type: Number, default: 0 },
    isMissed: { type: Boolean, default: false }
  }],
  resolvedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Auto-generate ticketId (TKT-YYYYNNNNN) before saving if not present
TicketSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const year = new Date().getFullYear();
    try {
      const count = await this.constructor.countDocuments({
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      });
      const seq = String(count + 1).padStart(5, '0');
      this.ticketId = `TKT-${year}${seq}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema);
