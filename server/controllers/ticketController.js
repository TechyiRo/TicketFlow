const Ticket = require('../models/Ticket');
const Employee = require('../models/Employee');
const { uploadToCloudinary } = require('../middleware/upload');
const { sendPushToUser } = require('../utils/push');

/**
 * Get all tickets (filtered/paginated)
 */
exports.getTickets = async (req, res) => {
  try {
    const query = {};

    // Users only see their own tickets
    if (req.user.role === 'user') {
      query.createdBy = req.user.id;
    }

    // Apply query filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.category) query.category = req.query.category;

    // Apply search filter (by ticketId, title, description)
    if (req.query.search) {
      query.$or = [
        { ticketId: { $regex: req.query.search, $options: 'i' } },
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting parameters
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    const tickets = await Ticket.find(query)
      .populate('createdBy', 'fullName username avatar company logo')
      .populate('assignedTo', 'fullName username avatar department')
      .sort({ [sortBy]: order })
      .skip(skip)
      .limit(limit);

    const total = await Ticket.countDocuments(query);

    return res.json({
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    return res.status(500).json({ message: 'Server error retrieving tickets' });
  }
};

/**
 * Create a new ticket (user only)
 */
exports.createTicket = async (req, res) => {
  try {
    const { title, description, priority, category } = req.body;

    // Process attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file, 'ticketflow_attachments');
        attachments.push(url);
      }
    }

    const newTicket = new Ticket({
      title,
      description,
      priority,
      category,
      createdBy: req.user.id,
      attachments,
    });

    await newTicket.save();

    const populatedTicket = await Ticket.findById(newTicket._id)
      .populate('createdBy', 'fullName username avatar company logo')
      .populate('assignedTo', 'fullName username avatar department');

    return res.status(201).json(populatedTicket);
  } catch (error) {
    console.error('Create ticket error:', error);
    return res.status(500).json({ message: 'Server error creating ticket' });
  }
};

/**
 * Get ticket details (by ID)
 */
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'fullName username avatar company logo')
      .populate('assignedTo', 'fullName username avatar department')
      .populate({
        path: 'comments.author',
        select: 'fullName username avatar role department company logo',
      });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Role guard: Users can only view their own tickets
    if (req.user.role === 'user' && ticket.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    return res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    return res.status(500).json({ message: 'Server error retrieving ticket details' });
  }
};

/**
 * Update ticket status (employee only)
 */
exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
    } else {
      ticket.resolvedAt = undefined;
    }

    ticket.history.push({
      type: 'status_change',
      changedBy: req.user.fullName || req.user.username,
      details: `Changed status from ${oldStatus} to ${status}`,
      timestamp: new Date(),
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'fullName username avatar company logo')
      .populate('assignedTo', 'fullName username avatar department')
      .populate({
        path: 'comments.author',
        select: 'fullName username avatar role department company logo',
      });

    // Send push notification to ticket creator
    const title = status === 'resolved' ? 'Ticket Resolved' : 'Ticket Status Updated';
    const body = status === 'resolved' 
      ? `Your ticket ${ticket.ticketId} has been marked as Resolved.` 
      : `Ticket ${ticket.ticketId} status has changed to ${status.replace('_', ' ')}.`;

    await sendPushToUser(ticket.createdBy, 'user', {
      title,
      body,
      data: { url: `/dashboard?ticketId=${ticket._id}` },
    });

    // Emit Socket.IO events
    if (req.io) {
      req.io.to(ticket._id.toString()).emit('ticket_updated', updatedTicket);
      req.io.emit('ticket_updated', updatedTicket); // Global update
    }

    return res.json(updatedTicket);
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ message: 'Server error updating status' });
  }
};

/**
 * Assign ticket to employee (employee only)
 */
