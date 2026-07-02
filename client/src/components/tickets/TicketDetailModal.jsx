import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { useChat } from '../../context/ChatContext';
import PriorityBadge from './PriorityBadge';
import Badge from '../shared/Badge';
import Avatar from '../shared/Avatar';
import Modal from '../shared/Modal';
import { Calendar, User, Paperclip, Lock } from 'lucide-react';
import ticketService from '../../services/ticketService';
import employeeService from '../../services/employeeService';
import toast from 'react-hot-toast';
import ChatWindow from '../chat/ChatWindow';

export function TicketDetailModal({ isOpen, ticketId, onClose, onTicketUpdated }) {
  const { user } = useAuth();
  const { fetchTicketById } = useTickets();
  const { openChatRoom, closeChatRoom } = useChat();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);

  const isEmployee = user?.role === 'employee';
  const userRole = user?.role;

  // Use a Ref to keep track of the latest onClose handler
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  // Load ticket details on ID change
  useEffect(() => {
    if (!ticketId || !isOpen) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const details = await fetchTicketById(ticketId);
        setTicket(details);

        // Open chat room automatically
        openChatRoom(ticketId);

        // Fetch employee list if current user is an employee (for assignment dropdown)
        if (userRole === 'employee' || userRole === 'admin') {
          const empList = await employeeService.getEmployees();
          setEmployees(empList);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load ticket details.');
        onCloseRef.current();
      } finally {
        setLoading(false);
      }
    };

    loadData();

    return () => {
      closeChatRoom();
    };
  }, [ticketId, isOpen, fetchTicketById, userRole, openChatRoom, closeChatRoom]);

  // Handle Status change (employee/admin only)
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const updated = await ticketService.updateStatus(ticket._id, newStatus);
      setTicket(updated);
      toast.success('Status updated successfully!');
      if (onTicketUpdated) onTicketUpdated(updated);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
  };

  // Handle Assignment change (employee/admin only)
  const handleAssigneeChange = async (e) => {
    const empId = e.target.value;
    try {
      const updated = await ticketService.assignTicket(ticket._id, empId);
      setTicket(updated);
      toast.success(empId ? 'Ticket assigned successfully!' : 'Ticket unassigned.');
      if (onTicketUpdated) onTicketUpdated(updated);
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign ticket.');
    }
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  };

  if (!isOpen) return null;

  // Authorization checks for chat participation
  const isAdmin = user?.role === 'admin';
  const isCreator = ticket && (ticket.createdBy?._id === user?.id || ticket.createdBy === user?.id);
  const isAssigned = ticket && (ticket.assignedTo?._id === user?.id || ticket.assignedTo === user?.id);
  const hasChatAccess = isAdmin || isCreator || isAssigned;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={ticket ? `Ticket Details — ${ticket.ticketId}` : 'Loading details...'}
      fullCard={true}
      className="w-full max-w-6xl h-[90vh] flex flex-col"
    >
      {loading || !ticket ? (
        <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
          <svg className="animate-spin h-8 w-8 text-accent-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full min-h-0 text-left">
          {/* Left Column: Ticket Information */}
          <div className="md:col-span-6 flex flex-col gap-4 min-h-0 overflow-y-auto pr-2">
            {/* Header info row */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-borderColor/30 shrink-0">
              <PriorityBadge priority={ticket.priority} />
              <Badge variant="primary">{ticket.category}</Badge>
              <span className="text-xs text-text-secondary flex items-center gap-1 ml-auto">
                <Calendar className="w-3.5 h-3.5" />
                {getRelativeTime(ticket.createdAt)}
              </span>
            </div>

            {/* Ticket title and status */}
            <div>
              <h3 className="text-lg font-black text-text-primary leading-tight">
                {ticket.title}
              </h3>
              {ticket._offline && (
                <span className="text-[10px] text-accent-warning font-bold bg-accent-warning/10 px-2 py-0.5 rounded border border-accent-warning/20 mt-1 inline-block">
                  Offline Pending Sync
                </span>
              )}
            </div>

            {/* Editable Actions (Status / Assign) */}
            <div className="grid grid-cols-2 gap-4 bg-background-elevated/20 p-4 border border-borderColor/30 rounded-xl">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Status
                </label>
                {isEmployee || isAdmin ? (
                  <select
                    value={ticket.status}
                    onChange={handleStatusChange}
                    className="h-10 bg-background-elevated border border-borderColor rounded-lg text-xs text-text-primary px-3 focus:outline-none focus:border-accent-primary"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  <span className="h-10 border border-borderColor rounded-lg text-xs font-semibold px-3 flex items-center bg-background-elevated/40 text-text-primary">
                    {ticket.status.toUpperCase().replace('_', ' ')}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  Assignee
                </label>
                {isEmployee || isAdmin ? (
                  <select
                    value={ticket.assignedTo?._id || ticket.assignedTo || ''}
                    onChange={handleAssigneeChange}
                    className="h-10 bg-background-elevated border border-borderColor rounded-lg text-xs text-text-primary px-3 focus:outline-none focus:border-accent-primary"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.fullName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="h-10 border border-borderColor rounded-lg text-xs font-semibold px-3 flex items-center bg-background-elevated/40 text-text-primary gap-2 truncate">
                    <User className="w-4 h-4 text-text-secondary shrink-0" />
                    {ticket.assignedTo?.fullName || ticket.assignedToName || 'Unassigned'}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                Description
              </label>
              <div className="bg-background-primary/30 border border-borderColor/50 rounded-xl p-4 min-h-[100px]">
                <p className="text-xs sm:text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </p>
              </div>
            </div>

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="mt-2 shrink-0">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" />
                  Attachments ({ticket.attachments.length})
                </h4>
                <div className="flex flex-wrap gap-2.5">
                  {ticket.attachments.map((url, idx) => (
                    <a 
                      key={idx} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-16 h-16 rounded-lg border border-borderColor/40 overflow-hidden bg-background-elevated/45 hover:border-accent-primary transition-all shadow-sm shrink-0 flex items-center justify-center"
                    >
                      {url.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                        <img src={url} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-accent-primary font-bold">DOC</span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {/* Call History section */}
            <div className="mt-4 border-t border-borderColor/20 pt-4 shrink-0">
              <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                Call History ({(ticket.callHistory || []).length})
              </h4>
              {(ticket.callHistory && ticket.callHistory.length > 0) ? (
                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                  {ticket.callHistory.map((call, idx) => {
                    const callDate = new Date(call.startTime).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    
                    const formatSecs = (totalSecs) => {
                      if (!totalSecs) return '0s';
                      const m = Math.floor(totalSecs / 60);
                      const s = totalSecs % 60;
                      return m > 0 ? `${m}m ${s}s` : `${s}s`;
                    };

                    return (
                      <div key={idx} className="p-2.5 rounded-lg border border-borderColor/40 bg-background-elevated/20 flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${call.isMissed ? 'text-accent-danger' : 'text-accent-success'}`}>
                            {call.isMissed ? `Missed Call from ${call.callerName}` : `Call Connected`}
                          </span>
                          <span className="text-text-secondary">{callDate}</span>
                        </div>
                        <div className="text-text-secondary">
                          {call.isMissed ? (
                            <span>Call attempt was missed or unanswered.</span>
                          ) : (
                            <span>
                              <strong>Duration:</strong> {formatSecs(call.duration)} | <strong>Participants:</strong> {call.participants?.join(', ') || 'Caller'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-text-secondary/50 italic">No call logs have been recorded for this ticket.</p>
              )}
            </div>
          </div>

          {/* Right Column: Chat Panel */}
          <div className="md:col-span-6 flex flex-col border-t md:border-t-0 md:border-l border-borderColor/20 pt-4 md:pt-0 md:pl-6 h-full min-h-0">
            {hasChatAccess ? (
              <div className="flex-1 h-full min-h-0 bg-background-elevated/5 border border-borderColor/25 rounded-2xl overflow-hidden">
                <ChatWindow />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-borderColor/40 rounded-2xl bg-background-elevated/5 text-center select-none h-full">
                <Lock className="w-10 h-10 text-text-secondary/50 mb-3" />
                <h4 className="text-sm font-bold text-text-primary mb-1">Chat Restricted</h4>
                <p className="text-xs text-text-secondary max-w-[280px]">
                  For compliance and privacy reasons, chat operations are restricted to the ticket creator, assigned support agent, and system administrators.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default TicketDetailModal;
