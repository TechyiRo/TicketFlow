import React from 'react';

export function WeeklyMiniCalendar({ selectedDate, onDateChange, weekItems = {} }) {
  // Generate the current week days (Monday - Sunday) based on selectedDate
  const getWeekDays = () => {
    const current = new Date(selectedDate);
    const day = current.getDay();
    const distanceToMonday = day === 0 ? -6 : 1 - day; // Monday is 1, Sunday is 0
    
    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const daysOfWeek = getWeekDays();
  const todayStr = new Date().toDateString();

  return (
    <div className="glass-panel border border-borderColor/30 p-5 rounded-2xl bg-background-elevated/10 space-y-4 h-max select-none">
      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest border-b border-borderColor/20 pb-2.5">
        Weekly Schedule
      </h3>

      <div className="grid grid-cols-7 gap-2 text-center">
        {/* Short Day Names */}
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayName, idx) => (
          <span key={idx} className="text-[10px] font-bold text-text-secondary">
            {dayName}
          </span>
        ))}

        {/* Date cells */}
        {daysOfWeek.map((day, idx) => {
          const getLocalDateString = (date) => {
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const dayNum = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${dayNum}`;
          };
          const dateStr = getLocalDateString(day);
          const isSelected = day.toDateString() === new Date(selectedDate).toDateString();
          const isToday = day.toDateString() === todayStr;
          const dayItems = weekItems[dateStr] || [];

          // Cap dots at 5
          const cappedItems = dayItems.slice(0, 5);
          const overflowCount = dayItems.length > 5 ? dayItems.length - 5 : 0;

          return (
            <button
              key={idx}
              onClick={() => onDateChange(day)}
              className={`p-2 rounded-xl flex flex-col items-center gap-1.5 transition-all relative ${
                isSelected
                  ? 'bg-accent-primary/20 border border-accent-primary/50 text-accent-glow scale-105 shadow-neonIndigo/20'
                  : 'hover:bg-white/5 border border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              {/* Today glow backdrop */}
              {isToday && !isSelected && (
                <span className="absolute inset-1 rounded-lg border border-accent-cyan/30 animate-pulse pointer-events-none" />
              )}

              <span className={`text-xs font-black ${isToday ? 'text-accent-cyan' : ''}`}>
                {day.getDate()}
              </span>

              {/* Category dots bar */}
              <div className="flex flex-wrap gap-0.5 justify-center w-full min-h-[6px]">
                {cappedItems.map((item, dotIdx) => {
                  let dotColor = 'bg-accent-cyan';
                  if (item.category === 'meeting') dotColor = 'bg-accent-purple';
                  if (item.category === 'personal') dotColor = 'bg-accent-warning';
                  if (item.category === 'urgent') dotColor = 'bg-accent-danger';
                  return (
                    <span 
                      key={dotIdx} 
                      className={`w-1.5 h-1.5 rounded-full ${dotColor} shadow-sm shrink-0`} 
                    />
                  );
                })}
                {overflowCount > 0 && (
                  <span className="text-[8px] font-bold text-text-secondary leading-none">
                    +{overflowCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default WeeklyMiniCalendar;
