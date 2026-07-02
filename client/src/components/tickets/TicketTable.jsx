import React, { useState, useEffect } from 'react';
import PriorityBadge from './PriorityBadge';
import Badge from '../shared/Badge';
import Avatar from '../shared/Avatar';
import { Eye, MessageSquare, UserPlus, Phone } from 'lucide-react';
import ticketService from '../../services/ticketService';
import employeeService from '../../services/employeeService';
import toast from 'react-hot-toast';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';

export function TicketTable({ tickets, userRole, onOpenDetail, onOpenComment, onTicketUpdated }) {
  const [employees, setEmployees] = useState([]);
  const isEmployee = userRole === 'employee';
  const { unreadCounts } = useChat();
  const { activeCallTickets } = useCall();

  useEffect(() => {
    if (isEmployee && navigator.onLine) {
      employeeService.getEmployees()
        .then(setEmployees)
        .catch(console.error);
    }
  }, [isEmployee]);

  const handleStatusChange = async (ticketId, e) => {
    const newStatus = e.target.value;
    try {
      const updated = await ticketService.updateStatus(ticketId, newStatus);
      toast.success('Status updated!');
      onTicketUpdated(updated);
    } catch (err) {
      console.error(err);
      toast.error('Failed to change status.');
    }
  };

  const handleAssignChange = async (ticketId, e) => {
    const empId = e.target.value;
    try {
      const updated = await ticketService.assignTicket(ticketId, empId);
      toast.success(empId ? 'Ticket assigned!' : 'Ticket unassigned.');
      onTicketUpdated(updated);
    } catch (err) {
      console.error(err);
      toast.error('Failed to change assignment.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'primary';
      case 'in_progress': return 'warning';
      case 'pending': return 'neutral';
      case 'resolved': return 'success';
      case 'closed': return 'neutral';
      default: return 'primary';
    }
  };

  return (
    <div className="w-full bg-background-surface border border-borderColor rounded-2xl overflow-hidden select-none shadow-glassShadow">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-white/5 border-b border-borderColor text-xs font-bold text-text-secondary uppercase tracking-wider select-none">
              <th className="px-6 py-4 min-w-[110px]">Ticket ID</th>
              <th className="px-6 py-4 min-w-[200px]">Title</th>
              {!isEmployee ? null : <th className="px-6 py-4 min-w-[150px] hidden lg:table-cell">Client User</th>}
              <th className="px-6 py-4 min-w-[115px]">Priority</th>
              <th className="px-6 py-4 min-w-[110px] hidden lg:table-cell">Category</th>
              <th className="px-6 py-4 min-w-[140px]">Status</th>
              <th className="px-6 py-4 min-w-[160px] hidden md:table-cell">Assigned To</th>
              <th className="px-6 py-4 min-w-[100px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm text-text-primary">
            {tickets.map((ticket) => {
              const unread = unreadCounts[ticket._id] || 0;
              const hasActiveCall = activeCallTickets.includes(ticket._id);
              return (
                <tr key={ticket._id} className="hover:bg-white/5 transition-colors">
                  {/* ID */}
                  <td className="px-6 py-4 font-mono font-bold text-accent-glow whitespace-nowrap min-w-[110px] flex items-center gap-2">
                    {ticket.ticketId}
                    {hasActiveCall && (
                      <span className="w-5 h-5 rounded-full bg-accent-success/15 border border-accent-success/35 text-accent-success flex items-center justify-center animate-pulse" title="Active voice call ongoing">
                        <Phone className="w-2.5 h-2.5 animate-bounce" style={{ animationDuration: '2s' }} />
                      </span>
                    )}
                    {unread > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent-cyan text-background-primary shadow-cyanGlow animate-pulse">
                        {unread}
                      </span>
                    )}
                  </td>
                
                {/* Title */}
                <td className="px-6 py-4 font-semibold truncate max-w-[220px] min-w-[200px]" title={ticket.title}>
                  {ticket.title}
                </td>

                {/* Client User (Employees only) */}
                {isEmployee && (
                  <td className="px-6 py-4 hidden lg:table-cell whitespace-nowrap min-w-[150px]">
                    <div className="flex items-center gap-2">
                      <Avatar avatar={ticket.createdBy?.avatar} size="xs" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-text-primary leading-none">{ticket.createdBy?.fullName || 'Client'}</span>
                        <span className="text-[9px] text-text-secondary mt-0.5 font-medium truncate max-w-[110px]">
                          {ticket.createdBy?.company?.name || 'Individual'}
                        </span>
                      </div>
                    </div>
                  </td>
                )}

                {/* Priority */}
                <td className="px-6 py-4 whitespace-nowrap min-w-[115px]">
                  <PriorityBadge priority={ticket.priority} />
                </td>

                {/* Category */}
                <td className="px-6 py-4 hidden lg:table-cell whitespace-nowrap capitalize min-w-[110px]">
                  <Badge variant="neutral">{ticket.category}</Badge>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap min-w-[140px]">
                  {isEmployee && navigator.onLine ? (
                    <select
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket._id, e)}
                      className="bg-white/5 border border-white/10 rounded-md text-xs font-semibold px-2 py-1.5 focus:outline-none focus:border-accent-primary/80 focus:ring-1 focus:ring-accent-primary/20 text-text-primary backdrop-blur-md w-full"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  ) : (
                    <Badge variant={getStatusColor(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  )}
                </td>

                {/* Assigned To */}
                <td className="px-6 py-4 hidden md:table-cell whitespace-nowrap min-w-[160px]">
                  {isEmployee && navigator.onLine ? (
                    <select
                      value={ticket.assignedTo?._id || ''}
                      onChange={(e) => handleAssignChange(ticket._id, e)}
                      className="bg-white/5 border border-white/10 rounded-md text-xs font-semibold px-2 py-1.5 focus:outline-none focus:border-accent-primary/80 focus:ring-1 focus:ring-accent-primary/20 text-text-primary backdrop-blur-md w-full max-w-[150px]"
                    >
                      <option value="">Unassigned</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.fullName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                      <Avatar avatar={ticket.assignedTo?.avatar} size="xs" />
                      {ticket.assignedTo ? ticket.assignedTo.fullName : 'Unassigned'}
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right whitespace-nowrap min-w-[100px]">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View Button */}
                    <button
                      onClick={() => onOpenDetail(ticket._id)}
                      title="View Details"
                      className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors touch-target"
                    >
                      <Eye className="w-4.5 h-4.5" />
                    </button>
                    {/* Comment button */}
                    <button
                      onClick={() => onOpenComment(ticket._id)}
                      title="Write Comment"
                      className="p-2 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors touch-target"
                    >
                      <MessageSquare className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TicketTable;
