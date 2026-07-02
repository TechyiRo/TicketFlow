import React from 'react';
import { X, Download } from 'lucide-react';
import usePWAInstall from '../../pwa/usePWAInstall';

/**
 * Install banner encouraging users to install TicketFlow PWA
 */
export function InstallBanner() {
  const { isInstallable, promptInstall, dismissInstall } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <>
      {/* Desktop Version: Sticky top banner below TopBar */}
      <div className="hidden sm:block w-full bg-background-surface border-b border-borderColor text-text-primary px-4 py-3 relative z-40 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-primary flex items-center justify-center overflow-hidden">
              <img src="/icons/icon-192x192.png" alt="TF" className="w-8 h-8 object-cover" />
            </div>
            <div>
              <p className="text-sm font-semibold">Install TicketFlow</p>
              <p className="text-xs text-text-secondary">
                Install for faster access and offline use — works like a native app.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={promptInstall}
              className="bg-accent-primary hover:bg-accent-glow text-white text-xs font-semibold px-4 py-2 rounded-md transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </button>
            <button
              onClick={dismissInstall}
              aria-label="Dismiss install banner"
              className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-background-elevated transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Version: Bottom Sheet sliding up from bottom (max-sm) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-background-elevated border-t border-borderColor px-6 py-6 pb-safe-bottom rounded-t-2xl shadow-2xl animate-slide-up">
        {/* Drag Handle Indicator */}
        <div className="w-12 h-1.5 bg-text-secondary/20 rounded-full mx-auto mb-4" />
        
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-accent-primary flex items-center justify-center overflow-hidden shadow-glow">
            <img src="/icons/icon-512x512.png" alt="TicketFlow" className="w-12 h-12 object-cover" />
          </div>
          
          <div>
            <h2 className="text-lg font-bold text-text-primary">TicketFlow App</h2>
            <p className="text-xs text-text-secondary mt-1">
              Add TicketFlow to your Home Screen for a faster, offline-ready experience.
            </p>
          </div>
          
          <div className="w-full flex flex-col gap-2 mt-2">
            <button
              onClick={promptInstall}
              className="w-full bg-accent-primary hover:bg-accent-glow text-white font-semibold py-3 rounded-xl transition-all shadow-glow text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Add to Home Screen
            </button>
            <button
              onClick={dismissInstall}
              className="w-full text-text-secondary hover:text-text-primary text-xs font-semibold py-2 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default InstallBanner;
