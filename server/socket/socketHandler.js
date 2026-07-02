const Message = require('../models/Message');
const Ticket = require('../models/Ticket');
const { sendPushToUser } = require('../utils/push');

// Track all active calls in-memory: ticketId -> { ticketId, callerId, callerName, callerRole, startTime, participants: [] }
const activeCalls = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Send the current list of active calls immediately on connection
    socket.emit('active_calls_update', Array.from(activeCalls.keys()));

    // Join room with authorization check
    socket.on('join_room', async ({ ticketId, userId, role }) => {
      try {
        if (!ticketId || !userId) return;

        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return;

        // Verify roles access
        const isAdmin = role === 'admin';
        const isCreator = ticket.createdBy.toString() === userId;
        const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === userId;

        if (isAdmin || isCreator || isAssigned) {
          socket.join(ticketId);
          console.log(`User ${userId} (${role}) authorized & joined room: ${ticketId}`);

          // Mark messages as read since they joined the room
          await Message.updateMany(
            { ticketId, readBy: { $ne: userId } },
            { 
              $addToSet: { readBy: userId },
              $set: { status: 'read' }
            }
          );

          // Broadcast that messages are read in this room
          io.to(ticketId).emit('messages_read_receipt', {
            ticketId,
            readByUserId: userId
          });
        } else {
          console.warn(`Unauthenticated join attempt on room ${ticketId} by user ${userId}`);
        }
      } catch (err) {
        console.error('Socket join_room error:', err.message);
      }
    });

    // Handle incoming real-time message
    socket.on('send_message', async ({ tempId, ticketId, content, senderId, senderModel, senderName, senderAvatar, attachments }) => {
      try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return;

        // Determine if message is delivered to another connected socket in this room
        const roomSockets = io.sockets.adapter.rooms.get(ticketId);
        const otherConnected = roomSockets && roomSockets.size > 1;
        const initialStatus = otherConnected ? 'delivered' : 'sent';

        const message = new Message({
          ticketId,
          senderId,
          senderModel,
          senderName,
          senderAvatar,
          content: content ? content.trim() : '',
          attachments: attachments || [],
          readBy: [senderId],
          status: initialStatus,
        });

        await message.save();

        // Convert to plain object to attach tempId
        const msgObj = message.toObject();
        if (tempId) {
          msgObj.tempId = tempId;
        }

        // Emit message to everyone in the room
        io.to(ticketId).emit('receive_message', msgObj);

        // Notify client dashboard lists for activity indicator update
        io.emit('ticket_chat_activity', { 
          ticketId, 
          lastMessage: content ? content.trim() : 'Sent an attachment',
          senderId 
        });

        // Trigger push notifications
        const isUserSender = senderModel === 'User';
        const targetUserId = isUserSender ? ticket.assignedTo : ticket.createdBy;
        const targetRole = isUserSender ? 'employee' : 'user';

        if (targetUserId) {
          const bodyText = content ? content.trim() : `Sent ${attachments.length} attachment(s)`;
          await sendPushToUser(targetUserId, targetRole, {
            title: `New Message - ${ticket.ticketId}`,
            body: `${senderName}: ${bodyText}`,
            data: { url: `/dashboard?ticketId=${ticket._id}&chat=true` },
          });
        }
      } catch (err) {
        console.error('Socket send_message error:', err.message);
      }
    });

    // Mark messages read socket event
    socket.on('read_messages', async ({ ticketId, userId }) => {
      try {
        await Message.updateMany(
          { ticketId, readBy: { $ne: userId } },
          { 
            $addToSet: { readBy: userId },
            $set: { status: 'read' }
          }
        );
        io.to(ticketId).emit('messages_read_receipt', {
          ticketId,
          readByUserId: userId
        });
      } catch (err) {
        console.error('Socket read_messages error:', err.message);
      }
    });

    // Toggle reaction socket event
    socket.on('toggle_reaction', async ({ messageId, emoji, userId, userName }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingIdx = message.reactions.findIndex(
          (r) => r.emoji === emoji && r.userId.toString() === userId
        );

        if (existingIdx > -1) {
          message.reactions.splice(existingIdx, 1);
        } else {
          message.reactions.push({ emoji, userId, userName });
        }

        await message.save();

        io.to(message.ticketId.toString()).emit('message_reaction_updated', {
          messageId: message._id,
          reactions: message.reactions
        });
      } catch (err) {
        console.error('Socket toggle_reaction error:', err.message);
      }
    });

    // Typing indicators with sender names list
    socket.on('typing', ({ ticketId, userId, userName, isTyping }) => {
      socket.to(ticketId).emit('user_typing', { userId, userName, isTyping });
    });

    // ==========================================
    // VOICE CALL SIGNALING ENDPOINTS (WebRTC)
    // ==========================================

    // Join active call room state session
    socket.on('join_call_session', ({ ticketId, userId, userName }) => {
      socket.join(`call-${ticketId}`);
      socket.callTicketId = ticketId;
      socket.callUserId = userId;
      socket.callUserName = userName;
      console.log(`Socket ${socket.id} joined call session call-${ticketId}`);
    });

    // Start / initiate a voice call
    socket.on('initiate_call', async ({ ticketId, callerId, callerName, callerRole }) => {
      try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) return;

        const ticketIdStr = ticketId.toString();

        const callInfo = {
          ticketId: ticketIdStr,
          callerId,
          callerName,
          callerRole,
          startTime: new Date(),
          participants: [callerName]
        };

        activeCalls.set(ticketIdStr, callInfo);
        socket.join(`call-${ticketIdStr}`);
        socket.callTicketId = ticketIdStr;
        socket.callUserId = callerId;
        socket.callUserName = callerName;

        // Broadcast incoming call toast to other room participants (except caller)
        socket.to(ticketIdStr).emit('incoming_call', {
          ticketId: ticketIdStr,
          ticketDisplayId: ticket.ticketId,
          callerId,
          callerName,
          callerRole,
          title: ticket.title
        });

        // Broadcast incoming call invitation to Admins globally (as they can join any call)
        socket.broadcast.emit('admin_incoming_call', {
          ticketId: ticketIdStr,
          ticketDisplayId: ticket.ticketId,
          callerId,
          callerName,
          callerRole,
          title: ticket.title
        });

        // Broadcast updated active calls mapping to all connected devices
        io.emit('active_calls_update', Array.from(activeCalls.keys()));
      } catch (err) {
        console.error('Socket initiate_call error:', err.message);
      }
    });

    // Decline/Accept call responses
    socket.on('respond_call', ({ ticketId, accepted, responderId, responderName, responderRole }) => {
      const ticketIdStr = ticketId.toString();
      
      if (accepted) {
        const callInfo = activeCalls.get(ticketIdStr);
        if (callInfo && !callInfo.participants.includes(responderName)) {
          callInfo.participants.push(responderName);
        }
        
        socket.join(`call-${ticketIdStr}`);
        socket.callTicketId = ticketIdStr;
        socket.callUserId = responderId;
        socket.callUserName = responderName;

        io.to(`call-${ticketIdStr}`).emit('call_accepted', {
          ticketId: ticketIdStr,
          responderId,
          responderName,
          responderRole
        });
      } else {
        io.to(`call-${ticketIdStr}`).emit('call_declined', {
          ticketId: ticketIdStr,
          responderId,
          responderName,
          responderRole
        });
      }
    });

    // Relay WebRTC SDP / ICE signals between peers
    socket.on('webrtc_signal', ({ ticketId, signal, senderId }) => {
      socket.to(`call-${ticketId}`).emit('webrtc_signal', {
        senderId,
        signal
      });
    });

    // Leave a call
    socket.on('leave_call', ({ ticketId, userId, userName }) => {
      const ticketIdStr = ticketId.toString();
      socket.leave(`call-${ticketIdStr}`);
      socket.callTicketId = null;

      const callInfo = activeCalls.get(ticketIdStr);
      if (callInfo) {
        callInfo.participants = callInfo.participants.filter(p => p !== userName);
        
        // Notify others that participant left
        io.to(`call-${ticketIdStr}`).emit('participant_left', {
          ticketId: ticketIdStr,
          userId,
          userName
        });

        // End call if caller left or no active participants left
        if (callInfo.participants.length <= 1) {
          activeCalls.delete(ticketIdStr);
          io.to(`call-${ticketIdStr}`).emit('call_ended', { ticketId: ticketIdStr });
          io.emit('active_calls_update', Array.from(activeCalls.keys()));
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
      
      // Auto cleanup call if socket disconnected unexpectedly
      if (socket.callTicketId) {
        const ticketIdStr = socket.callTicketId;
        const callInfo = activeCalls.get(ticketIdStr);
        if (callInfo) {
          callInfo.participants = callInfo.participants.filter(p => p !== socket.callUserName);
          
          io.to(`call-${ticketIdStr}`).emit('participant_left', {
            ticketId: ticketIdStr,
            userId: socket.callUserId,
            userName: socket.callUserName
          });

          if (callInfo.participants.length <= 1) {
            activeCalls.delete(ticketIdStr);
            io.to(`call-${ticketIdStr}`).emit('call_ended', { ticketId: ticketIdStr });
            io.emit('active_calls_update', Array.from(activeCalls.keys()));
          }
        }
      }
    });
  });
};
