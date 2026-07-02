import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { useNavigate } from 'react-router-dom';
import TicketTable from '../../components/tickets/TicketTable';
import TicketCard from '../../components/tickets/TicketCard';
import TicketDetailModal from '../../components/tickets/TicketDetailModal';
import { employeeService } from '../../services/employeeService';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  FolderSync, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  TrendingUp 
} from 'lucide-react';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = {
  Low: '#10B981',      // Success green
  Medium: '#F59E0B',   // Warning amber
  High: '#EF4444',     // Danger red
  Critical: '#D946EF', // Purple
};

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { fetchTickets } = useTickets();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);

  const loadDashboardData = async () => {
    try {
      if (navigator.onLine) {
        const statsData = await employeeService.getEmployeeStats();
        setStats(statsData);

        // Fetch recent ticket records
        const ticketsData = await fetchTickets({ limit: 5 });
        setRecentTickets(ticketsData.tickets);
      } else {
        // Fallback for offline mode
        toast.info('Offline: Loading mock statistical details.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleOpenDetail = (id) => {
    setSelectedTicketId(id);
    setDetailOpen(true);
  };

  const handleTicketUpdated = () => {
    loadDashboardData();
  };

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <svg className="animate-spin h-8 w-8 text-accent-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs text-text-secondary font-semibold">Loading stats...</span>
      </div>
    );
  }

  const { cards, charts, activityFeed } = stats;

  return (
    <div className="flex flex-col gap-6 md:gap-8 select-none">
      
      {/* 5 STAT METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Tickets */}
        <div className="glass-card bg-background-surface rounded-2xl p-5 border border-borderColor flex flex-col justify-between h-28 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider">Total Tickets</span>
            <div className="p-1.5 bg-accent-primary/10 rounded-lg text-accent-glow border border-accent-primary/20">
              <FolderSync className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl md:text-2xl font-black text-white">{cards.totalTickets}</span>
            <span className="text-[9px] font-bold text-accent-success">+0% vs yesterday</span>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="glass-card bg-background-surface rounded-2xl p-5 border border-borderColor flex flex-col justify-between h-28 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider">Open Queue</span>
            <div className="p-1.5 bg-accent-primary/10 rounded-lg text-accent-primary border border-accent-primary/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl md:text-2xl font-black text-white">{cards.openTickets}</span>
            <span className="text-[9px] font-bold text-text-secondary">active workload</span>
          </div>
        </div>

        {/* Assigned to Me */}
        <div className="glass-card bg-background-surface rounded-2xl p-5 border border-borderColor flex flex-col justify-between h-28 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider">Assigned to Me</span>
            <div className="p-1.5 bg-accent-warning/10 rounded-lg text-accent-warning border border-accent-warning/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl md:text-2xl font-black text-white">{cards.assignedTickets}</span>
            <span className="text-[9px] font-bold text-accent-warning">your priority</span>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="glass-card bg-background-surface rounded-2xl p-5 border border-borderColor flex flex-col justify-between h-28 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider">Resolved Today</span>
            <div className="p-1.5 bg-accent-success/10 rounded-lg text-accent-success border border-accent-success/20">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl md:text-2xl font-black text-white">{cards.resolvedToday}</span>
            <span className="text-[9px] font-bold text-accent-success">resolved today</span>
          </div>
        </div>

        {/* Critical Priority */}
        <div className="glass-card bg-background-surface rounded-2xl p-5 border border-borderColor flex flex-col justify-between h-28 relative overflow-hidden col-span-2 md:col-span-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider">Critical Tickets</span>
            <div className="p-1.5 bg-accent-danger/10 rounded-lg text-accent-danger border border-accent-danger/20">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl md:text-2xl font-black text-white">{cards.criticalTickets}</span>
            <span className="text-[9px] font-bold text-accent-danger">immediate response</span>
          </div>
        </div>
      </div>

      {/* CHARTS CONTAINER (Pie Donut Chart + Category Bar Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        {/* Priority distribution Donut chart */}
        <div className="bg-background-surface border border-borderColor rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-borderColor pb-3 mb-2">
            <h4 className="text-xs font-black uppercase text-text-primary tracking-wider">Priority Distribution</h4>
            <span className="text-[10px] text-text-secondary font-semibold">Donut Chart</span>
          </div>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.priorityStats.filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.priorityStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#6366F1'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A2235', borderColor: '#1E293B', borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: '#F1F5F9' }}
                />
                <Legend 
                  iconType="circle" 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: 11, color: '#94A3B8', paddingTop: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category distribution Bar chart */}
        <div className="bg-background-surface border border-borderColor rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-borderColor pb-3 mb-2">
            <h4 className="text-xs font-black uppercase text-text-primary tracking-wider">Tickets by Category</h4>
            <span className="text-[10px] text-text-secondary font-semibold">Bar Chart</span>
          </div>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.categoryStats}>
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A2235', borderColor: '#1E293B', borderRadius: 8, fontSize: 11 }}
                  itemStyle={{ color: '#F1F5F9' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]}>
                  {charts.categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#6366F1" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DASHBOARD CORE CONTENT ROWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start select-none">
        {/* Recent Tickets table (Colspan 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest">
            Recent Workload Queue
          </h3>

          {recentTickets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-scale-in">
              {recentTickets.map((t) => (
                <TicketCard
                  key={t._id}
                  ticket={t}
                  userRole="employee"
                  onOpenDetail={handleOpenDetail}
                  onOpenChat={(id) => {
                    setSelectedTicketId(id);
                    navigate('/messages');
                  }}
                  onQuickAssign={() => handleOpenDetail(t._id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-background-surface border border-borderColor rounded-2xl text-xs font-semibold text-text-secondary">
              No tickets found in database.
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest">
            Audit Activity Feed
          </h3>

          <div className="bg-background-surface border border-borderColor rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-borderColor pb-3 mb-1">
              <TrendingUp className="w-4 h-4 text-accent-glow" />
              <h4 className="text-xs font-bold text-text-primary">System Tracker</h4>
            </div>

            <div className="flex flex-col gap-4">
              {activityFeed && activityFeed.length > 0 ? (
                activityFeed.map((act, i) => (
                  <div key={i} className="flex gap-3 items-start border-l-2 border-accent-warning/25 pl-4 pb-1 relative">
                    {/* Glowing bullet */}
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-warning absolute -left-[6px] top-1 shadow-warningGlow" />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary font-semibold leading-relaxed leading-snug">
                        {act.text}
                      </p>
                      <span className="text-[9px] text-text-secondary mt-1 block">
                        {new Date(act.time).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-text-secondary font-semibold">
                  No recent activities logged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <TicketDetailModal
        isOpen={detailOpen}
        ticketId={selectedTicketId}
        onClose={() => {
          setDetailOpen(false);
          setSelectedTicketId(null);
        }}
        onTicketUpdated={handleTicketUpdated}
      />
    </div>
  );
}

export default EmployeeDashboard;
