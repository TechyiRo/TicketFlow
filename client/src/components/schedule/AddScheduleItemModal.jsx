import React, { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';

export function AddScheduleItemModal({ isOpen, onClose, onSave, editingItem = null, selectedDate }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('work');
  
  // Initialize start/end datetime selectors based on selectedDate
  const getInitialDateTimeString = (offsetHours = 0) => {
    const d = new Date(selectedDate || Date.now());
    d.setHours(9 + offsetHours, 0, 0, 0); // Default to morning work hours
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const date = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${date}T${hours}:${minutes}`;
  };

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTrigger, setReminderTrigger] = useState('at_start');

  // Pre-populate fields on edit mode
  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title || '');
      setCategory(editingItem.category || 'work');
      
      const formatDT = (timeStr) => {
        const d = new Date(timeStr);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const date = d.getDate().toString().padStart(2, '0');
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${date}T${hours}:${minutes}`;
      };

      setStartTime(formatDT(editingItem.startTime));
      setEndTime(formatDT(editingItem.endTime));
      setDescription(editingItem.description || '');
      setPriority(editingItem.priority || 'medium');
      setReminderEnabled(!!editingItem.reminderEnabled);
      setReminderTrigger(editingItem.reminderTrigger || 'at_start');
    } else {
      setTitle('');
      setCategory('work');
      setStartTime(getInitialDateTimeString(0));
      setEndTime(getInitialDateTimeString(1));
      setDescription('');
      setPriority('medium');
      setReminderEnabled(false);
      setReminderTrigger('at_start');
    }
  }, [editingItem, isOpen, selectedDate]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime || !description.trim()) {
      alert('Please fill out all required fields.');
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      alert('End time must be after start time.');
      return;
    }

    onSave({
      title: title.trim(),
      category,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      description: description.trim(),
      priority,
      reminderEnabled,
      reminderTrigger,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#070b13]/85 backdrop-blur-sm transition-opacity" 
      />

      {/* Form Container */}
      <form 
        onSubmit={handleSubmit}
        className="glass-panel w-full max-w-lg border border-borderColor/30 rounded-2xl bg-[#0e1322] shadow-[0_12px_40px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 animate-scaleUp flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-borderColor/20 flex items-center justify-between bg-[#131b2f]">
          <h3 className="text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-cyan" />
            {editingItem ? 'Edit Work Item' : 'Add Work Item'}
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-lg text-text-secondary hover:text-text-primary transition-colors touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto min-h-0 flex-1">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Server Maintenance, L2 Standup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 bg-background-primary/40 border border-borderColor/55 focus:border-accent-cyan focus:outline-none rounded-lg px-3.5 text-xs text-text-primary placeholder:text-text-secondary/40"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 bg-background-primary/40 border border-borderColor/55 focus:border-accent-cyan focus:outline-none rounded-lg px-3.5 text-xs text-text-primary"
              >
                <option value="work">Work Task (Cyan)</option>
                <option value="meeting">Meeting (Violet)</option>
                <option value="personal">Personal (Amber)</option>
                <option value="urgent">Urgent Reminder (Red)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-10 bg-background-primary/40 border border-borderColor/55 focus:border-accent-cyan focus:outline-none rounded-lg px-3.5 text-xs text-text-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Start & End Times */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-10 bg-background-primary/40 border border-borderColor/55 focus:border-accent-cyan focus:outline-none rounded-lg px-3.5 text-xs text-text-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                End Time *
              </label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-10 bg-background-primary/40 border border-borderColor/55 focus:border-accent-cyan focus:outline-none rounded-lg px-3.5 text-xs text-text-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
              Description Notes *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Provide a short description of goals, attendees, or requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background-primary/40 border border-borderColor/55 focus:border-accent-cyan focus:outline-none rounded-lg p-3.5 text-xs text-text-primary placeholder:text-text-secondary/40 leading-relaxed resize-none"
            />
          </div>

          {/* Reminder settings */}
          <div className="p-4 rounded-xl border border-borderColor/20 bg-background-primary/20 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-text-primary">Enable Lockscreen Reminder</span>
                <span className="text-[10px] text-text-secondary mt-0.5">Trigger web push notifications even if the app is closed.</span>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 accent-accent-cyan"
              />
            </div>

            {reminderEnabled && (
              <div className="flex flex-col gap-1.5 border-t border-borderColor/10 pt-3 animate-slideDown">
                <label className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">
                  Reminder Window
                </label>
                <select
                  value={reminderTrigger}
                  onChange={(e) => setReminderTrigger(e.target.value)}
                  className="h-9 bg-background-primary border border-borderColor/40 focus:border-accent-cyan focus:outline-none rounded-lg px-3 text-xs text-text-primary"
                >
                  <option value="at_start">At start time</option>
                  <option value="5_min">5 minutes before</option>
                  <option value="10_min">10 minutes before</option>
                  <option value="15_min">15 minutes before</option>
                  <option value="30_min">30 minutes before</option>
                  <option value="1_hour">1 hour before</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-borderColor/20 flex items-center justify-end gap-3 bg-[#131b2f]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 hover:bg-white/5 border border-borderColor rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition-all touch-target"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-10 px-6 bg-accent-primary hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 touch-target shadow-md shadow-indigo-900/10"
          >
            {editingItem ? 'Save Changes' : 'Create Item'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddScheduleItemModal;
