import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Ticket as TicketIcon, Search, Filter, AlertCircle, CheckCircle, Clock, UserPlus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const statusColors = {
  open: 'text-accent-warning bg-accent-warning/10 border-accent-warning/20',
  in_progress: 'text-accent-primary bg-accent-primary/10 border-accent-primary/20',
  resolved: 'text-accent-success bg-accent-success/10 border-accent-success/20',
  closed: 'text-text-secondary bg-white/5 border-white/10',
};

const priorityColors = {
  low: 'text-text-secondary',
  medium: 'text-accent-primary',
  high: 'text-accent-warning',
  critical: 'text-accent-danger',
};

export default function AdminManageTickets() {
  const { tickets, employees, loading, fetchTickets, fetchEmployees } = useAdmin();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigningId, setAssigningId] = useState(null);

  useEffect(() => {
    fetchTickets();
    fetchEmployees();
  }, [fetchTickets, fetchEmployees]);

  const handleAssign = async (ticketId, employeeId) => {
    setAssigningId(ticketId);
    try {
      await api.put(`/tickets/${ticketId}/assign`, { employeeId: employeeId || null });
      toast.success('Ticket assignment updated');
      fetchTickets(); // Refresh list to get updated assignment
    } catch (err) {
      toast.error('Failed to assign ticket');
      console.error(err);
    } finally {
      setAssigningId(null);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) || 
      t._id.includes(search) || 
      t.createdBy?.company?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white">Global Tickets</h1>
          <p className="text-sm text-text-secondary">Oversee all company tickets across the platform.</p>
        </div>

        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize ${
                statusFilter === status ? 'bg-accent-primary text-white shadow-md' : 'text-text-secondary hover:text-white'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 shrink-0">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary w-5 h-5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ticket title, ID, or company name..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-colors"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-10 text-text-secondary flex flex-col items-center">
            <TicketIcon className="w-12 h-12 opacity-20 mb-3" />
            No tickets match your criteria.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredTickets.map(ticket => (
              <div key={ticket._id} className="glass-panel p-4 md:p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 justify-between group hover:border-white/20 transition-all relative">
                
                {assigningId === ticket._id && (
                  <div className="absolute inset-0 bg-background-primary/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                    <div className="w-6 h-6 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${statusColors[ticket.status]}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-text-secondary">#{ticket._id.substring(ticket._id.length - 6)}</span>
                    <span className={`text-xs font-bold uppercase ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-white truncate">{ticket.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
                    <span className="truncate max-w-[150px]">
                      Created by <strong className="text-white">{ticket.createdBy?.fullName || 'Unknown'}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-accent-purple font-bold truncate max-w-[150px]">
                      {ticket.createdBy?.company?.name || 'No Company'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col justify-between shrink-0 text-xs text-text-secondary border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-4 min-w-[200px]">
                  <div className="flex flex-col gap-1.5 mb-3">
                    <span className="font-bold flex items-center gap-1"><UserPlus className="w-3 h-3"/> Assign To:</span>
                    <select
                      value={ticket.assignedTo?._id || ''}
                      onChange={(e) => handleAssign(ticket._id, e.target.value)}
                      className="w-full bg-background-elevated border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-accent-primary"
                    >
                      <option value="">Unassigned</option>
                      {employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.fullName} ({emp.department})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="text-right mt-auto flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
