import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';
import TopBar from '../dashboard/TopBar';
import BottomTabBar from '../dashboard/BottomTabBar';
import OfflineBanner from '../pwa/OfflineBanner';
import InstallBanner from '../pwa/InstallBanner';
import UpdatePrompt from '../pwa/UpdatePrompt';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import ChatWindow from '../chat/ChatWindow';
import scheduleService from '../../services/scheduleService';
import { Bell, Check, Clock, X, Volume2 } from 'lucide-react';

/**
 * AppShell - Root wrapper after authentication
 */
export function AppShell({ children }) {
  const { user } = useAuth();
  const { activeTicketId } = useChat();
  const location = useLocation();

  // Prevent any browser window scroll bugs (e.g. keyboard focus or event clicks shifting viewport up)
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', handleScroll);
    window.scrollTo(0, 0);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const [missedReminders, setMissedReminders] = useState([]);
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);

  // Pre-load chime sound on page mount
  useEffect(() => {
    const preloadSound = async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const response = await fetch('/reminder.wav');
        const arrayBuffer = await response.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        audioBufferRef.current = decoded;
        console.log('[Audio] Preloaded reminder chime successfully.');
      } catch (err) {
        console.warn('[Audio] Preload failed, falling back to Web Audio synthesis:', err);
      }
    };
    preloadSound();
  }, []);

  // Professional alarm chime audio source player
  const playNotificationAlarm = () => {
    const ctx = audioContextRef.current;
    const buffer = audioBufferRef.current;
    if (ctx && buffer) {
      try {
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        console.log('[Audio] Played preloaded chime alert.');
        return;
      } catch (err) {
        console.warn('[Audio] Playback failed, running synthesizer fallback:', err);
      }
    }

    // High-tech synthesizer alarm chime fallback
    try {
      const synthCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (delay, freq, duration) => {
        const osc = synthCtx.createOscillator();
        const gain = synthCtx.createGain();
        osc.connect(gain);
        gain.connect(synthCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, synthCtx.currentTime + delay);
        gain.gain.setValueAtTime(0.35, synthCtx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.00001, synthCtx.currentTime + delay + duration);
        osc.start(synthCtx.currentTime + delay);
        osc.stop(synthCtx.currentTime + delay + duration);
      };

      playBeep(0, 987.77, 0.12);    // B5
      playBeep(0.15, 1318.51, 0.12); // E6
      playBeep(0.3, 987.77, 0.12);
      playBeep(0.45, 1318.51, 0.35);

      playBeep(1.0, 987.77, 0.12);
      playBeep(1.15, 1318.51, 0.12);
      playBeep(1.3, 987.77, 0.12);
      playBeep(1.45, 1318.51, 0.35);
    } catch (err) {
      console.warn('Audio Context block:', err);
    }
  };

  // Fetch reminders that were delivered while tab was hidden
  const checkMissedReminders = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const itemsList = await scheduleService.getItems(todayStr);
      const missed = itemsList.filter(item => 
        item.reminderEnabled && 
        item.reminderStatus === 'delivered' && 
        !item.isCompleted
      );
      setMissedReminders(missed);
    } catch (err) {
      console.warn('Failed to query missed reminders.');
    }
  };

  // Page Visibility and Service Worker message listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkMissedReminders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    checkMissedReminders();

    if ('serviceWorker' in navigator) {
      const handleServiceWorkerMessage = (event) => {
        if (event.data?.type === 'PLAY_REMINDER_SOUND') {
          playNotificationAlarm();
          
          // If clicked from background push, fetch details immediately
          if (event.data?.clicked) {
            checkMissedReminders();
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleMissedComplete = async (itemId) => {
    try {
      await scheduleService.completeItemInApp(itemId);
      setMissedReminders(prev => prev.filter(r => r._id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMissedSnooze = async (itemId) => {
    try {
      await scheduleService.snoozeItemInApp(itemId);
      setMissedReminders(prev => prev.filter(r => r._id !== itemId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissMissed = (itemId) => {
    setMissedReminders(prev => prev.filter(r => r._id !== itemId));
  };

  const handleDismissAllMissed = () => {
    setMissedReminders([]);
  };

  if (!user) return <>{children}</>;

  const isMessagesPage = location.pathname === '/messages';
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (isMobile && activeTicketId) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#030712] w-full h-[100dvh] h-[calc(var(--vh,1vh)*100)] flex flex-col overflow-hidden animate-slideUp">
        <ChatWindow />
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col w-full h-[100dvh] overflow-hidden bg-background-primary text-text-primary relative"
      style={{ minHeight: '-webkit-fill-available' }}
    >
      {/* Tech Glass background ambient orbs & Grid */}
      <div className="cyber-grid-overlay" />
      <div className="ambient-glow-orb-1" />
      <div className="ambient-glow-orb-2" />
      <div className="ambient-glow-orb-3" />

      {/* Offline Alert Banner */}
      <OfflineBanner />

      {/* Top Banner (PWA Install Banner on Desktop) */}
      <div className="w-full">
        <InstallBanner />
      </div>

      <div className="flex flex-1 w-full overflow-hidden relative p-0 md:p-4 gap-0 md:gap-4">
        {/* Sidebar: Visible on md and above */}
        <Sidebar />

        {/* Content Area */}
        <div className="flex flex-col flex-1 w-full overflow-hidden rounded-none md:rounded-2xl bg-transparent md:glass-panel md:shadow-glassShadow border-none md:border border-borderColor/20 relative">
          {/* TopBar Header */}
          <TopBar />

          {/* Main Body Scrollable */}
          <main className={`flex-1 w-full px-0 py-4 md:px-8 md:py-6 min-h-0 flex flex-col ${
            isMessagesPage 
              ? 'overflow-hidden pb-4 md:pb-6' 
              : 'overflow-y-auto pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-6'
          }`}>
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </main>

          {/* Portal target for modals that should cover the entire card */}
          <div id="card-modal-root" className="absolute inset-0 z-50 pointer-events-none rounded-2xl" />
        </div>
      </div>



      {/* Mobile Bottom Navigation: Visible on sm and below */}
      <BottomTabBar />

      {/* PWA Service Worker Update Prompt */}
      <UpdatePrompt />

      {/* Missed reminders background catch-up floating overlay */}
      {missedReminders.length > 0 && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-lg flex flex-col gap-2.5 pointer-events-auto select-none">
          <div className="glass-panel border-2 border-accent-warning/50 bg-[#0e1322]/95 rounded-2xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.6)] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-borderColor/10 pb-2">
              <span className="text-xs font-black text-accent-warning uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                <Volume2 className="w-4 h-4 animate-bounce" />
                Missed Reminders
              </span>
              <button
                onClick={handleDismissAllMissed}
                className="text-[9px] font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider bg-white/5 px-2 py-1 rounded"
              >
                Dismiss All
              </button>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {missedReminders.map((item) => (
                <div key={item._id} className="p-2.5 rounded-xl border border-borderColor/20 bg-background-elevated/5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-text-primary truncate">{item.title}</div>
                    <div className="text-[10px] text-text-secondary mt-0.5 leading-none">
                      Fired: {new Date(item.lastReminderFired || item.reminderTime || item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleMissedSnooze(item._id)}
                      className="px-2.5 py-1 rounded bg-[#1c253d] hover:bg-white/5 border border-borderColor/20 text-[9px] font-bold text-accent-warning uppercase tracking-wider touch-target"
                    >
                      Snooze
                    </button>
                    <button
                      onClick={() => handleMissedComplete(item._id)}
                      className="px-3 py-1 rounded bg-accent-success hover:bg-green-500 text-white text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 touch-target"
                    >
                      <Check className="w-3 h-3" />
                      Done
                    </button>
                    <button
                      onClick={() => handleDismissMissed(item._id)}
                      className="p-1 hover:bg-white/5 rounded text-text-secondary touch-target"
                      title="Dismiss Banner"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppShell;
