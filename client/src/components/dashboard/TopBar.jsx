import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useOnlineStatus from '../../pwa/useOnlineStatus';
import { Wifi, WifiOff, Bell, Check, Clock, X, Calendar } from 'lucide-react';
import scheduleService from '../../services/scheduleService';

// Import SVG avatars
import avatar1 from '../../assets/avatars/avatar1.svg';
import avatar2 from '../../assets/avatars/avatar2.svg';
import avatar3 from '../../assets/avatars/avatar3.svg';
import avatar4 from '../../assets/avatars/avatar4.svg';
import avatar5 from '../../assets/avatars/avatar5.svg';
import avatar6 from '../../assets/avatars/avatar6.svg';
import avatar7 from '../../assets/avatars/avatar7.svg';
import avatar8 from '../../assets/avatars/avatar8.svg';

const avatarMap = {
  avatar1, avatar2, avatar3, avatar4,
  avatar5, avatar6, avatar7, avatar8
};

/**
 * TopBar - Header navbar
 */
export function TopBar() {
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();
  const location = useLocation();

  const [showReminders, setShowReminders] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [timeTick, setTimeTick] = useState(0);
  const dropdownRef = useRef(null);

  // Fetch reminders for today
  const fetchReminders = async () => {
    try {
      if (user) {
        const todayStr = new Date().toISOString().split('T')[0];
        const itemsList = await scheduleService.getItems(todayStr);
        const reminderItems = itemsList.filter(item => item.reminderEnabled);
        setReminders(reminderItems);
        
        // Unread count is reminders that are delivered (fired) and not completed
        const unread = reminderItems.filter(item => item.reminderStatus === 'delivered' && !item.isCompleted).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn('Could not fetch reminders for notification bar.');
    }
  };

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [user]);

  // Update countdown timers every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(t => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowReminders(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCountdownText = (item) => {
    if (item.isCompleted) return 'Completed';
    if (item.reminderStatus === 'delivered') return 'Fired';
    
    const diff = new Date(item.reminderTime).getTime() - Date.now();
    if (diff <= 0) return 'Due';

    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `In ${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `In ${hrs}h ${mins % 60}m`;
  };

  const handleSnooze = async (item) => {
    if (item.snoozeCount >= 3) {
      alert('Maximum snooze limit (3) reached.');
      return;
    }
    try {
      await scheduleService.snoozeItemInApp(item._id);
      fetchReminders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (item) => {
    try {
      await scheduleService.completeItemInApp(item._id);
      fetchReminders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      for (const item of reminders) {
        if (!item.isCompleted && item.reminderStatus === 'delivered') {
          await scheduleService.completeItemInApp(item._id);
        }
      }
      fetchReminders();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  // Resolve header title from path
  const getHeaderTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/my-tickets':
      case '/all-tickets':
        return 'Ticket Management';
      case '/assigned-tickets':
        return 'Assigned Tickets';
      case '/messages':
        return 'Messages Support';
      case '/profile':
        return 'My Profile';
      case '/schedule':
        return 'Daily Schedule';
      default:
        return 'TicketFlow';
    }
  };

  const userAvatar = avatarMap[user.avatar] || user.avatar || avatarMap.avatar1;

  return (
    <>
      {/* DESKTOP HEADER: Visible on md and above */}
      <header className="hidden md:flex h-16 border-b border-white/5 bg-transparent items-center justify-between px-6 shrink-0 z-20 w-full select-none">
        {/* Title */}
        <div>
          <h1 className="text-base md:text-lg font-bold text-text-primary uppercase tracking-wider">
            {getHeaderTitle()}
          </h1>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-4 relative">
          {/* Reminder notification bell dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowReminders(!showReminders)}
              className={`p-2 rounded-xl border border-borderColor/30 bg-background-elevated/10 text-text-secondary hover:text-text-primary transition-all relative touch-target ${
                unreadCount > 0 ? 'animate-pulse text-accent-cyan shadow-[0_0_10px_rgba(0,240,255,0.15)] border-accent-cyan/45' : ''
              }`}
              title="Schedules Reminders Alert Feed"
            >
              <Bell className={`w-4.5 h-4.5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-accent-danger rounded-full text-[9px] font-black text-white flex items-center justify-center border border-[#0d121f]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Bell Dropdown panel */}
            {showReminders && (
              <div className="absolute right-0 mt-2.5 z-50 w-80 glass-panel border border-borderColor/20 rounded-2xl bg-[#0e1322] shadow-[0_8px_32px_rgba(0,0,0,0.55)] p-4 flex flex-col gap-3 animate-scaleUp">
                <div className="flex items-center justify-between border-b border-borderColor/10 pb-2">
                  <span className="text-xs font-black text-text-primary uppercase tracking-wider">
                    Schedules Reminders
                  </span>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleClearAll}
                        className="text-[9px] font-bold text-accent-cyan hover:underline uppercase tracking-wider"
                      >
                        Clear Alerts
                      </button>
                    )}
                    <button 
                      onClick={() => setShowReminders(false)}
                      className="text-text-secondary hover:text-text-primary touch-target"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Items Feed list */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1 min-h-[50px] flex flex-col justify-start">
                  {reminders.length > 0 ? (
                    reminders.map((item) => {
                      const isFired = item.reminderStatus === 'delivered';
                      return (
                        <div 
                          key={item._id} 
                          className={`p-2.5 rounded-xl border flex flex-col gap-1.5 text-[11px] transition-all bg-background-elevated/5 ${
                            item.isCompleted 
                              ? 'border-borderColor/20 opacity-45' 
                              : isFired 
                                ? 'border-accent-warning/35 bg-accent-warning/5 text-text-primary' 
                                : 'border-borderColor/30 text-text-secondary'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold truncate max-w-[150px] text-text-primary">
                              {item.title}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                              item.isCompleted 
                                ? 'text-text-secondary/40' 
                                : isFired 
                                  ? 'text-accent-warning animate-pulse' 
                                  : 'text-accent-cyan'
                            }`}>
                              <Clock className="w-2.5 h-2.5" />
                              {getCountdownText(item)}
                            </span>
                          </div>

                          <p className="text-[10px] leading-relaxed line-clamp-2 text-text-secondary/80">
                            {item.description}
                          </p>

                          {!item.isCompleted && isFired && (
                            <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-borderColor/5">
                              <button
                                onClick={() => handleSnooze(item)}
                                className="px-2 py-1 rounded bg-[#1c253d] hover:bg-white/5 border border-borderColor/20 text-[9px] font-bold text-accent-warning uppercase tracking-wider touch-target"
                              >
                                Snooze 10m
                              </button>
                              <button
                                onClick={() => handleComplete(item)}
                                className="px-2.5 py-1 rounded bg-accent-success hover:bg-green-500 text-white text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1 touch-target shadow-md shadow-green-950/15"
                              >
                                <Check className="w-2.5 h-2.5" />
                                Mark Done
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-[10px] text-text-secondary/40 italic">
                      No reminders set for today.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Connection status indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold select-none ${
            isOnline 
              ? 'bg-accent-success/15 text-accent-success border border-accent-success/20' 
              : 'bg-accent-danger/15 text-accent-danger border border-accent-danger/20'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-accent-success" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-accent-danger animate-pulse" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* User Info and Mini-profile */}
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-text-primary leading-none">{user.fullName}</span>
              <span className="text-[10px] text-text-secondary mt-1 uppercase tracking-widest">{user.role}</span>
            </div>
            <div className="w-9 h-9 rounded-full border border-borderColor bg-background-primary p-0.5 overflow-hidden shadow-sm">
              <img src={userAvatar} alt={user.fullName} className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE SLIM HEADER: Visible on mobile viewport */}
      <header className="flex md:hidden fixed top-0 left-0 right-0 z-40 bg-[#030712]/90 backdrop-blur-md border-b border-borderColor/35 items-center justify-between px-4 pt-[env(safe-area-inset-top)] h-[calc(56px+env(safe-area-inset-top))] select-none shrink-0 w-full">
        {/* TicketFlow Logo */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black tracking-wider text-accent-cyan uppercase">TicketFlow</span>
        </div>

        {/* Bell dropdown triggers */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowReminders(!showReminders)}
            className={`p-2 rounded-xl border border-borderColor/30 bg-background-elevated/10 text-text-secondary hover:text-text-primary transition-all relative touch-target ${
              unreadCount > 0 ? 'animate-pulse text-accent-cyan shadow-[0_0_10px_rgba(0,240,255,0.15)] border-accent-cyan/45' : ''
            }`}
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-accent-danger rounded-full text-[9px] font-black text-white flex items-center justify-center border border-[#0d121f]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Mobile Reminders Dropdown Panel */}
          {showReminders && (
            <div className="absolute right-0 mt-2.5 z-50 w-72 glass-panel border border-borderColor/20 rounded-2xl bg-[#0e1322] shadow-[0_8px_32px_rgba(0,0,0,0.55)] p-4 flex flex-col gap-3 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-[#ffffff]/10 pb-2">
                <span className="text-xs font-black text-text-primary uppercase tracking-wider">
                  Reminders
                </span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-[9px] font-bold text-accent-cyan hover:underline uppercase tracking-wider"
                    >
                      Clear
                    </button>
                  )}
                  <button 
                    onClick={() => setShowReminders(false)}
                    className="text-text-secondary hover:text-text-primary touch-target"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Items Feed list */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 min-h-[50px] flex flex-col justify-start">
                {reminders.length > 0 ? (
                  reminders.map((item) => {
                    const isFired = item.reminderStatus === 'delivered';
                    return (
                      <div 
                        key={item._id} 
                        className={`p-2 rounded-xl border flex flex-col gap-1 text-[10px] transition-all bg-background-elevated/5 ${
                          item.isCompleted 
                            ? 'border-borderColor/20 opacity-45' 
                            : isFired 
                              ? 'border-accent-warning/35 bg-accent-warning/5 text-text-primary' 
                              : 'border-borderColor/30 text-text-secondary'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold truncate max-w-[120px] text-text-primary">
                            {item.title}
                          </span>
                          <span className="text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 text-accent-cyan">
                            {getCountdownText(item)}
                          </span>
                        </div>
                        <p className="text-[9px] leading-relaxed line-clamp-2 text-text-secondary/80">
                          {item.description}
                        </p>
                        {!item.isCompleted && isFired && (
                          <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-borderColor/5">
                            <button
                              onClick={() => handleSnooze(item)}
                              className="px-2 py-0.5 rounded bg-[#1c253d] border border-borderColor/20 text-[8px] font-bold text-accent-warning uppercase tracking-wider touch-target"
                            >
                              Snooze
                            </button>
                            <button
                              onClick={() => handleComplete(item)}
                              className="px-2 py-0.5 rounded bg-accent-success text-white text-[8px] font-extrabold uppercase tracking-wider touch-target"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center text-[10px] text-text-secondary/40 italic">
                    No reminders.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
      {/* Mobile spacer */}
      <div className="md:hidden h-[calc(56px+env(safe-area-inset-top))] w-full shrink-0" />
    </>
  );
}

export default TopBar;
