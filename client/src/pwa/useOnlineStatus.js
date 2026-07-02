import { useState, useEffect } from 'react';

/**
 * Custom hook to track online/offline status
 * @returns {Object} { isOnline: boolean, wasOffline: boolean }
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        // Dispatch custom reconnection event
        const event = new CustomEvent('pwa:reconnected');
        window.dispatchEvent(event);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}
export default useOnlineStatus;
