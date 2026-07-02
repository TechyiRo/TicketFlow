import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import useOnlineStatus from '../../pwa/useOnlineStatus';

/**
 * Offline banner component shown at the top of the layout when connection drops
 */
export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [show, setShow] = useState(false);
  const [syncFlash, setSyncFlash] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
      setSyncFlash(false);
    } else if (isOnline && wasOffline) {
      // Reconnected flash
      setSyncFlash(true);
      const timer = setTimeout(() => {
        setShow(false);
        setSyncFlash(false);
      }, 2500); // Show green bar for 2.5s
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOnline, wasOffline]);

  if (!show) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] transition-transform duration-500 ease-out transform translate-y-0 shadow-md ${
        syncFlash
          ? 'bg-accent-success text-white border-b-2 border-emerald-300'
          : 'bg-[#1E293B] text-text-primary border-l-4 border-accent-warning'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {syncFlash ? (
            <Wifi className="w-5 h-5 animate-pulse text-white" />
          ) : (
            <WifiOff className="w-5 h-5 text-accent-warning animate-bounce" />
          )}
          <span className="text-sm font-semibold select-none">
            {syncFlash
              ? 'Back online — syncing your queued actions...'
              : "You're offline — Viewing cached data. Changes will sync when you reconnect."}
          </span>
        </div>
      </div>
    </div>
  );
}

export default OfflineBanner;
