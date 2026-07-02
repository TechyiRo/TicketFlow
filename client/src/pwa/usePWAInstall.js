import { useState, useEffect } from 'react';

/**
 * Hook to manage PWA installation banner and prompts
 */
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed app window)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Listen for BeforeInstallPrompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show installable if they haven't explicitly dismissed it this session
      if (!isDismissed) {
        setIsInstallable(true);
      }
    };

    // Listen for AppInstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isDismissed]);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    
    setIsInstallable(false);
    deferredPrompt.prompt();
    
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the PWA install prompt');
    }
    
    setDeferredPrompt(null);
  };

  const dismissInstall = () => {
    setIsDismissed(true);
    setIsInstallable(false);
  };

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    promptInstall,
    dismissInstall,
  };
}

export default usePWAInstall;
