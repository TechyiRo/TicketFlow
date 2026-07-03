/**
 * Service Worker extension for handling Daily Schedule push notifications, IndexedDB reminders synchronization, and deep linking actions.
 */

const DB_NAME = 'TicketFlowRemindersDB';
const DB_VERSION = 1;
const STORE_NAME = 'reminders';

const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

const getStoredReminders = async () => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('IDB getStoredReminders error:', err);
    return [];
  }
};

const saveStoredReminders = async (reminders) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    for (const item of reminders) {
      store.put(item);
    }
  } catch (err) {
    console.error('IDB saveStoredReminders error:', err);
  }
};

const removeStoredReminder = async (id) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
  } catch (err) {
    console.error('IDB removeStoredReminder error:', err);
  }
};

// Background reminder check loop (runs every 30 seconds)
setInterval(async () => {
  try {
    const now = new Date();
    const stored = await getStoredReminders();
    let modified = false;

    for (const item of stored) {
      if (!item.triggered && new Date(item.reminderTime) <= now) {
        item.triggered = true;
        modified = true;

        const options = {
          body: `Reminder: ${item.description || 'Your task is starting soon.'}`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          vibrate: [300, 100, 300, 100, 400],
          tag: `schedule-${item.id}`,
          requireInteraction: true,
          data: {
            itemId: item.id,
            url: `/schedule?date=${new Date(item.reminderTime).toISOString().split('T')[0]}`
          },
          actions: [
            { action: 'mark_done', title: 'Mark Done' },
            { action: 'snooze', title: 'Snooze 10 Minutes' }
          ]
        };

        self.registration.showNotification(item.title, options);

        // Notify active windows to play sound alert
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
    }

    if (modified) {
      await saveStoredReminders(stored);
    }
  } catch (err) {
    console.error('Error in background reminder loop:', err);
  }
}, 30000);

// Web Push event listener
self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const payload = event.data.json();

    const options = {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: payload.tag || 'generic-notification',
      renotify: true,
      data: {
        url: payload.url || '/dashboard',
        ticketId: payload.ticketId,
        itemId: payload.itemId,
        type: payload.type
      }
    };

    if (payload.type === 'CALL') {
      options.vibrate = [500, 250, 500, 250, 500, 250, 500, 250, 500];
    }

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(payload.title, options),
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
          windowClients.forEach((client) => {
            client.postMessage({
              type: 'INCOMING_PUSH_ALERT',
              notificationType: payload.type,
              ticketId: payload.ticketId,
              itemId: payload.itemId,
              title: payload.title,
              body: payload.body,
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

// Message listener for page schedule sync calls
self.addEventListener('message', async function(event) {
  const data = event.data;
  if (!data) return;

  switch (data.type) {
    case 'SET_REMINDERS':
    case 'SYNC_SCHEDULE': {
      if (Array.isArray(data.items)) {
        const itemsMapped = data.items.map(item => ({
          id: item._id || item.id,
          title: item.title,
          description: item.description,
          reminderTime: item.reminderTime,
          triggered: item.reminderStatus === 'delivered'
        }));
        await saveStoredReminders(itemsMapped);
      }
      break;
    }
    case 'SCHEDULE_REMINDER': {
      const stored = await getStoredReminders();
      const filtered = stored.filter(r => r.id !== data.item.id);
      filtered.push({
        id: data.item.id,
        title: data.item.title,
        description: data.item.description,
        reminderTime: data.item.reminderTime,
        triggered: false
      });
      await saveStoredReminders(filtered);
      break;
    }
    case 'CANCEL_REMINDER': {
      await removeStoredReminder(data.id);
      break;
    }
    case 'TRIGGER_TEST': {
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

  const data = event.notification.data || {};
  const deepLink = data.url || '/dashboard';
  const itemId = data.itemId;

  if (event.action === 'mark_done' && itemId) {
    event.waitUntil(
      fetch(`/api/schedule/items/${itemId}/complete-bg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then((res) => {
        if (!res.ok) console.error('Failed to mark task done in background.');
      })
    );
    return;
  } else if (event.action === 'snooze' && itemId) {
    event.waitUntil(
      fetch(`/api/schedule/items/${itemId}/snooze-bg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).then((res) => {
        if (!res.ok) console.error('Failed to snooze task in background.');
      })
    );
    return;
  }

  // Navigate & focus
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.postMessage({ 
            type: 'NOTIFICATION_CLICKED', 
            url: deepLink,
            ticketId: data.ticketId,
            itemId: data.itemId,
            notificationType: data.type
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(deepLink);
      }
    })
  );
});
