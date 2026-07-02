import React, { useState, useEffect } from 'react';
import { Users, Filter, Search, ChevronDown, ChevronUp, BarChart3, AlertCircle } from 'lucide-react';
import ScheduleItemCard from './ScheduleItemCard';
import scheduleService from '../../services/scheduleService';
import Avatar from '../shared/Avatar';
import toast from 'react-hot-toast';

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

export function AdminScheduleOverview({ selectedDate }) {
  const [data, setData] = useState({
    summary: { totalScheduledToday: 0, totalCompletedToday: 0, totalRemindersFiredToday: 0 },
    usersList: []
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'employee' | 'user'
  const [expandedUserIds, setExpandedUserIds] = useState(new Set());

  // Fetch admin master schedule overview
  const fetchOverview = async () => {
    try {
      setLoading(true);
      const getLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const dateStr = getLocalDateString(selectedDate);
      const res = await scheduleService.getAdminOverview(dateStr);
      setData(res);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
      toast.error('Could not load administrative overview metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [selectedDate]);

  const toggleUserExpanded = (userId) => {
    setExpandedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Filters logic
  const filteredUsers = data.usersList.filter((u) => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || 
                        (roleFilter === 'employee' && u.role === 'employee') ||
                        (roleFilter === 'user' && u.role === 'user');
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Summary KPIs Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 select-none">
        
        {/* Total Scheduled */}
        <div className="glass-panel border border-borderColor/20 rounded-2xl p-5 bg-background-elevated/5 flex items-center gap-4">
          <div className="w-11 h-11 bg-accent-cyan/15 rounded-xl flex items-center justify-center text-accent-cyan shadow-[0_0_15px_rgba(0,240,255,0.06)] shrink-0">
            <BarChart3 className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
              Total Scheduled Tasks
            </span>
            <span className="text-2xl font-black text-text-primary mt-2 block leading-none">
              {loading ? '...' : data.summary.totalScheduledToday}
            </span>
          </div>
        </div>

        {/* Total Completed */}
        <div className="glass-panel border border-borderColor/20 rounded-2xl p-5 bg-background-elevated/5 flex items-center gap-4">
          <div className="w-11 h-11 bg-accent-success/15 rounded-xl flex items-center justify-center text-accent-success shadow-[0_0_15px_rgba(34,197,94,0.06)] shrink-0">
            <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
              Total Completed Tasks
            </span>
            <span className="text-2xl font-black text-text-primary mt-2 block leading-none">
              {loading ? '...' : data.summary.totalCompletedToday}
            </span>
          </div>
        </div>

        {/* Reminders Fired */}
        <div className="glass-panel border border-borderColor/20 rounded-2xl p-5 bg-background-elevated/5 flex items-center gap-4">
          <div className="w-11 h-11 bg-accent-warning/15 rounded-xl flex items-center justify-center text-accent-warning shadow-[0_0_15px_rgba(245,158,11,0.06)] shrink-0">
            <svg className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block leading-none">
              Reminders Triggered
            </span>
            <span className="text-2xl font-black text-text-primary mt-2 block leading-none">
              {loading ? '...' : data.summary.totalRemindersFiredToday}
            </span>
          </div>
        </div>

      </div>

      {/* 2. Controls Panel */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#0e1322]/40 border border-borderColor/10 rounded-2xl p-4">
        
        {/* Name Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search team member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 bg-background-primary/40 border border-borderColor/55 focus:border-accent-cyan focus:outline-none rounded-xl pl-10 pr-4 text-xs text-text-primary"
          />
        </div>

        {/* Roles Filter Button selector */}
        <div className="flex items-center gap-1.5 shrink-0 select-none">
          <Filter className="w-4 h-4 text-text-secondary mr-1" />
          {[
            { id: 'all', label: 'All Staff' },
            { id: 'employee', label: 'Employees' },
            { id: 'user', label: 'Users' }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setRoleFilter(btn.id)}
              className={`h-8 px-3.5 rounded-xl text-xs font-bold transition-all touch-target ${
                roleFilter === btn.id
                  ? 'bg-accent-primary text-white shadow-neonIndigo/10'
                  : 'hover:bg-white/5 border border-borderColor/20 text-text-secondary hover:text-text-primary'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

      </div>

      {/* 3. Collapsible Users Lists grid */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-text-secondary gap-2.5">
            <svg className="animate-spin h-6 w-6 text-accent-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Consolidating schedules...</span>
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((u) => {
            const isExpanded = expandedUserIds.has(u._id);
            const avatarUrl = avatarMap[u.avatar] || u.avatar || avatarMap.avatar1;

            return (
              <div 
                key={u._id} 
                className="glass-panel border border-borderColor/20 rounded-2xl overflow-hidden transition-all bg-[#0e1322]/20"
              >
                {/* Header Collapsible bar */}
                <div 
                  onClick={() => toggleUserExpanded(u._id)}
                  className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/5 select-none"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full border border-borderColor/30 p-0.5 overflow-hidden shrink-0">
                      <img src={avatarUrl} alt={u.fullName} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-text-primary leading-none">
                        {u.fullName}
                      </h4>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 w-max inline-block uppercase tracking-wider leading-none ${
                        u.role === 'admin'
                          ? 'bg-[#7B2FFF]/15 text-[#7B2FFF] border border-[#7B2FFF]/30'
                          : u.role === 'employee'
                            ? 'bg-accent-warning/15 text-accent-warning border border-accent-warning/30'
                            : 'bg-accent-primary/15 text-accent-glow border border-accent-primary/30'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  </div>

                  {/* Completed Progress bar status */}
                  <div className="flex-1 max-w-sm flex items-center gap-3 shrink-0">
                    <div className="flex-1 h-2 bg-slate-800/80 rounded-full overflow-hidden border border-borderColor/10">
                      <div 
                        className="h-full bg-gradient-to-r from-accent-primary to-accent-purple rounded-full transition-all duration-500"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-text-secondary w-14 shrink-0 text-right leading-none">
                      {u.progress}% Done
                    </span>
                  </div>

                  {/* Expand indicators */}
                  <div className="flex items-center gap-3 justify-end shrink-0">
                    <span className="text-[10px] font-bold text-text-secondary">
                      {u.scheduleItems.length} Planned
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-text-secondary" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-secondary" />
                    )}
                  </div>
                </div>

                {/* Expanded Grid read-only */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1.5 border-t border-borderColor/10 bg-background-primary/10 animate-slideDown">
                    {u.scheduleItems.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {u.scheduleItems.map((item) => (
                          <ScheduleItemCard 
                            key={item._id} 
                            item={item} 
                            readOnly={true} 
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 text-center text-[11px] text-text-secondary/50 italic select-none">
                        No work items scheduled for this date.
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-text-secondary select-none border border-dashed border-borderColor/30 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-text-secondary/40 mb-2" />
            <span>No team members found matching search query or role filter.</span>
          </div>
        )}
      </div>

    </div>
  );
}

export default AdminScheduleOverview;
