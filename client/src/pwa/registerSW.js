/**
 * Register the PWA service worker and configure Web Push subscription parameters
 */

const VAPID_PUBLIC_KEY = 'BC3PaHQhH1cQ2k7rZEfd8ZtD1-AMPeUDRmGm1doGz7ASu22dv5Dan-MWYj8SIcFfabpmpXN6s4Bkl5JS9kAurwE';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function syncPushSubscription(registration) {
  if (!registration || !('pushManager' in registration)) {
    console.warn('Push messaging is not supported in this browser or sw registration is missing.');
    return;
  }

  // Ensure device fingerprint exists in localStorage
  let fingerprint = localStorage.getItem('device_fingerprint');
  if (!fingerprint) {
    fingerprint = 'device-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
    localStorage.setItem('device_fingerprint', fingerprint);
  }

  // Retrieve auth token
  const { getAccessToken } = await import('../services/api');
  const token = getAccessToken();
  if (!token) {
    console.log('[PushSubscription]: No active user token found. Skipping registration sync.');
    return;
  }

  try {
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('[PushSubscription]: Requesting Web Push subscription...');
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    }

    const getApiUrl = () => {
      let base = import.meta.env.VITE_API_BASE_URL;
      if (!base && typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
        base = 'https://ticketflow-33vf.onrender.com/api';
      }
      if (!base) base = '/api';
      if (base.includes('onrender.com') && !base.endsWith('/api') && !base.endsWith('/api/')) {
        base = base.endsWith('/') ? `${base}api` : `${base}/api`;
      }
      return base + '/push/subscribe';
    };

    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        subscription,
        deviceFingerprint: fingerprint
      })
    });

    if (response.ok) {
      console.log('[PushSubscription]: Synchronized subscription metadata with the backend database.');
    } else {
      console.warn('[PushSubscription]: Backend registration rejected subscription sync.');
    }
  } catch (err) {
    console.error('[PushSubscription]: Failed to setup push subscription:', err);
  }
}

export function setupPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swPath = import.meta.env.DEV ? '/dev-sw.js?dev-sw' : '/sw.js';
      navigator.serviceWorker.register(swPath, { scope: '/' })
        .then(async (registration) => {
          console.log('ServiceWorker registered with scope:', registration.scope);
          
          window.__swRegistration = registration;

          // Check for service worker updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Synchronize push subscription
          await syncPushSubscription(registration);
        })
        .catch((err) => {
          console.error('ServiceWorker registration failed:', err);
        });
    });
  }
}

export default setupPWA;
