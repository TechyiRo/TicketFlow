import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Hook to manage push and local notifications
 * @param {string} token - JWT Access token for API authorization
 */
export function useNotifications(token) {
  const [permission, setPermission] = useState(
    'Notification' in window ? Notification.permission : 'denied'
  );
  const [subscription, setSubscription] = useState(null);

  // Get current active push subscription
  const getSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      return sub;
    } catch (err) {
      console.error('Failed to get push subscription:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    getSubscription();
  }, [getSubscription]);

  // Subscribe user to Web Push
  const subscribeUser = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        console.warn('VITE_VAPID_PUBLIC_KEY is not defined. Cannot subscribe to push notifications.');
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      setSubscription(sub);

      // Send to backend if token is available
      if (token) {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || '/api'}/push/subscribe`,
          { subscription: sub },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log('Push subscription registered on server.');
      }
    } catch (error) {
      console.error('Failed to subscribe user to Web Push:', error);
    }
  };

  // Request notification permissions
  const requestPermission = async () => {
    if (!('Notification' in window)) return 'default';

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        await subscribeUser();
      }
      return perm;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'default';
    }
  };

  // Trigger local notification
  const showLocalNotification = (title, body, options = {}) => {
    if (permission !== 'granted') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          ...options,
        });
      });
    } else {
      new Notification(title, { body, ...options });
    }
  };

  return {
    permission,
    subscription,
    requestPermission,
    showLocalNotification,
  };
}

export default useNotifications;
