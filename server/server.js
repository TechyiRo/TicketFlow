const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const socketHandler = require('./socket/socketHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const chatRoutes = require('./routes/chatRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const pushRoutes = require('./routes/pushRoutes');

const app = express();
const server = http.createServer(app);

// Dynamic CORS Origin Validator
const dynamicOriginCheck = (origin, callback) => {
  if (!origin) return callback(null, true);
  
  const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  const isVercel = origin.endsWith('.vercel.app');
  const isCustomClient = process.env.CLIENT_URL && origin === process.env.CLIENT_URL;

  if (isLocalhost || isVercel || isCustomClient) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: dynamicOriginCheck,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  },
});

// Connect to Database
connectDB();

// Middlewares
app.use(cors({
  origin: dynamicOriginCheck,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Inject Socket.io into Express requests
app.use((req, res, next) => {
  req.io = io;
  next();
});

const adminRoutes = require('./routes/adminRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/messages', chatRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schedule', scheduleRoutes);

// Socket.io handlers
socketHandler(io);

// Root route handler
app.get('/', (req, res) => {
  res.json({ message: 'TicketFlow API Server is running.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const webpush = require('web-push');
const jwt = require('jsonwebtoken');
const ScheduleItem = require('./models/ScheduleItem');
const PushSubscription = require('./models/PushSubscription');
const FailedNotification = require('./models/FailedNotification');

// Start background schedule reminders daemon
const startReminderDaemon = () => {
  console.log('[Scheduler]: Initializing background reminder daemon...');

  // 1. Core reminder checker: runs every 60 seconds
  setInterval(async () => {
    try {
      const now = new Date();
      // Find items that are due for notification
      const dueItems = await ScheduleItem.find({
        reminderEnabled: true,
        reminderStatus: { $in: ['pending', 'snoozed'] },
        reminderTime: { $lte: now },
        isCompleted: false
      });

      for (const item of dueItems) {
        const subscriptions = await PushSubscription.find({ userId: item.userId });
        
        const actionToken = jwt.sign(
          { itemId: item._id.toString() }, 
          process.env.JWT_ACCESS_SECRET, 
          { expiresIn: '2h' }
        );

        let successCount = 0;
        let failCount = 0;

        const payload = JSON.stringify({
          notification: {
            title: item.title,
            body: `Reminder: ${item.description || 'Your task is starting soon'}`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: {
              itemId: item._id.toString(),
              actionToken,
              url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/schedule?date=${new Date(item.startTime).toISOString().split('T')[0]}`
            },
            actions: [
              { action: 'mark_done', title: 'Mark Done' },
              { action: 'snooze', title: 'Snooze 10m' }
            ]
          }
        });

        for (const subRecord of subscriptions) {
          try {
            await webpush.sendNotification(subRecord.subscription, payload);
            successCount++;
          } catch (err) {
            console.error(`[Scheduler]: Web Push delivery failed for endpoint:`, err.message);
            failCount++;
            
            // Clean up expired subscriptions automatically (standard Web Push practice)
            if (err.statusCode === 410 || err.statusCode === 404) {
              await PushSubscription.deleteOne({ _id: subRecord._id });
            }
          }
        }

        // Update item status
        item.reminderStatus = 'delivered';
        item.lastReminderFired = new Date();
        await item.save();

        // Log to FailedNotifications for retry tracking if any device delivery failed
        if (failCount > 0 && successCount === 0) {
          const existing = await FailedNotification.findOne({ scheduleItemId: item._id });
          if (!existing) {
            await FailedNotification.create({
              userId: item.userId,
              userModel: item.userModel,
              scheduleItemId: item._id,
              itemTitle: item.title,
              reminderTime: item.reminderTime,
              retryCount: 0,
              status: 'retrying'
            });
          }
        }
      }
    } catch (err) {
      console.error('[Scheduler]: Error in reminder check tick:', err);
    }
  }, 60 * 1000);

  // 2. Failed notification retry worker: runs every 5 minutes
  setInterval(async () => {
    try {
      const cutoffTime = new Date(Date.now() - 60 * 60000); // 1 hour ago
      
      // Resend retrying alerts
      const failedToRetry = await FailedNotification.find({
        status: 'retrying',
        createdAt: { $gte: cutoffTime }
      });

      for (const record of failedToRetry) {
        if (record.retryCount >= 12) {
          record.status = 'failed';
          await record.save();
          continue;
        }

        const subscriptions = await PushSubscription.find({ userId: record.userId });
        let success = false;
        
        const item = await ScheduleItem.findById(record.scheduleItemId);
        if (!item) continue;

        const actionToken = jwt.sign(
          { itemId: record.scheduleItemId.toString() }, 
          process.env.JWT_ACCESS_SECRET, 
          { expiresIn: '2h' }
        );

        const payload = JSON.stringify({
          notification: {
            title: `[Retry] ${record.itemTitle}`,
            body: `Missed Reminder: ${item.description || 'Your task has started'}`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: {
              itemId: record.scheduleItemId.toString(),
              actionToken,
              url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/schedule`
            },
            actions: [
              { action: 'mark_done', title: 'Mark Done' },
              { action: 'snooze', title: 'Snooze 10m' }
            ]
          }
        });

        for (const subRecord of subscriptions) {
          try {
            await webpush.sendNotification(subRecord.subscription, payload);
            success = true;
          } catch (err) {
            // failed sub
          }
        }

        record.retryCount += 1;
        record.lastAttempt = new Date();

        if (success) {
          record.status = 'delivered';
        }
        await record.save();
      }

      // Mark older retry alerts as permanently failed
      await FailedNotification.updateMany(
        { status: 'retrying', createdAt: { $lt: cutoffTime } },
        { $set: { status: 'failed' } }
      );
    } catch (err) {
      console.error('[Scheduler]: Failed retries error:', err);
    }
  }, 5 * 60 * 1000);
};

// Start Reminder Daemon
startReminderDaemon();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
