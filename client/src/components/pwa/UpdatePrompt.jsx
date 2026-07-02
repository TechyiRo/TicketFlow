import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

/**
 * Toast prompt displayed when a new PWA service worker is waiting to be activated
 */
export function UpdatePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setShow(true);
    };

    window.addEventListener('pwa:updateAvailable', handleUpdateAvailable);
    return () => {
      window.removeEventListener('pwa:updateAvailable', handleUpdateAvailable);
    };
  }, []);

  const handleReload = () => {
    if (window.__pwa_updateSW) {
      window.__pwa_updateSW(true);
    } else {
      window.location.reload();
    }
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 max-w-sm w-full bg-background-elevated border border-borderColor rounded-xl p-4 shadow-glow flex flex-col gap-3 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-accent-primary/10 text-accent-primary rounded-lg border border-accent-primary/20 mt-0.5">
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-text-primary">Update Available</h3>
          <p className="text-xs text-text-secondary mt-1">
            A new version of TicketFlow is ready. Reload to apply updates.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-text-secondary hover:text-text-primary transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={handleDismiss}
          className="text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-background-surface text-text-secondary hover:text-text-primary transition-all"
        >
          Later
        </button>
        <button
          onClick={handleReload}
          className="bg-accent-primary hover:bg-accent-glow text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-all shadow-glow flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reload Now
        </button>
      </div>
    </div>
  );
}

export default UpdatePrompt;
