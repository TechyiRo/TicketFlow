import React from 'react';
import PriorityBadge from './PriorityBadge';
import Badge from '../shared/Badge';
import { User, Phone } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';

export function TicketCard({ ticket, onOpenChat, userRole }) {
  const { unreadCounts } = useChat();
  const { activeCallTickets } = useCall();

  const isEmployee = userRole === 'employee';
  const unread = unreadCounts[ticket._id] || 0;
  const hasActiveCall = activeCallTickets.includes(ticket._id);

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

  const priorityBorderColor = (p) => {
    switch (String(p).toLowerCase()) {
      case 'low': return 'border-b-accent-success';
      case 'medium': return 'border-b-accent-warning';
      case 'high':
      case 'critical':
      default:
        return 'border-b-accent-danger';
    }
  };

  return (
    <div className="relative w-full select-none group border-b border-borderColor/10 md:border-b-0">
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onOpenChat(ticket._id);
        }}
        className={`w-full bg-[#0d121f]/45 backdrop-blur-md md:glass-card rounded-none md:rounded-2xl p-4 md:p-5 flex flex-col gap-3 cursor-pointer hover:shadow-primaryGlow border-b-2 ${priorityBorderColor(ticket.priority)} border-t-0 border-x-0 md:border`}
      >
        {/* Top Line */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-secondary font-medium">{ticket.ticketId}</span>
            {hasActiveCall && (
              <span className="w-5 h-5 rounded-full bg-accent-success/15 border border-accent-success/35 text-accent-success flex items-center justify-center animate-pulse">
                <Phone className="w-2.5 h-2.5 animate-bounce" />
              </span>
            )}
            {unread > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-cyan text-[#030712] shadow-cyanGlow animate-pulse">
                {unread}
              </span>
            )}
          </div>
          <div>
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-text-primary leading-tight">
          {ticket.title}
        </h4>

        {/* Description */}
        <p className="text-xs text-text-secondary truncate">
          {ticket.description || 'No description provided.'}
        </p>

        {/* Bottom Line */}
        <div className="flex items-center justify-between mt-1 text-[11px] text-text-secondary">
          <div>
            <Badge variant={getStatusColor(ticket.status)}>
              {ticket.status.replace('_', ' ')}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <User className="w-3.5 h-3.5" />
            <span>
              {isEmployee 
                ? (ticket.createdBy?.fullName || 'Client') 
                : (ticket.assignedTo ? ticket.assignedTo.fullName : 'Unassigned')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketCard;
