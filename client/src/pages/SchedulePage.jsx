import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import scheduleService from '../services/scheduleService';
import WeeklyMiniCalendar from '../components/schedule/WeeklyMiniCalendar';
import ScheduleItemCard from '../components/schedule/ScheduleItemCard';
import AddScheduleItemModal from '../components/schedule/AddScheduleItemModal';
import AdminScheduleOverview from '../components/schedule/AdminScheduleOverview';
import { Calendar, Plus, ChevronLeft, ChevronRight, Bell, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function SchedulePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [items, setItems] = useState([]);
  const [weekItemsMap, setWeekItemsMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Notifications permission banner flags
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [failedAlerts, setFailedAlerts] = useState([]);

  // Time marker percentage tracking
  const [currentTimePercent, setCurrentTimePercent] = useState(-1);

  const isAdmin = user?.role === 'admin';

  // Check web push notification permissions on mount
  useEffect(() => {
    const syncPushSubscription = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      try {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = "BC3PaHQhH1cQ2k7rZEfd8ZtD1-AMPeUDRmGm1doGz7ASu22dv5Dan-MWYj8SIcFfabpmpXN6s4Bkl5JS9kAurwE";
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });
        }
        await scheduleService.subscribePush(subscription);
        console.log('[Push] Subscription auto-synced successfully.');
      } catch (err) {
        console.warn('[Push] Auto-sync failed:', err);
      }
    };

    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        setShowPermissionBanner(true);
      } else if (Notification.permission === 'granted') {
        syncPushSubscription();
      }
    }
    fetchFailedAlerts();
  }, []);

  // Fetch failed notification alerts
  const fetchFailedAlerts = async () => {
    try {
      if (navigator.onLine) {
        const alerts = await scheduleService.getFailedNotifications();
        setFailedAlerts(alerts);
      }
    } catch (err) {
      console.warn('Failed to retrieve notification reports.');
    }
  };

  const clearFailedAlerts = async () => {
    try {
      await scheduleService.clearFailedNotifications();
      setFailedAlerts([]);
      toast.success('Failed notification warnings cleared.');
    } catch (err) {
      console.error(err);
    }
  };

  // Convert VAPID key base64 to UInt8Array for browser push manager
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Trigger web push native prompts
  const handleAllowNotifications = async () => {
    setShowPermissionBanner(false);
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Push notifications are not supported on this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Register SW & subscribe push
        const registration = await navigator.serviceWorker.ready;
        
        // Grab VAPID key
        const vapidPublicKey = "BC3PaHQhH1cQ2k7rZEfd8ZtD1-AMPeUDRmGm1doGz7ASu22dv5Dan-MWYj8SIcFfabpmpXN6s4Bkl5JS9kAurwE";
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        // Register subscription with DB
        await scheduleService.subscribePush(subscription);
        toast.success('Notification permissions granted! Push Reminders armed.');
      } else {
        toast.error('Notification permissions denied.');
      }
    } catch (err) {
      console.error('Push registration failed:', err);
      toast.error('Could not subscribe device to push notifications.');
    }
  };

  // Local date formatting helper (YYYY-MM-DD)
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load items on selected date
  const loadScheduleData = async () => {
    try {
      setLoading(true);
      const dateStr = getLocalDateString(selectedDate);
      const itemsList = await scheduleService.getItems(dateStr);
      setItems(itemsList);

      // Sync loaded reminders list with service worker background scheduler
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_SCHEDULE',
          items: itemsList
        });
      }

      // Load mini-calendar dots maps (fetch surrounding items for week mapping)
      const current = new Date(selectedDate);
      const day = current.getDay();
      const dist = day === 0 ? -6 : 1 - day;
      const monday = new Date(current);
      monday.setDate(current.getDate() + dist);

      const weekMap = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dayStr = getLocalDateString(d);
        // Retrieve elements for week calendar
        const dayItems = await scheduleService.getItems(dayStr);
        weekMap[dayStr] = dayItems;
      }
      setWeekItemsMap(weekMap);
    } catch (err) {
      console.error('Failed to load schedule items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      loadScheduleData();
    }
  }, [selectedDate, isAdmin]);

  // Calculate timeline start/end percentages (8 AM to 10 PM)
  const getTimelinePercent = (time) => {
    const d = new Date(time);
    const hr = d.getHours();
    const min = d.getMinutes();
    const totalMinutes = hr * 60 + min;
    const startLimit = 8 * 60; // 8 AM
    const endLimit = 22 * 60; // 10 PM

    if (totalMinutes < startLimit) return 0;
    if (totalMinutes > endLimit) return 100;
    return ((totalMinutes - startLimit) / (endLimit - startLimit)) * 100;
  };

  // Keep moving vertical current-time marker in sync
  useEffect(() => {
    const updateTimeMarker = () => {
      const now = new Date();
      const hr = now.getHours();
      if (hr >= 8 && hr <= 22 && now.toDateString() === selectedDate.toDateString()) {
        const pct = getTimelinePercent(now);
        setCurrentTimePercent(pct);
      } else {
        setCurrentTimePercent(-1);
      }
    };
    updateTimeMarker();
    const interval = setInterval(updateTimeMarker, 60000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const triggerTestNotification = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'TRIGGER_TEST' });
      toast.success('Test notification triggered from Service Worker.');
    } else {
      toast.error('Service worker is not active or controlled. Please reload.');
    }
  };

  // Navigate dates
  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  // CRUD events
  const handleSaveItem = async (formData) => {
    try {
      const payload = {
        ...formData,
        dateStr: getLocalDateString(new Date(formData.startTime))
      };
      if (editingItem) {
        await scheduleService.updateItem(editingItem._id, payload);
        toast.success('Schedule item updated successfully.');
      } else {
        await scheduleService.createItem(payload);
        toast.success('New work item planned.');
      }
      setIsModalOpen(false);
      setEditingItem(null);
      loadScheduleData();
    } catch (err) {
      console.error(err);
      toast.error('Could not save schedule item details.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await scheduleService.deleteItem(itemId);
      toast.success('Schedule item deleted.');
      loadScheduleData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete item.');
    }
  };

  const handleToggleComplete = async (itemId) => {
    try {
      await scheduleService.toggleComplete(itemId);
      loadScheduleData();
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Format Header Display Date
  const formatHeaderDate = () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = selectedDate.toLocaleDateString('en-US', options);
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    return isToday ? `Today - ${dateStr}` : dateStr;
  };

  const isPast = selectedDate.setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
  const activeTasks = items.filter(i => !i.isCompleted);
  const completedTasks = items.filter(i => i.isCompleted);

  return (
    <div className="space-y-6 flex-1 min-h-0 flex flex-col">
      {/* Animations style overrides */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes rotatingGlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-glow {
          animation: rotatingGlow 5s linear infinite;
        }
        @keyframes radarSweep {
          0% { left: -15%; }
          100% { left: 115%; }
        }
        .radar-sweep-bar {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 15%;
          background: linear-gradient(to right, transparent, rgba(0, 240, 255, 0.12), transparent);
          animation: radarSweep 5s linear infinite;
        }
      `}} />

      {/* 1. Header controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 select-none shrink-0 bg-[#0e1322]/30 border border-borderColor/10 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrevDay} 
            className="p-2 hover:bg-white/5 border border-borderColor/30 rounded-xl text-text-secondary hover:text-text-primary transition-all active:scale-90 touch-target"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="text-center md:text-left min-w-[200px]">
            <span className="text-[10px] font-extrabold text-accent-cyan uppercase tracking-widest block leading-none">
              Planner View
            </span>
            <h2 className={`text-base font-black text-text-primary mt-1.5 leading-none ${isPast ? 'text-text-secondary/55' : ''}`}>
              {formatHeaderDate()}
            </h2>
          </div>

          <button 
            onClick={handleNextDay} 
            className="p-2 hover:bg-white/5 border border-borderColor/30 rounded-xl text-text-secondary hover:text-text-primary transition-all active:scale-90 touch-target"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action button with spinning glow ring border */}
        <div className="relative w-44 h-10 rounded-xl overflow-hidden group shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-accent-primary to-accent-cyan opacity-80 group-hover:opacity-100 blur-sm spin-glow" />
          <button
            onClick={openAddModal}
            className="absolute inset-[1px] bg-[#0d111d] hover:bg-[#111727] text-white font-extrabold tracking-wider text-xs uppercase flex items-center justify-center gap-2 rounded-xl transition-colors touch-target"
          >
            <Plus className="w-4 h-4 text-accent-cyan" />
            Add Work Item
          </button>
        </div>
      </div>

      {/* 2. Push notification alerts banners */}
      {showPermissionBanner && (
        <div className="glass-panel border-2 border-accent-cyan/45 p-4 rounded-xl flex items-center justify-between gap-4 bg-background-elevated/20 shrink-0 select-none animate-slideDown">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-accent-cyan shrink-0 animate-bounce" />
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black text-text-primary">Enable Browser Push Reminders</span>
              <span className="text-[11px] text-text-secondary">Get real device lockscreen notifications for upcoming daily work schedule reminders.</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setShowPermissionBanner(false)}
              className="px-3 h-8 hover:bg-white/5 text-xs text-text-secondary rounded-lg font-bold transition-all touch-target"
            >
              Not Now
            </button>
            <button 
              onClick={handleAllowNotifications}
              className="px-4.5 h-8 bg-accent-cyan text-background-primary rounded-lg text-xs font-black uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-cyan-900/10 touch-target"
            >
              Allow
            </button>
          </div>
        </div>
      )}

      {failedAlerts.length > 0 && (
        <div className="glass-panel border border-accent-danger/55 p-4 rounded-xl flex items-center justify-between gap-4 bg-background-elevated/20 shrink-0 select-none animate-slideDown">
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle className="w-5 h-5 text-accent-danger shrink-0 animate-pulse" />
            <div className="min-w-0">
              <span className="text-xs font-black text-text-primary">Missed Reminders Report</span>
              <p className="text-[11px] text-text-secondary truncate mt-0.5">
                The following reminders failed to deliver while offline: {failedAlerts.map(a => `"${a.itemTitle}"`).join(', ')}
              </p>
            </div>
          </div>
          <button 
            onClick={clearFailedAlerts}
            className="p-1 hover:bg-white/5 rounded-lg text-text-secondary hover:text-text-primary transition-colors shrink-0 touch-target"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Main Views Grid splitter */}
      {isAdmin ? (
        <div className="flex-1 overflow-y-auto">
          <AdminScheduleOverview selectedDate={selectedDate} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* Main items listing (8 columns) */}
          <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
            
            {/* Timeline view */}
            <div className="glass-panel border border-borderColor/20 p-5 rounded-2xl bg-background-elevated/5 shrink-0 select-none flex flex-col gap-3.5 relative overflow-hidden">
              {/* Passing radar light sweeps */}
              <div className="radar-sweep-bar" />

              <div className="flex justify-between items-center relative z-10">
                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block">
                  Timeline distribution
                </span>
                <span className="text-[9px] font-bold text-accent-cyan uppercase tracking-wider">
                  8:00 AM &mdash; 10:00 PM
                </span>
              </div>

              {/* Graphical Timeline Bar */}
              <div className="h-6 bg-background-primary/45 rounded-xl border border-borderColor/30 relative flex items-center px-2 select-none z-10">
                
                {/* Horizontal line */}
                <div className="absolute inset-x-4 h-[1px] bg-borderColor/40" />

                {/* Plot items as glowing markers */}
                {items.map((item) => {
                  const pct = getTimelinePercent(item.startTime);
                  
                  let dotColor = 'bg-accent-cyan shadow-[0_0_8px_#00f0ff]';
                  if (item.category === 'meeting') dotColor = 'bg-accent-purple shadow-[0_0_8px_#8b5cf6]';
                  if (item.category === 'personal') dotColor = 'bg-accent-warning shadow-[0_0_8px_#f59e0b]';
                  if (item.category === 'urgent') dotColor = 'bg-accent-danger shadow-[0_0_8px_#ef4444]';

                  return (
                    <div 
                      key={item._id}
                      className={`absolute w-3.5 h-3.5 rounded-full border border-background-elevated cursor-help transition-transform hover:scale-125 z-20 ${dotColor}`}
                      style={{ left: `calc(${pct}% - 7px)` }}
                      title={`${item.title} at ${new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    />
                  );
                })}

                {/* Vertical time marker */}
                {currentTimePercent > -1 && (
                  <div 
                    className="absolute top-0 bottom-0 w-[1.5px] bg-accent-cyan z-30 flex items-center justify-center"
                    style={{ left: `${currentTimePercent}%` }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan shadow-[0_0_10px_#00f0ff] animate-ping" />
                  </div>
                )}
              </div>
            </div>

            {/* Chronological list container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-6 pb-6 min-h-0">
              
              {/* Loading indicator */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-xs text-text-secondary gap-2.5">
                  <svg className="animate-spin h-6 w-6 text-accent-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading planned work items...</span>
                </div>
              ) : items.length > 0 ? (
                <>
                  {/* Active list section */}
                  {activeTasks.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest pl-1">
                        Planned Tasks ({activeTasks.length})
                      </h3>
                      {activeTasks.map((item) => (
                        <ScheduleItemCard
                          key={item._id}
                          item={item}
                          onEdit={openEditModal}
                          onDelete={handleDeleteItem}
                          onToggleComplete={handleToggleComplete}
                        />
                      ))}
                    </div>
                  )}

                  {/* Completed list section */}
                  {completedTasks.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-bold text-text-secondary/50 uppercase tracking-widest pl-1">
                        Completed Tasks ({completedTasks.length})
                      </h3>
                      {completedTasks.map((item) => (
                        <ScheduleItemCard
                          key={item._id}
                          item={item}
                          onEdit={openEditModal}
                          onDelete={handleDeleteItem}
                          onToggleComplete={handleToggleComplete}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-xs text-text-secondary border border-dashed border-borderColor/25 rounded-2xl bg-[#0e1322]/10 select-none">
                  <Calendar className="w-8 h-8 text-text-secondary/30 mb-2" />
                  <span className="font-bold">No tasks scheduled</span>
                  <span className="text-[10px] text-text-secondary mt-1">Plan items for this date by clicking Add Work Item.</span>
                </div>
              )}

            </div>

          </div>

          {/* Right calendar sidebar (4 columns) */}
          <div className="lg:col-span-4 shrink-0 min-w-[280px] space-y-5">
            <WeeklyMiniCalendar 
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              weekItems={weekItemsMap}
            />

            {/* Notifications Diagnostic Center */}
            <div className="glass-panel border border-borderColor/20 p-5 rounded-2xl bg-background-elevated/10 space-y-4 select-none">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest border-b border-borderColor/20 pb-2.5">
                OS Notification Setup
              </h3>
              
              <button
                onClick={triggerTestNotification}
                className="w-full h-9 bg-[#1c253d] hover:bg-white/5 border border-borderColor/30 text-white rounded-xl text-xs font-bold tracking-wide transition-all touch-target active:scale-95"
              >
                Test OS Notification
              </button>
              
              <div className="space-y-2 pt-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary font-medium">Browser Push API:</span>
                  <span className={'PushManager' in window ? 'text-accent-success font-black' : 'text-accent-danger font-black'}>
                    {'PushManager' in window ? 'Supported ✓' : 'Unsupported ✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary font-medium">SW Controller:</span>
                  <span className={navigator.serviceWorker?.controller ? 'text-accent-success font-black' : 'text-accent-danger font-black'}>
                    {navigator.serviceWorker?.controller ? 'Controlled ✓' : 'Offline/Inactive ✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary font-medium">Permission state:</span>
                  <span className={Notification.permission === 'granted' ? 'text-accent-success font-black' : Notification.permission === 'denied' ? 'text-accent-danger font-black' : 'text-accent-warning font-black'}>
                    {Notification.permission === 'granted' ? 'Granted ✓' : Notification.permission === 'denied' ? 'Blocked ✗' : 'Prompt ?'}
                  </span>
                </div>
              </div>

              {Notification.permission !== 'granted' && (
                <div className="p-3 bg-accent-danger/5 border border-accent-danger/25 rounded-xl text-[10px] text-text-secondary leading-relaxed">
                  <span className="font-extrabold text-accent-danger uppercase block mb-1">Permission Blocked Fix:</span>
                  Click the lock icon in the browser address bar, set Notifications to "Allow", and reload the page.
                </div>
              )}
              {!navigator.serviceWorker?.controller && (
                <div className="p-3 bg-accent-danger/5 border border-accent-danger/25 rounded-xl text-[10px] text-text-secondary leading-relaxed">
                  <span className="font-extrabold text-accent-danger uppercase block mb-1">SW Inactive Fix:</span>
                  Please close all open tabs of this application, reload, and verify that the PWA is registered in Developer Tools.
                </div>
              )}
              {!('PushManager' in window) && (
                <div className="p-3 bg-accent-danger/5 border border-accent-danger/25 rounded-xl text-[10px] text-text-secondary leading-relaxed">
                  <span className="font-extrabold text-accent-danger uppercase block mb-1">Push API Unsupported Fix:</span>
                  This browser does not support native Web Push. Try Chrome, Microsoft Edge, or Apple Safari.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Save modal */}
      <AddScheduleItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        editingItem={editingItem}
        selectedDate={selectedDate}
      />

    </div>
  );
}

export default SchedulePage;