exports.assignTicket = async (req, res) => {
  try {
    const { employeeId } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    let details = '';
    const changedBy = req.user.fullName || req.user.username;

    let oldAssigneeName = 'Unassigned';
    if (ticket.assignedTo) {
      const oldEmp = await Employee.findById(ticket.assignedTo);
      if (oldEmp) oldAssigneeName = oldEmp.fullName;
    }

    // Handle unassign
    if (!employeeId) {
      if (ticket.assignedTo) {
        // Remove ticket from old employee's list
        await Employee.findByIdAndUpdate(ticket.assignedTo, {
          $pull: { assignedTickets: ticket._id },
        });
      }
      ticket.assignedTo = null;
      details = `Unassigned ticket (previously assigned to ${oldAssigneeName})`;
    } else {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(400).json({ message: 'Employee not found' });
      }

      if (ticket.assignedTo && ticket.assignedTo.toString() !== employeeId) {
        // Remove from old employee
        await Employee.findByIdAndUpdate(ticket.assignedTo, {
          $pull: { assignedTickets: ticket._id },
        });
      }

      ticket.assignedTo = employeeId;
      
      // Add to new employee's list if not present
      await Employee.findByIdAndUpdate(employeeId, {
        $addToSet: { assignedTickets: ticket._id },
      });

      details = `Assigned ticket to ${employee.fullName} (previously assigned to ${oldAssigneeName})`;

      // Send push notification to assigned employee
      await sendPushToUser(employeeId, 'employee', {
        title: 'New Ticket Assigned',
        body: `${ticket.ticketId}: ${ticket.title}`,
        data: { url: `/dashboard?ticketId=${ticket._id}` },
      });
    }

    ticket.history.push({
      type: 'assignment_change',
      changedBy: changedBy,
      details: details,
      timestamp: new Date(),
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'fullName username avatar company logo')
      .populate('assignedTo', 'fullName username avatar department')
      .populate({
        path: 'comments.author',
        select: 'fullName username avatar role department company logo',
      });

    // Emit Socket.IO events
    if (req.io) {
      const employee = employeeId ? await Employee.findById(employeeId) : null;
      const empName = employee ? employee.fullName : null;
      req.io.to(ticket._id.toString()).emit('ticket_assigned', { ticketId: ticket._id, employeeName: empName });
      req.io.emit('ticket_updated', updatedTicket); // Global update
    }

    return res.json(updatedTicket);
  } catch (error) {
    console.error('Assign ticket error:', error);
    return res.status(500).json({ message: 'Server error assigning ticket' });
  }
};

/**
 * Add a comment to a ticket (both roles)
 */
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Role guard: Users can only comment on their own tickets
    if (req.user.role === 'user' && ticket.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }

    const modelName = req.user.role === 'user' ? 'User' : 'Employee';

    ticket.comments.push({
      author: req.user.id,
      authorModel: modelName,
      text: text.trim(),
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'fullName username avatar company logo')
      .populate('assignedTo', 'fullName username avatar department')
      .populate({
        path: 'comments.author',
        select: 'fullName username avatar role department company logo',
      });

    // Send push notification to opposite party
    if (req.user.role === 'user') {
      if (ticket.assignedTo) {
        await sendPushToUser(ticket.assignedTo, 'employee', {
          title: 'New Ticket Comment',
          body: `${req.user.fullName} commented on ${ticket.ticketId}`,
          data: { url: `/dashboard?ticketId=${ticket._id}` },
        });
      }
    } else {
      await sendPushToUser(ticket.createdBy, 'user', {
        title: 'Support Team Comment',
        body: `${req.user.fullName} commented on your ticket ${ticket.ticketId}`,
        data: { url: `/dashboard?ticketId=${ticket._id}` },
      });
    }

    // Emit Socket.IO events
    if (req.io) {
      req.io.to(ticket._id.toString()).emit('ticket_updated', updatedTicket);
      req.io.emit('ticket_updated', updatedTicket); // Global update
    }

    return res.json(updatedTicket);
  } catch (error) {
    console.error('Add comment error:', error);
    return res.status(500).json({ message: 'Server error adding comment' });
  }
};

/**
 * Delete a ticket (employee only)
 */
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Remove reference from employee's assigned tickets
    if (ticket.assignedTo) {
      await Employee.findByIdAndUpdate(ticket.assignedTo, {
        $pull: { assignedTickets: ticket._id },
      });
    }

    await Ticket.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Ticket deleted successfully', ticketId: ticket.ticketId });
  } catch (error) {
    console.error('Delete ticket error:', error);
    return res.status(500).json({ message: 'Server error deleting ticket' });
  }
};
