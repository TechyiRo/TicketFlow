import React, { useState, useEffect } from 'react';
import { useTickets } from '../../context/TicketContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TicketTable from '../../components/tickets/TicketTable';
import TicketCard from '../../components/tickets/TicketCard';
import TicketDetailModal from '../../components/tickets/TicketDetailModal';
import { RefreshCw, ClipboardList, Grid, List } from 'lucide-react';
import toast from 'react-hot-toast';

export function AssignedTickets() {
  const { user } = useAuth();
  const { tickets, loading, fetchTickets } = useTickets();
  const navigate = useNavigate();

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Fetch only tickets assigned to this employee
  const handleRefresh = () => {
    fetchTickets({
      assignedTo: user?.id,
    });
  };

  useEffect(() => {
    handleRefresh();
  }, [user]);

  // Client-side filtering check for safety
  const assignedTickets = tickets.filter(
    (t) => t.assignedTo && (t.assignedTo._id === user?.id || t.assignedTo === user?.id)
  );

  const handleOpenDetail = (id) => {
    setSelectedTicketId(id);
    setDetailOpen(true);
  };

  const handleTicketUpdated = () => {
    handleRefresh();
  };

  return (
    <div className="flex flex-col gap-6 select-none animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h2 className="text-sm font-black uppercase text-text-secondary tracking-widest">
            My Workload
          </h2>
          <p className="text-[10px] text-text-secondary mt-0.5">
            Manage tickets assigned to you
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-text-secondary hover:text-text-primary rounded-lg border border-white/5 hover:bg-white/5 bg-background-surface transition-all shrink-0 touch-target shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex flex-col gap-3 py-16 items-center justify-center border border-white/5 bg-background-surface rounded-2xl shadow-glassShadow">
          <svg className="animate-spin h-8 w-8 text-accent-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : assignedTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
            {assignedTickets.map((t) => (
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
        <div className="text-center py-20 px-6 border border-white/5 bg-background-surface/30 rounded-2xl flex flex-col items-center gap-3 select-none shadow-glassShadow">
          <ClipboardList className="w-10 h-10 text-text-secondary/30" />
          <p className="text-xs font-bold text-text-secondary">
            You do not have any tickets assigned to you currently.
          </p>
        </div>
      )}

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

export default AssignedTickets;
