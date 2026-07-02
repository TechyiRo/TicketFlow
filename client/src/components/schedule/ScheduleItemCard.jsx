import React, { useState, useEffect, useRef } from 'react';
import { Bell, Edit3, Trash2, CheckSquare, Square, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export function ScheduleItemCard({ item, onEdit, onDelete, onToggleComplete, readOnly = false }) {
  const [showSparks, setShowSparks] = useState(false);
  const [isCompletedDraw, setIsCompletedDraw] = useState(false);
  const cardRef = useRef(null);

  // Strikethrough animation trigger
  useEffect(() => {
    if (item.isCompleted) {
      const timer = setTimeout(() => setIsCompletedDraw(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsCompletedDraw(false);
    }
  }, [item.isCompleted]);

  // 3D Perspective Tilt on MouseMove
  const handleMouseMove = (e) => {
    if (readOnly) return;
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angleX = (yc - y) / 12; // vertical angle
    const angleY = (x - xc) / 12; // horizontal angle
    card.style.transform = `perspective(800px) rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  };

  // Spark burst trigger
  const handleCheckboxClick = () => {
    if (readOnly) return;
    if (!item.isCompleted) {
      setShowSparks(true);
      setTimeout(() => setShowSparks(false), 600);
    }
    onToggleComplete(item._id);
  };

  // Resolve Category Colors
  const getCategoryStyles = () => {
    switch (item.category) {
      case 'meeting':
        return {
          borderClass: 'shimmer-purple',
          glowClass: 'shadow-[0_0_15px_rgba(139,92,246,0.1)]',
          sparkColor: 'bg-accent-purple',
          textStrikethrough: 'bg-accent-purple',
        };
      case 'personal':
        return {
          borderClass: 'shimmer-warning',
          glowClass: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]',
          sparkColor: 'bg-accent-warning',
          textStrikethrough: 'bg-accent-warning',
        };
      case 'urgent':
        return {
          borderClass: 'shimmer-danger',
          glowClass: 'shadow-[0_0_15px_rgba(239,68,68,0.12)]',
          sparkColor: 'bg-accent-danger',
          textStrikethrough: 'bg-accent-danger',
        };
      default: // 'work'
        return {
          borderClass: 'shimmer-cyan',
          glowClass: 'shadow-[0_0_15px_rgba(0,240,255,0.1)]',
          sparkColor: 'bg-accent-cyan',
          textStrikethrough: 'bg-accent-cyan',
        };
    }
  };

  const styles = getCategoryStyles();

  // Format Time YYYY-MM-DDTHH:MM
  const formatTime = (timeStr) => {
    const d = new Date(timeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const [localReminderEnabled, setLocalReminderEnabled] = useState(!!item.reminderEnabled);
  const [inlineError, setInlineError] = useState('');

  // Sync state if item updates from parent
  useEffect(() => {
    setLocalReminderEnabled(!!item.reminderEnabled);
  }, [item.reminderEnabled]);

  const handleToggleReminder = async (e) => {
    e.stopPropagation();
    const nextState = !localReminderEnabled;

    if (nextState) {
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              setInlineError('Notifications are blocked. Click the lock icon in the browser address bar and allow notifications for this site, then refresh the page.');
              return;
            }
            await scheduleService.logNotificationPermission();
          } catch (err) {
            console.error('Request permission failed:', err);
            setInlineError('Permission request failed.');
            return;
          }
        } else if (Notification.permission === 'denied') {
          setInlineError('Notifications are blocked. Click the lock icon in the browser address bar and allow notifications for this site, then refresh the page.');
          return;
        }
      } else {
        alert('This browser does not support notifications.');
        return;
      }
    }

    // Optimistic UI Update
    setLocalReminderEnabled(nextState);
    setInlineError('');

    try {
      const updatedItem = await scheduleService.updateItem(item._id, {
        ...item,
        reminderEnabled: nextState
      });

      // Notify service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        if (nextState) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SCHEDULE_REMINDER',
            item: {
              id: item._id,
              title: item.title,
              description: item.description,
              reminderTime: updatedItem.reminderTime || item.reminderTime || item.startTime
            }
          });
        } else {
          navigator.serviceWorker.controller.postMessage({
            type: 'CANCEL_REMINDER',
            id: item._id
          });
        }
      }
    } catch (err) {
      console.error('Failed to sync reminder setting:', err);
      setLocalReminderEnabled(!nextState);
      toast.error('Failed to update reminder settings.');
    }
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`glass-panel rounded-2xl p-5 flex gap-4 border border-borderColor/20 bg-background-elevated/5 relative overflow-hidden transition-all duration-300 ${styles.glowClass} ${
        item.isCompleted ? 'opacity-55' : ''
      }`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* 3D and Shimmer Spark animations stylesheet */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmerUp {
          0% { background-position: 0% 200%; }
          100% { background-position: 0% 0%; }
        }
        .shimmer-cyan {
          background: linear-gradient(to top, #00f0ff 0%, #0066cc 50%, #00f0ff 100%);
          background-size: 100% 200%;
          animation: shimmerUp 3s linear infinite;
        }
        .shimmer-purple {
          background: linear-gradient(to top, #8b5cf6 0%, #5b21b6 50%, #8b5cf6 100%);
          background-size: 100% 200%;
          animation: shimmerUp 3s linear infinite;
        }
        .shimmer-warning {
          background: linear-gradient(to top, #f59e0b 0%, #b45309 50%, #f59e0b 100%);
          background-size: 100% 200%;
          animation: shimmerUp 3s linear infinite;
        }
        .shimmer-danger {
          background: linear-gradient(to top, #ef4444 0%, #991b1b 50%, #ef4444 100%);
          background-size: 100% 200%;
          animation: shimmerUp 3s linear infinite;
        }
        @keyframes sparkOut {
          0% { transform: translate(0,0) scale(0.6); opacity: 1; }
          100% { transform: var(--translate-dest) scale(1.6); opacity: 0; }
        }
        .spark-particle {
          animation: sparkOut 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}} />

      {/* Shimmering Category Border line */}
      <div className={`absolute top-0 bottom-0 left-0 w-1 ${styles.borderClass}`} />

      {/* Checkbox item */}
      <div className="flex items-start shrink-0 relative">
        <button
          onClick={handleCheckboxClick}
          disabled={readOnly}
          className={`p-1 rounded-lg text-text-secondary hover:text-text-primary transition-all disabled:opacity-50 touch-target relative`}
        >
          {item.isCompleted ? (
            <CheckSquare className="w-5 h-5 text-accent-cyan" />
          ) : (
            <Square className="w-5 h-5" />
          )}

          {/* Spark Particles burst animation */}
          {showSparks && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <span className={`absolute w-1.5 h-1.5 rounded-full ${styles.sparkColor} spark-particle`} style={{ '--translate-dest': 'translate(-12px, -12px)' }} />
              <span className={`absolute w-1.5 h-1.5 rounded-full ${styles.sparkColor} spark-particle`} style={{ '--translate-dest': 'translate(12px, -12px)' }} />
              <span className={`absolute w-1.5 h-1.5 rounded-full ${styles.sparkColor} spark-particle`} style={{ '--translate-dest': 'translate(-12px, 12px)' }} />
              <span className={`absolute w-1.5 h-1.5 rounded-full ${styles.sparkColor} spark-particle`} style={{ '--translate-dest': 'translate(12px, 12px)' }} />
              <span className={`absolute w-1.5 h-1.5 rounded-full ${styles.sparkColor} spark-particle`} style={{ '--translate-dest': 'translate(0px, -16px)' }} />
            </div>
          )}
        </button>
      </div>

      {/* Card Body */}
      <div className="flex-1 min-w-0 flex flex-col gap-1 relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="relative inline-block max-w-full">
            <h4 className={`text-sm font-bold text-text-primary truncate ${
              item.isCompleted ? 'text-text-secondary/55' : ''
            }`}>
              {item.title}
            </h4>

            {/* Drawing strikethrough overlay */}
            {item.isCompleted && (
              <div 
                className={`absolute left-0 top-[52%] h-[1.5px] ${styles.textStrikethrough} pointer-events-none rounded transition-all duration-700 ease-out`}
                style={{ width: isCompletedDraw ? '100%' : '0%' }}
              />
            )}
          </div>

          {/* Action tools (Always visible and touch-accessible) */}
          {!readOnly && (
            <div className="flex items-center gap-1.5 shrink-0 bg-background-elevated/20 p-1 rounded-lg border border-borderColor/10 select-none">
              <button
                onClick={() => onEdit(item)}
                className="p-1 text-text-secondary hover:text-accent-primary hover:bg-white/5 rounded transition-all touch-target"
                title="Edit item"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Delete this schedule item?')) {
                    onDelete(item._id);
                  }
                }}
                className="p-1 text-text-secondary hover:text-accent-danger hover:bg-white/5 rounded transition-all touch-target"
                title="Delete item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Start / End times */}
        <div className="text-[10px] font-bold text-text-secondary flex items-center gap-2">
          <span>{formatTime(item.startTime)} &mdash; {formatTime(item.endTime)}</span>
          <span className="text-borderColor/60">&bull;</span>
          <span className="uppercase text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
            Priority: {item.priority}
          </span>
        </div>

        {/* Notes description (Constrained height to avoid scrolling) */}
        <p className={`text-xs text-text-secondary mt-1.5 leading-relaxed line-clamp-2 max-h-12 overflow-hidden ${
          item.isCompleted ? 'text-text-secondary/45' : ''
        }`}>
          {item.description}
        </p>

        {/* Isolated reminder toggle switch cell (44x44px touch target) */}
        {!readOnly && (
          <div className="flex flex-col gap-1 mt-2.5 pt-2.5 border-t border-borderColor/10">
            <div className="flex items-center justify-between select-none">
              <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                <Bell className={`w-3.5 h-3.5 ${localReminderEnabled ? 'text-accent-cyan animate-pulse' : 'text-text-secondary/40'}`} />
                Reminder Alert
              </span>
              <button
                type="button"
                onClick={handleToggleReminder}
                className="w-11 h-11 flex items-center justify-end cursor-pointer focus:outline-none touch-target"
                style={{ minWidth: '44px', minHeight: '44px' }}
                title="Toggle Lockscreen Reminder"
              >
                <div className={`w-8 h-4.5 rounded-full transition-colors relative ${
                  localReminderEnabled ? 'bg-accent-cyan shadow-[0_0_8px_#00f0ff]' : 'bg-slate-700'
                }`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-background-primary absolute top-0.5 transition-all duration-200 ${
                    localReminderEnabled ? 'left-4' : 'left-0.5'
                  }`} />
                </div>
              </button>
            </div>
            {inlineError && (
              <span className="text-[9px] text-accent-danger font-bold mt-1 leading-relaxed">
                {inlineError}
              </span>
            )}
          </div>
        )}

        {/* Reminder status alerts */}
        {localReminderEnabled && (
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-text-secondary select-none">
            {/* Dynamic reminder status bells */}
            {item.isCompleted ? (
              <Bell className="w-3.5 h-3.5 text-text-secondary/30" />
            ) : item.reminderStatus === 'snoozed' ? (
              <div className="flex items-center gap-1 text-accent-warning">
                <div className="relative">
                  <Bell className="w-3.5 h-3.5 text-accent-warning animate-bounce" />
                  <Clock className="w-2 h-2 text-accent-warning absolute -bottom-0.5 -right-0.5 bg-background-primary rounded-full" />
                </div>
                <span>Snoozed {item.snoozeCount}/3 (10m)</span>
              </div>
            ) : item.reminderStatus === 'delivered' ? (
              <div className="flex items-center gap-1 text-accent-warning">
                <Bell className="w-3.5 h-3.5 text-accent-warning" />
                <span>Reminder delivered</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-accent-cyan">
                <Bell className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
                <span>Reminder armed</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScheduleItemCard;
