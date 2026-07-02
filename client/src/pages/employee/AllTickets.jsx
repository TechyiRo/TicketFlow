import React, { useState, useEffect } from 'react';
import { useTickets } from '../../context/TicketContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import TicketTable from '../../components/tickets/TicketTable';
import TicketCard from '../../components/tickets/TicketCard';
import TicketDetailModal from '../../components/tickets/TicketDetailModal';
import { Search, RefreshCw, X, Grid, List, Building2, ArrowLeft } from 'lucide-react';
import Badge from '../../components/shared/Badge';
import toast from 'react-hot-toast';

// Custom Component for rendering company logo image or default icon
function CompanyLogo({ logo, name }) {
  const [error, setError] = useState(false);
  
  if (logo && !error) {
    return (
      <img 
        src={logo} 
        alt={`${name} logo`} 
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    );
  }
  
  return <Building2 className="w-5 h-5" />;
}

export function AllTickets() {
  const { user } = useAuth();
  const { tickets, loading, fetchTickets } = useTickets();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [selectedCompany, setSelectedCompany] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const handleRefresh = () => {
    fetchTickets({
      search: search || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      category: categoryFilter || undefined,
    });
  };

  useEffect(() => {
    handleRefresh();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleRefresh();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    fetchTickets();
  };

  const handleOpenDetail = (id) => {
    setSelectedTicketId(id);
    setDetailOpen(true);
  };

  const handleTicketUpdated = () => {
    handleRefresh();
  };

  // Group tickets by creator's company name
  const ticketsByCompany = {};
  tickets.forEach((ticket) => {
    const companyName = ticket.createdBy?.company?.name || 'Individual / Unknown';
    if (!ticketsByCompany[companyName]) {
      ticketsByCompany[companyName] = {
        name: companyName,
        companyDetails: ticket.createdBy?.company || {},
        logo: ticket.createdBy?.logo || '',
        tickets: [],
      };
    }
    ticketsByCompany[companyName].tickets.push(ticket);
  });

  const companiesList = Object.values(ticketsByCompany);

  // Tickets filtered by selected company (if in company view)
  const filteredTickets = selectedCompany
    ? tickets.filter((t) => (t.createdBy?.company?.name || 'Individual / Unknown') === selectedCompany)
    : tickets;

  const renderTicketsList = (items) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
        {items.map((t) => (
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
    );
  };

  return (
    <div className="flex flex-col gap-6 select-none animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center select-none">
        <div>
          <h2 className="text-sm font-black uppercase text-text-secondary tracking-widest">
            All System Tickets
          </h2>
          <p className="text-[10px] text-text-secondary mt-0.5">
            Monitor and resolve tickets across the system
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          className="p-2 text-text-secondary hover:text-text-primary rounded-lg border border-white/5 hover:bg-white/5 bg-background-surface transition-all shrink-0 touch-target"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs & View Switcher removed for Company-only focus */}

      {/* Filters Card */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col gap-5 select-none">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary/70">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Ticket ID, Title, Description..."
              className="w-full h-12 bg-white/5 border border-white/10 focus:border-accent-primary/80 focus:bg-white/10 focus:outline-none rounded-xl pl-12 pr-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all"
            />
          </div>
          <button
            type="submit"
            className="btn-cyber-glow h-12 text-white px-8 rounded-xl text-sm font-extrabold shrink-0 active:scale-95 transition-all focus:outline-none"
          >
            Search
          </button>
        </form>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-text-primary px-3 focus:outline-none focus:border-accent-primary/80 focus:bg-white/10 cursor-pointer font-medium transition-all"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-11 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-text-primary px-3 focus:outline-none focus:border-accent-primary/80 focus:bg-white/10 cursor-pointer font-medium transition-all"
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-text-primary px-3 focus:outline-none focus:border-accent-primary/80 focus:bg-white/10 cursor-pointer font-medium transition-all"
          >
            <option value="">All Categories</option>
            <option value="technical">Technical</option>
            <option value="billing">Billing</option>
            <option value="general">General</option>
            <option value="feature">Feature Request</option>
            <option value="bug">Bug</option>
          </select>

          {/* Clear */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs sm:text-sm font-bold text-text-secondary hover:text-text-primary flex items-center justify-center gap-2 active:scale-95 transition-all select-none focus:outline-none"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* TICKETS LIST DISPLAY */}
      {loading ? (
        <div className="flex flex-col gap-3 py-16 items-center justify-center border border-white/5 bg-background-surface rounded-2xl shadow-glassShadow">
          <svg className="animate-spin h-8 w-8 text-accent-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : tickets.length > 0 ? (
        !selectedCompany ? (
          /* Company Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-scale-in">
            {companiesList.map((comp) => {
              const openCount = comp.tickets.filter(t => t.status === 'open').length;
              const progressCount = comp.tickets.filter(t => t.status === 'in_progress').length;
              const resolvedCount = comp.tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length;
              
              return (
                <div 
                  key={comp.name}
                  onClick={() => setSelectedCompany(comp.name)}
                  className="glass-card p-5 cursor-pointer rounded-2xl flex flex-col justify-between min-h-[140px] border border-white/5 relative overflow-hidden group/card"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-glow shadow-primaryGlow overflow-hidden shrink-0">
                        <CompanyLogo logo={comp.logo} name={comp.name} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-sm font-black text-text-primary truncate max-w-[150px]">{comp.name}</h4>
                        <span className="text-[10px] text-text-secondary mt-0.5 truncate max-w-[150px]">
                          {comp.companyDetails.contactNumber || 'No Phone'}
                        </span>
                      </div>
                    </div>
                    <Badge variant="primary" className="text-[9px] font-bold">
                      {comp.tickets.length} Tickets
                    </Badge>
                  </div>

                  {/* Status counts pills */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5 text-[9px] font-bold select-none text-center">
                    <div className="bg-accent-primary/10 border border-accent-primary/20 text-accent-glow rounded py-1">
                      {openCount} Open
                    </div>
                    <div className="bg-accent-warning/10 border border-accent-warning/20 text-accent-warning rounded py-1">
                      {progressCount} Active
                    </div>
                    <div className="bg-accent-success/10 border border-accent-success/20 text-accent-success rounded py-1">
                      {resolvedCount} Done
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-scale-in">
            {/* Filter description with Back button if filtered by company */}
            {selectedCompany && (
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg border border-white/5 transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider active:scale-95"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Companies
                </button>
                <span className="text-xs text-text-secondary">
                  Showing tickets raised by users of <strong className="text-text-primary">{selectedCompany}</strong>
                </span>
              </div>
            )}
            
            {/* Render tickets list (Table or Grid) */}
            {renderTicketsList(filteredTickets)}
          </div>
        )
      ) : (
        <div className="text-center py-20 px-6 bg-background-surface border border-borderColor rounded-2xl select-none shadow-glassShadow">
          <p className="text-xs font-bold text-text-secondary">
            No matching tickets found.
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

export default AllTickets;
