import React from 'react';
import { useTickets } from '../../context/TicketContext';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../shared/Avatar';

/**
 * ChatSidebar - Lists all ticket conversations in support panel
 */
export function ChatSidebar() {
  const { user } = useAuth();
  const { tickets } = useTickets();
  const { activeTicketId, openChatRoom, unreadCounts } = useChat();

  const isEmployee = user?.role === 'employee';

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-accent-primary';
      case 'in_progress': return 'bg-accent-warning';
      case 'resolved': return 'bg-accent-success';
      default: return 'bg-text-secondary';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-surface">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-borderColor select-none">
        <h3 className="text-xs font-black uppercase text-accent-primary tracking-widest">
          Conversations
        </h3>
        <p className="text-[10px] text-text-secondary mt-0.5">Active Ticket Chatrooms</p>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {tickets.length > 0 ? (
          tickets.map((ticket) => {
            const isActive = activeTicketId === ticket._id;
            const unread = unreadCounts[ticket._id] || 0;
            const otherPartyName = isEmployee 
              ? ticket.createdBy?.fullName || 'Client User' 
              : ticket.assignedTo?.fullName || 'Support Agent';
            const otherPartyAvatar = isEmployee
              ? ticket.createdBy?.avatar
              : ticket.assignedTo?.avatar || 'avatar2';

            return (
              <button
                key={ticket._id}
                type="button"
                onClick={() => openChatRoom(ticket._id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  isActive 
                    ? 'bg-accent-primary/10 border border-accent-primary/20 text-text-primary' 
                    : 'border border-transparent hover:bg-background-elevated/40 text-text-secondary hover:text-text-primary'
                }`}
              >
                {/* Avatar with Status indicator */}
                <div className="relative shrink-0 select-none">
                  <Avatar avatar={otherPartyAvatar} size="sm" />
                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-background-surface ${
                    ticket.assignedTo ? 'bg-accent-success animate-pulse' : 'bg-text-secondary'
                  }`} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center select-none">
                    <span className="font-mono text-[10px] font-bold text-accent-glow truncate">
                      {ticket.ticketId}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status)}`} />
                  </div>
                  <h4 className="text-xs font-bold text-text-primary truncate mt-0.5">
                    {ticket.title}
                  </h4>
                  <p className="text-[10px] text-text-secondary truncate mt-0.5">
                    {otherPartyName}
                  </p>
                </div>

                {/* Unread count badge */}
                {unread > 0 && (
                  <span className="shrink-0 bg-accent-danger text-white text-[9px] font-bold h-4.5 w-4.5 rounded-full flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>
            );
          })
        ) : (
          <div className="text-center py-8 text-xs font-semibold text-text-secondary select-none">
            No active tickets found.
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatSidebar;
