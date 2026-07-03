const Message = require('../models/Message');
const Ticket = require('../models/Ticket');
const { sendPushToUser } = require('../utils/push');
const { uploadToCloudinary } = require('../middleware/upload');

/**
 * Get full message history for a ticket
 */
exports.getMessages = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Verify ticket exists and user has access
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isCreator = ticket.createdBy.toString() === req.user.id;
    const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === req.user.id;

    if (!isAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    const messages = await Message.find({ ticketId }).sort({ createdAt: 1 });
    return res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ message: 'Server error retrieving chat history' });
  }
};

/**
 * Send message (REST fallback)
 */
exports.sendMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content, attachments } = req.body;

    const hasContent = content && content.trim();
    const hasAttachments = attachments && attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      return res.status(400).json({ message: 'Message content or attachment is required' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isCreator = ticket.createdBy.toString() === req.user.id;
    const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === req.user.id;

    if (!isAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    const senderModel = req.user.role === 'user' ? 'User' : 'Employee';

    const newMessage = new Message({
      ticketId,
      senderId: req.user.id,
      senderModel,
      senderName: req.user.fullName,
      senderAvatar: req.user.avatar || '',
      content: hasContent ? content.trim() : '',
      attachments: attachments || [],
      readBy: [req.user.id],
      status: 'sent',
    });

    await newMessage.save();

    // Trigger push notification to other participant
    const isUserSender = req.user.role === 'user';
    const targetUserId = isUserSender ? ticket.assignedTo : ticket.createdBy;

    if (targetUserId) {
      const bodyText = hasContent 
        ? content.trim() 
        : `Sent ${attachments.length} attachment(s)`;
      const bodySnippet = bodyText.substring(0, 80);

      await sendPushToUser(targetUserId, {
        type: 'CHAT',
        title: req.user.fullName,
        body: bodySnippet,
        url: `/dashboard?ticketId=${ticket._id}&chat=true`,
        tag: ticket._id.toString(),
        ticketId: ticket._id.toString(),
      });
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ message: 'Server error sending message' });
  }
};

/**
 * Mark messages in a ticket chat as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Verify ticket exists
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isCreator = ticket.createdBy.toString() === req.user.id;
    const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === req.user.id;

    if (!isAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    // Add user ID to readBy array and set status to read
    await Message.updateMany(
      { ticketId, readBy: { $ne: req.user.id } },
      { 
        $addToSet: { readBy: req.user.id },
        $set: { status: 'read' }
      }
    );

    // Notify other users that messages are read
    if (req.io) {
      req.io.to(ticketId.toString()).emit('messages_read_receipt', {
        ticketId,
        readByUserId: req.user.id
      });
    }

    return res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ message: 'Server error updating read receipt' });
  }
};

/**
 * Upload single attachment to chat
 */
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = await uploadToCloudinary(req.file, 'ticketflow_chat');

    return res.json({
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl: fileUrl,
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    return res.status(500).json({ message: 'Server error uploading file' });
  }
};

/**
 * Add / remove emoji reaction on a message
 */
exports.toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;
    const userName = req.user.fullName;

    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify ticket access
    const ticket = await Ticket.findById(message.ticketId);
    const isAdmin = req.user.role === 'admin';
    const isCreator = ticket.createdBy.toString() === req.user.id;
    const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === req.user.id;

    if (!isAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    // Toggle reaction logic
    const existingIdx = message.reactions.findIndex(
      (r) => r.emoji === emoji && r.userId.toString() === userId
    );

    if (existingIdx > -1) {
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions.push({ emoji, userId, userName });
    }

    await message.save();

    // Notify clients of updated reactions
    if (req.io) {
      req.io.to(message.ticketId.toString()).emit('message_reaction_updated', {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    return res.json(message);
  } catch (error) {
    console.error('Toggle reaction error:', error);
    return res.status(500).json({ message: 'Server error updating reaction' });
  }
};
