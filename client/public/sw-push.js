/**
 * Production-grade Service Worker extension for handling Daily Schedule push notifications and background timers.
 */

// Internal state of scheduled reminders: array of { id, title, description, reminderTime, triggered: boolean }
let remindersSchedule = [];

// Periodic checker interval (every 30 seconds)
setInterval(() => {
  const now = new Date();
  
  remindersSchedule.forEach((item) => {
    if (!item.triggered && new Date(item.reminderTime) <= now) {
      item.triggered = true;
      
      // Trigger OS notification tray popup
      const options = {
        body: `Reminder: ${item.description || 'Your task is starting soon.'}`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [300, 100, 300, 100, 400],
        tag: item.id,
        requireInteraction: true,
        data: {
          itemId: item.id,
          url: '/schedule'
        },
        actions: [
          { action: 'mark_done', title: 'Mark Done' },
          { action: 'snooze', title: 'Snooze 10 Minutes' }
        ]
      };
      
      self.registration.showNotification(item.title, options);

      // Broadcast audio play command to all active client windows
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        windowClients.forEach((client) => {
          client.postMessage({
            type: 'PLAY_REMINDER_SOUND',
            itemId: item.id,
            title: item.title,
            description: item.description,
            time: new Date().toISOString()
          });
        });
      });
    }
  });
}, 30000);

// Listen for push events dispatched from the server
self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const notification = data.notification;

    const options = {
      body: notification.body,
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-72x72.png',
      vibrate: [300, 100, 300, 100, 400],
      data: notification.data || {},
      actions: [
        { action: 'mark_done', title: 'Mark Done' },
        { action: 'snooze', title: 'Snooze 10 Minutes' }
      ],
      tag: notification.data?.itemId || 'alert',
      requireInteraction: true,
    };

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(notification.title, options),
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
          windowClients.forEach((client) => {
            client.postMessage({
              type: 'PLAY_REMINDER_SOUND',
              itemId: notification.data?.itemId,
              title: notification.title,
              description: notification.body,
              time: new Date().toISOString()
            });
          });
        })
      ])
    );
  } catch (err) {
    console.error('Error handling service worker push event:', err);
  }
});

// Receive schedules from the page scripts
self.addEventListener('message', function(event) {
  const data = event.data;
  if (!data) return;

  switch (data.type) {
    case 'SCHEDULE_REMINDER': {
      // Remove any existing copy to prevent duplicates
      remindersSchedule = remindersSchedule.filter(r => r.id !== data.item.id);
      remindersSchedule.push({
        id: data.item.id,
        title: data.item.title,
        description: data.item.description,
        reminderTime: data.item.reminderTime,
        triggered: false
      });
      break;
    }
    case 'CANCEL_REMINDER': {
      remindersSchedule = remindersSchedule.filter(r => r.id !== data.id);
      break;
    }
    case 'SYNC_SCHEDULE': {
      if (Array.isArray(data.items)) {
        remindersSchedule = data.items.map(item => ({
          id: item._id,
          title: item.title,
          description: item.description,
          reminderTime: item.reminderTime,
          triggered: item.reminderStatus === 'delivered'
        }));
      }
      break;
    }
    case 'TRIGGER_TEST': {
      // Immediate OS tray notification for diagnostics
      const testOptions = {
        body: 'Your reminders are set up correctly and will appear here',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: 'test-reminder',
        requireInteraction: true,
        data: { url: '/schedule' }
      };
      self.registration.showNotification('TicketFlow Test Reminder', testOptions);
      break;
    }
    default:
      break;
  }
});

// Handle Notification Clicks (Mark Done / Snooze / Deep Links)
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const itemId = event.notification.data?.itemId;
  const actionToken = event.notification.data?.actionToken;
  const deepLink = event.notification.data?.url || '/schedule';

  if (event.action === 'mark_done' && itemId) {
    const url = actionToken 
      ? `/api/schedule/items/${itemId}/complete-bg?actionToken=${actionToken}`
      : `/api/schedule/items/${itemId}/complete-bg`;
      
    event.waitUntil(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then((res) => {
        if (!res.ok) console.error('Failed to mark task done in background.');
      })
    );
  } else if (event.action === 'snooze' && itemId) {
    const url = actionToken 
      ? `/api/schedule/items/${itemId}/snooze-bg?actionToken=${actionToken}`
      : `/api/schedule/items/${itemId}/snooze-bg`;
      
    event.waitUntil(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then((res) => {
        if (!res.ok) console.error('Failed to snooze task in background.');
      })
    );
  } else {
    // Open application and focus window
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes('/schedule') && 'focus' in client) {
            client.postMessage({ type: 'PLAY_REMINDER_SOUND', itemId, clicked: true });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(deepLink).then((win) => {
            if (win) setTimeout(() => win.postMessage({ type: 'PLAY_REMINDER_SOUND', itemId, clicked: true }), 1500);
          });
        }
      })
    );
  }
});
