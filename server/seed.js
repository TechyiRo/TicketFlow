const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const User = require('./models/User');
const Employee = require('./models/Employee');
const Ticket = require('./models/Ticket');
const Message = require('./models/Message');

const seedData = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to database for seeding...');
    await mongoose.connect(connStr);

    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Ticket.deleteMany({});
    await Message.deleteMany({});

    console.log('Creating demo Employee account...');
    const hashedEmployeePassword = await bcrypt.hash('WinRo', 10);
    const employee = new Employee({
      fullName: 'John Doe',
      username: 'rohidas',
      email: 'john@ticketflow.com',
      passwordHash: hashedEmployeePassword,
      plainTextPassword: 'WinRo',
      avatar: 'avatar1', // abstract geometric tech face
      department: 'Technical Support',
    });
    await employee.save();

    console.log('Creating demo Admin account...');
    const hashedAdminPassword = await bcrypt.hash('WinRo', 10);
    const adminEmployee = new Employee({
      fullName: 'System Administrator',
      username: 'admin',
      email: 'admin@ticketflow.com',
      passwordHash: hashedAdminPassword,
      plainTextPassword: 'WinRo',
      avatar: 'avatar3',
      role: 'admin',
      department: 'IT Operations',
    });
    await adminEmployee.save();

    console.log('Creating demo User account...');
    const hashedUserPassword = await bcrypt.hash('WinRo', 10);
    const user = new User({
      fullName: 'Rahul Sharma',
      username: 'rohit',
      passwordHash: hashedUserPassword,
      plainTextPassword: 'WinRo',
      avatar: 'avatar4', // cat with headphones
      company: {
        name: 'Acme Corp',
        address: '123 Main St, Mumbai',
        contactNumber: '9876543210',
      },
    });
    await user.save();

    console.log('Creating 10 demo tickets...');
    const ticketDetails = [
      {
        title: 'System Crash during DB synchronization',
        description: 'The server crashes completely when trying to synchronize employee records after a cold connect. Need immediate support.',
        priority: 'critical',
        category: 'technical',
        status: 'open',
        assigned: false,
      },
      {
        title: 'Incorrect Billing Cycle on Acme Invoice',
        description: 'Our company invoice shows we were billed for a standard support level rather than the premium one. Please verify and refund.',
        priority: 'high',
        category: 'billing',
        status: 'in_progress',
        assigned: true,
      },
      {
        title: 'API Gateway Timeout Error',
        description: 'Seeing constant 504 errors on our integration endpoints. Usually occurs during peak hours.',
        priority: 'critical',
        category: 'technical',
        status: 'on_hold',
        assigned: true,
      },
      {
        title: 'UI alignment on Sidebar Navigation drawer',
        description: 'On mobile Safari viewport, the bottom tab bar shifts and hides behind the native iOS address bar. This needs 100dvh styling.',
        priority: 'low',
        category: 'bug',
        status: 'resolved',
        assigned: true,
      },
      {
        title: 'Feature request: export tickets to CSV format',
        description: 'Our operations team requires a daily export of all resolved tickets in CSV or PDF format. Requesting a button on dashboard.',
        priority: 'medium',
        category: 'feature',
        status: 'closed',
        assigned: true,
      },
      {
        title: 'General inquiry about SLA times',
        description: 'Could you please point us to the SLA terms and response times document for enterprise tier users?',
        priority: 'low',
        category: 'general',
        status: 'open',
        assigned: false,
      },
      {
        title: 'Unable to upload PNG company logos',
        description: 'Getting a 500 error when uploading a 3MB PNG file during registration. The file size limit is 5MB, so it should be supported.',
        priority: 'high',
        category: 'bug',
        status: 'open',
        assigned: false,
      },
      {
        title: 'Password reset fails with token expired',
        description: 'Reset password link redirects to token expired page immediately after clicking it. Tried twice.',
        priority: 'high',
        category: 'bug',
        status: 'resolved',
        assigned: true,
      },
      {
        title: 'Requested upgrade details for higher storage limit',
        description: 'We are reaching our storage quota. What are the pricing options to increase attachments limit up to 10GB?',
        priority: 'medium',
        category: 'billing',
        status: 'in_progress',
        assigned: false,
      },
      {
        title: 'VAPID keys generate failure on staging',
        description: 'Unable to trigger push notifications because public keys are mismatching. Server log displays VAPID config error.',
        priority: 'medium',
        category: 'technical',
        status: 'open',
        assigned: false,
      },
    ];

    const tickets = [];
    for (let i = 0; i < ticketDetails.length; i++) {
      const details = ticketDetails[i];
      
      const ticket = new Ticket({
        title: details.title,
        description: details.description,
        priority: details.priority,
        category: details.category,
        status: details.status,
        createdBy: user._id,
        assignedTo: details.assigned ? employee._id : null,
        resolvedAt: (details.status === 'resolved' || details.status === 'closed') ? new Date() : undefined,
        // Set sample comments
        comments: [
          {
            author: user._id,
            authorModel: 'User',
            text: 'I have raised this issue. Please take a look as soon as possible.',
            createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
          },
          ...(details.assigned ? [
            {
              author: employee._id,
              authorModel: 'Employee',
              text: 'Thanks for reporting. I am looking into this now and will update you shortly.',
              createdAt: new Date(Date.now() - 3600000), // 1 hour ago
            }
          ] : []),
        ],
      });

      await ticket.save();
      tickets.push(ticket);
    }

    // Update Employee assignedTickets list
    const assignedTicketIds = tickets
      .filter((t, index) => ticketDetails[index].assigned)
      .map(t => t._id);
    
    employee.assignedTickets = assignedTicketIds;
    await employee.save();

    console.log('Seeding finished successfully!');
    console.log(`Seeded: 1 User, 1 Employee, ${tickets.length} Tickets.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed with error:', error);
    process.exit(1);
  }
};

seedData();
