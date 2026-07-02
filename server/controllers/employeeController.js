const Employee = require('../models/Employee');
const Ticket = require('../models/Ticket');

/**
 * List all active employees (excluding passwords and tokens)
 */
exports.getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true }).select('fullName username email department avatar');
    return res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    return res.status(500).json({ message: 'Server error retrieving employee list' });
  }
};

/**
 * Get dashboard statistics for Employee Portal
 */
exports.getEmployeeStats = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Calculate core card stats
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: 'open' });
    const assignedTickets = await Ticket.countDocuments({ assignedTo: employeeId });
    const resolvedToday = await Ticket.countDocuments({
      status: { $in: ['resolved', 'closed'] },
      resolvedAt: { $gte: todayStart },
    });
    const criticalTickets = await Ticket.countDocuments({ priority: 'critical' });

    // Aggregate category distribution for Bar Chart
    const categories = ['technical', 'billing', 'general', 'feature', 'bug'];
    const categoryStatsRaw = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const categoryStats = categories.map((cat) => {
      const match = categoryStatsRaw.find((item) => item._id === cat);
      return {
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        count: match ? match.count : 0,
      };
    });

    // Aggregate priority distribution for Donut Chart
    const priorities = ['low', 'medium', 'high', 'critical'];
    const priorityStatsRaw = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const priorityStats = priorities.map((prio) => {
      const match = priorityStatsRaw.find((item) => item._id === prio);
      return {
        name: prio.charAt(0).toUpperCase() + prio.slice(1),
        value: match ? match.count : 0,
      };
    });

    // Recent activity list
    const recentTickets = await Ticket.find()
      .populate('createdBy', 'fullName')
      .sort({ updatedAt: -1 })
      .limit(5);

    const activityFeed = recentTickets.map(ticket => {
      let actionText = '';
      if (ticket.status === 'open') {
        actionText = `Ticket ${ticket.ticketId} raised by ${ticket.createdBy?.fullName || 'Client'}`;
      } else {
        actionText = `Ticket ${ticket.ticketId} updated to ${ticket.status.replace('_', ' ')}`;
      }
      return {
        id: ticket._id,
        text: actionText,
        time: ticket.updatedAt,
      };
    });

    return res.json({
      cards: {
        totalTickets,
        openTickets,
        assignedTickets,
        resolvedToday,
        criticalTickets,
      },
      charts: {
        categoryStats,
        priorityStats,
      },
      activityFeed,
    });
  } catch (error) {
    console.error('Get employee stats error:', error);
    return res.status(500).json({ message: 'Server error retrieving statistics' });
  }
};

/**
 * Update employee profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, department, avatar } = req.body;
    const employeeId = req.user.id;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (fullName) employee.fullName = fullName;
    if (department) employee.department = department;
    if (avatar) employee.avatar = avatar;

    await employee.save();

    return res.json({
      message: 'Profile updated successfully',
      user: {
        id: employee._id,
        fullName: employee.fullName,
        username: employee.username,
        email: employee.email,
        role: employee.role,
        avatar: employee.avatar,
        department: employee.department,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error updating profile' });
  }
};
