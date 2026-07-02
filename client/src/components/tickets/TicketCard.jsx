import React, { useState } from 'react';
import { useDrag } from '@use-gesture/react';
import PriorityBadge from './PriorityBadge';
import Badge from '../shared/Badge';
import Avatar from '../shared/Avatar';
import { MessageSquare, User, Check, Edit2, Phone } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';

/**
 * TicketCard - Mobile card representing a ticket. Implements swipe gestures.
 */
export function TicketCard({ ticket, onOpenDetail, onOpenChat, onQuickAssign, onQuickStatus, userRole }) {
  const [xOffset, setXOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const { unreadCounts } = useChat();
  const { activeCallTickets } = useCall();

  const isEmployee = userRole === 'employee';
  const unread = unreadCounts[ticket._id] || 0;
  const hasActiveCall = activeCallTickets.includes(ticket._id);

  const bind = useDrag(({ active, movement: [mx] }) => {
    setIsSwiping(active);
    if (active) {
      // Limit drag distance
      setXOffset(Math.max(-150, Math.min(150, mx)));
    } else {
      // Release gesture
      if (mx > 120) {
        // Swipe Right: View Details
        onOpenDetail(ticket._id);
      } else if (mx < -120) {
        // Swipe Left: Perform quick actions based on role
        if (isEmployee) {
          onQuickAssign(ticket);
        } else {
          onOpenChat(ticket._id);
        }
      }
      setXOffset(0);
    }
  }, {
    axis: 'x',
    filterTaps: true,
  });

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
    <div className="relative w-full min-h-[110px] select-none touch-pan-y group">
      
      {/* BACKGROUND QUICK ACTIONS: Revealed on swipe */}
      <div className="absolute inset-0 flex items-center justify-between px-6 bg-white/5 text-xs font-bold pointer-events-none">
        {/* Swipe Right indicator */}
        <div className={`flex items-center gap-1.5 text-accent-success transition-opacity duration-150 ${xOffset > 30 ? 'opacity-100' : 'opacity-0'}`}>
          <Check className="w-4 h-4" />
          View Details
        </div>
        
        {/* Swipe Left indicator */}
        <div className={`flex items-center gap-1.5 text-accent-primary transition-opacity duration-150 ${xOffset < -30 ? 'opacity-100' : 'opacity-0'}`}>
          {isEmployee ? (
            <>
              <Edit2 className="w-4 h-4" />
              Manage / Assign
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              Open Chat
            </>
          )}
        </div>
      </div>

      {/* FOREGROUND SWIPE WRAPPER */}
      <div
        {...bind()}
        style={{
          transform: `translate3d(${xOffset}px, 0, 0)`,
          transition: isSwiping ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          touchAction: 'pan-y',
        }}
        className="w-full relative z-10"
      >
        {/* ACTUAL 3D GLASS CARD */}
        <div
          onClick={() => onOpenDetail(ticket._id)}
          className="w-full glass-card rounded-2xl p-5 flex flex-col gap-3.5 cursor-pointer hover:shadow-primaryGlow"
        >
        {/* Header line */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-accent-glow">{ticket.ticketId}</span>
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
          </div>
          <div className="flex gap-1.5 items-center">
            <PriorityBadge priority={ticket.priority} />
            <Badge variant={getStatusColor(ticket.status)}>
              {ticket.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <h4 className="text-sm font-bold text-text-primary truncate">
          {ticket.title}
        </h4>

        {/* Footer info */}
        <div className="flex justify-between items-center text-[10px] text-text-secondary select-none">
          <span className="bg-background-primary px-2 py-0.5 rounded border border-borderColor capitalize">
            {ticket.category}
          </span>
          <div className="flex items-center gap-2">
            {isEmployee ? (
              <span className="flex items-center gap-1 font-medium">
                <User className="w-3 h-3" />
                {ticket.createdBy?.fullName || 'Client'}
              </span>
            ) : (
              <span className="flex items-center gap-1 font-medium">
                <User className="w-3 h-3 text-accent-primary" />
                {ticket.assignedTo ? ticket.assignedTo.fullName : 'Unassigned'}
              </span>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default TicketCard;
