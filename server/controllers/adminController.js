const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Ticket = require('../models/Ticket');

/**
 * Get aggregate statistics
 */
exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEmployees = await Employee.countDocuments({ role: 'employee' });
    const totalTickets = await Ticket.countDocuments();
    
    // Aggregate by status
    const statusCounts = await Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const ticketStats = {
      open: 0,
      in_progress: 0,
      on_hold: 0,
      resolved: 0,
      closed: 0,
    };
    
    statusCounts.forEach(stat => {
      if (ticketStats[stat._id] !== undefined) {
        ticketStats[stat._id] = stat.count;
      }
    });

    return res.json({
      users: totalUsers,
      employees: totalEmployees,
      tickets: {
        total: totalTickets,
        ...ticketStats,
      }
    });
  } catch (error) {
    console.error('Admin get stats error:', error);
    res.status(500).json({ message: 'Error retrieving stats' });
  }
};

/**
 * Get all users
 */
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').lean();
    
    // For each user, get full ticket history
    const usersWithHistory = await Promise.all(users.map(async (user) => {
      const tickets = await Ticket.find({ createdBy: user._id })
        .select('ticketId title status priority createdAt')
        .sort({ createdAt: -1 });
      return { ...user, tickets, ticketCount: tickets.length };
    }));
    
    res.json(usersWithHistory);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Error retrieving users' });
  }
};

/**
 * Get all employees
 */
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ role: 'employee' })
      .select('-passwordHash')
      .populate({
        path: 'assignedTickets',
        select: 'ticketId title status priority createdAt'
      })
      .lean();
    res.json(employees);
  } catch (error) {
    console.error('Admin get employees error:', error);
    res.status(500).json({ message: 'Error retrieving employees' });
  }
};

/**
 * Get all tickets
 */
exports.getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('createdBy', 'fullName company.name')
      .populate('assignedTo', 'fullName department')
      .sort({ createdAt: -1 });
    
    res.json({ tickets });
  } catch (error) {
    console.error('Admin get tickets error:', error);
    res.status(500).json({ message: 'Error retrieving tickets' });
  }
};

/**
 * Reset password for User or Employee
 */
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, newPassword } = req.body; // type = 'user' | 'employee'
    
    if (!newPassword || newPassword.length < 5) {
      return res.status(400).json({ message: 'Password must be at least 5 characters' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    let updated;

    if (type === 'user') {
      updated = await User.findByIdAndUpdate(
        id, 
        { passwordHash, plainTextPassword: newPassword }, 
        { new: true }
      ).select('-passwordHash');
    } else if (type === 'employee') {
      updated = await Employee.findByIdAndUpdate(
        id, 
        { passwordHash, plainTextPassword: newPassword }, 
        { new: true }
      ).select('-passwordHash');
    } else {
      return res.status(400).json({ message: 'Invalid type specified' });
    }

    if (!updated) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({ message: 'Password successfully reset', account: updated });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

/**
 * Create a new Employee account
 */
exports.createEmployee = async (req, res) => {
  try {
    const { fullName, email, department, temporaryPassword } = req.body;

    if (!fullName || !email || !department || !temporaryPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if username/email already exists
    const emailLower = email.toLowerCase();
    const username = emailLower.split('@')[0];

    const existingUser = await User.findOne({ username: username });
    const existingEmp = await Employee.findOne({ $or: [{ username }, { email: emailLower }] });
    if (existingUser || existingEmp) {
      return res.status(400).json({ message: 'An account with this email/username already exists' });
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const newEmployee = new Employee({
      fullName,
      username,
      email: emailLower,
      passwordHash,
      plainTextPassword: temporaryPassword,
      role: 'employee',
      department,
    });

    await newEmployee.save();

    res.status(201).json({
      message: 'Employee successfully created',
      employee: {
        _id: newEmployee._id,
        fullName: newEmployee.fullName,
        username: newEmployee.username,
        email: newEmployee.email,
        role: newEmployee.role,
        department: newEmployee.department,
        plainTextPassword: newEmployee.plainTextPassword,
        createdAt: newEmployee.createdAt,
        assignedTickets: [],
      }
    });
  } catch (error) {
    console.error('Admin create employee error:', error);
    res.status(500).json({ message: 'Error creating employee account' });
  }
};

/**
 * Delete an Employee account
 */
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Move all tickets assigned to this employee back to Unassigned
    const ticketsToUpdate = await Ticket.find({ assignedTo: id });
    for (const t of ticketsToUpdate) {
      t.assignedTo = null;
      t.history.push({
        type: 'assignment_change',
        changedBy: req.user.fullName || req.user.username,
        details: `Employee ${employee.fullName} deleted, ticket reset to Unassigned`,
        timestamp: new Date()
      });
      await t.save();
    }

    await Employee.findByIdAndDelete(id);

    res.json({ message: 'Employee successfully deleted and tickets unassigned' });
  } catch (error) {
    console.error('Admin delete employee error:', error);
    res.status(500).json({ message: 'Error deleting employee account' });
  }
};

/**
 * Get all active chats summaries for Admin Oversight Panel
 */
const Message = require('../models/Message');

exports.getActiveChats = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('createdBy', 'fullName avatar')
      .populate('assignedTo', 'fullName avatar')
      .sort({ updatedAt: -1 });

    const chatRooms = [];

    for (const ticket of tickets) {
      const lastMsg = await Message.findOne({ ticketId: ticket._id })
        .sort({ createdAt: -1 });

      chatRooms.push({
        ticketId: ticket._id,
        ticketDisplayId: ticket.ticketId,
        title: ticket.title,
        status: ticket.status,
        creatorName: ticket.createdBy?.fullName || 'User',
        assigneeName: ticket.assignedTo?.fullName || 'Unassigned',
        lastMessage: lastMsg ? {
          content: lastMsg.content || 'Sent an attachment',
          senderName: lastMsg.senderName,
          createdAt: lastMsg.createdAt
        } : null
      });
    }

    return res.json(chatRooms);
  } catch (error) {
    console.error('Admin get active chats error:', error);
    return res.status(500).json({ message: 'Server error retrieving active chats summaries' });
  }
};
