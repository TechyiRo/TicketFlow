import { registerSW } from 'virtual:pwa-register';

/**
 * Register the PWA service worker and configure update hooks
 */
export function setupPWA() {
  if ('serviceWorker' in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log('PWA Update available, prompt will show.');
        // Store update handler on window for UpdatePrompt component access
        window.__pwa_updateSW = updateSW;
        // Dispatch custom update event
        const event = new CustomEvent('pwa:updateAvailable');
        window.dispatchEvent(event);
      },
      onOfflineReady() {
        console.log('PWA is now ready for offline operation.');
        // Dispatch custom offline ready event
        const event = new CustomEvent('pwa:offlineReady');
        window.dispatchEvent(event);
      },
      onRegisteredSW(swUrl, registration) {
        if (registration) {
          // Check for service worker updates every 60 minutes
          setInterval(() => {
            console.log('Checking for PWA service worker updates...');
            registration.update();
          }, 60 * 60 * 1000); // 60 minutes
        }
      },
    });
  }
}

export default setupPWA;
