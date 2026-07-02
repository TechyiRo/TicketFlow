import React, { useState, useEffect } from 'react';
import { useTickets } from '../../context/TicketContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import TicketTable from '../../components/tickets/TicketTable';
import TicketCard from '../../components/tickets/TicketCard';
import CreateTicketModal from '../../components/tickets/CreateTicketModal';
import TicketDetailModal from '../../components/tickets/TicketDetailModal';
import { 
  Plus, 
  Ticket as TicketIcon, 
  Clock, 
  Play, 
  CheckCircle, 
  Activity, 
  FileText 
} from 'lucide-react';
import toast from 'react-hot-toast';

export function UserDashboard() {
  const { user } = useAuth();
  const { tickets, loading, fetchTickets } = useTickets();
  const location = useLocation();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Watch for shortcut/routing query parameter action=create-ticket
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('action') === 'create-ticket') {
      setCreateOpen(true);
    }
    const ticketId = searchParams.get('ticketId');
    if (ticketId) {
      setSelectedTicketId(ticketId);
      setDetailOpen(true);
    }
  }, [location]);

  // Compute stat metrics
  const total = tickets.length;
  const open = tickets.filter(t => t.status === 'open').length;
  const inProgress = tickets.filter(t => t.status === 'in_progress').length;
  const resolved = tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;

  const handleOpenDetail = (id) => {
    setSelectedTicketId(id);
    setDetailOpen(true);
  };

  const handleOpenComment = (id) => {
    setSelectedTicketId(id);
    setDetailOpen(true);
  };

  const handleTicketCreated = (newTicket) => {
    fetchTickets();
  };

  const handleTicketUpdated = (updated) => {
    fetchTickets();
  };

  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString();
  };

  // Activity feed aggregates
  const activityFeed = [...tickets]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5)
    .map((t) => {
      let text = '';
      if (t.status === 'open') {
        text = `Ticket ${t.ticketId} created successfully.`;
      } else {
        text = `Ticket ${t.ticketId} status updated to ${t.status.toUpperCase().replace('_', ' ')}.`;
      }
      return {
        id: t._id,
        text,
        time: t.updatedAt,
      };
    });

  return (
    <div className="flex flex-col gap-6 md:gap-8 select-none">
      
      {/* 4 STAT METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tickets */}
        <div className="glass-card bg-background-surface rounded-2xl p-5 border border-borderColor flex flex-col justify-between h-28 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider">Total Tickets</span>
            <div className="p-1.5 bg-accent-primary/10 rounded-lg text-accent-glow border border-accent-primary/20">
              <TicketIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl md:text-2xl font-black text-white">{total}</span>
            <span className="text-[9px] font-bold text-accent-success">+0% vs last week</span>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="glass-card bg-background-surface rounded-2xl p-5 border border-borderColor flex flex-col justify-between h-28 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider">Open</span>
            <div className="p-1.5 bg-accent-primary/10 rounded-lg text-accent-primary border border-accent-primary/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl md:text-2xl font-black text-white">{open}</span>
            <span className="text-[9px] font-bold text-text-secondary">active status</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="glass-card bg-background-surface rounded-2xl p-5 border border-borderColor flex flex-col justify-between h-28 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider">In Progress</span>
            <div className="p-1.5 bg-accent-warning/10 rounded-lg text-accent-warning border border-accent-warning/20">
              <Play className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl md:text-2xl font-black text-white">{inProgress}</span>
            <span className="text-[9px] font-bold text-text-secondary">assigned agents</span>
          </div>
        </div>

        {/* Resolved */}
        <div className="glass-card bg-background-surface rounded-2xl p-5 border border-borderColor flex flex-col justify-between h-28 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-wider">Resolved</span>
            <div className="p-1.5 bg-accent-success/10 rounded-lg text-accent-success border border-accent-success/20">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl md:text-2xl font-black text-white">{resolved}</span>
            <span className="text-[9px] font-bold text-accent-success">100% completion</span>
          </div>
        </div>
      </div>

      {/* DASHBOARD CORE CONTENT ROWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: Recent Tickets (Colspan 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest">
              Recent Tickets
            </h3>
            <button
              onClick={() => setCreateOpen(true)}
              className="bg-accent-primary hover:bg-accent-glow text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-glow flex items-center gap-1.5 touch-target focus:outline-none"
            >
              <Plus className="w-4 h-4" />
              Create New Ticket
            </button>
          </div>

          {/* SKELETON LOADER */}
          {loading ? (
            <div className="flex flex-col gap-3 py-6 items-center justify-center border border-borderColor bg-background-surface rounded-2xl">
              <svg className="animate-spin h-7 w-7 text-accent-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : tickets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-scale-in">
              {tickets.slice(0, 5).map((t) => (
                <TicketCard
                  key={t._id}
                  ticket={t}
                  userRole="user"
                  onOpenDetail={handleOpenDetail}
                  onOpenChat={(id) => {
                    setSelectedTicketId(id);
                    navigate('/messages');
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 border-2 border-dashed border-borderColor bg-background-surface/30 rounded-2xl flex flex-col items-center gap-3">
              <FileText className="w-10 h-10 text-text-secondary/30" />
              <p className="text-xs font-bold text-text-secondary">No tickets filed yet.</p>
              <button
                onClick={() => setCreateOpen(true)}
                className="text-xs font-semibold text-accent-primary hover:text-accent-glow underline"
              >
                File your first support ticket
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Activity Feed */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-black uppercase text-text-secondary tracking-widest">
            Latest Activity
          </h3>

          <div className="bg-background-surface border border-borderColor rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-borderColor pb-3 mb-1">
              <Activity className="w-4 h-4 text-accent-glow" />
              <h4 className="text-xs font-bold text-text-primary">Status Tracker</h4>
            </div>
            
            <div className="flex flex-col gap-4">
              {activityFeed.length > 0 ? (
                activityFeed.map((act, i) => (
                  <div key={i} className="flex gap-3 items-start border-l-2 border-accent-primary/25 pl-4 pb-1 relative">
                    {/* Glowing bullet */}
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-glow absolute -left-[6px] top-1 shadow-glow" />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-primary font-semibold leading-relaxed leading-snug">
                        {act.text}
                      </p>
                      <span className="text-[9px] text-text-secondary mt-1 block">
                        {getRelativeTime(act.time)}
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

      {/* CREATE MODAL */}
      <CreateTicketModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onTicketCreated={handleTicketCreated}
      />

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

export default UserDashboard;
