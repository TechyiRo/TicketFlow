const Ticket = require('../models/Ticket');

/**
 * Log a resolved or missed voice call in ticket history
 */
exports.logCall = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { callerName, participants, startTime, duration, isMissed } = req.body;

    if (!callerName || !startTime) {
      return res.status(400).json({ message: 'Caller name and start time are required' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Role access authorization check
    const isAdmin = req.user.role === 'admin';
    const isCreator = ticket.createdBy.toString() === req.user.id;
    const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === req.user.id;

    if (!isAdmin && !isCreator && !isAssigned) {
      return res.status(403).json({ message: 'Forbidden: Access denied to ticket call logs' });
    }

    ticket.callHistory.push({
      callerName,
      participants: participants || [],
      startTime: new Date(startTime),
      duration: duration || 0,
      isMissed: !!isMissed,
    });

    await ticket.save();
    return res.status(201).json(ticket);
  } catch (error) {
    console.error('Log call error:', error);
    return res.status(500).json({ message: 'Server error saving call log' });
  }
};
