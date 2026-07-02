import React, { useEffect } from 'react';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { useChat } from '../context/ChatContext';
import { useTickets } from '../context/TicketContext';
import { MessageCircle } from 'lucide-react';
import useOnlineStatus from '../pwa/useOnlineStatus';
import toast from 'react-hot-toast';

/**
 * MessagesPage - Dedicated messages routing page
 */
export function MessagesPage() {
  const { activeTicketId, openChatRoom, closeChatRoom } = useChat();
  const { tickets } = useTickets();
  const { isOnline } = useOnlineStatus();

  // If online and have tickets, auto-select first one on mount if no active room exists
  useEffect(() => {
    if (isOnline && tickets.length > 0 && !activeTicketId) {
      openChatRoom(tickets[0]._id);
    }
    return () => {
      // Keep chat open when navigating, but clean up state if desired.
      // Usually, leaving it open is better so if they click messages again, it is cached.
    };
  }, [isOnline, tickets, activeTicketId, openChatRoom]);

  if (!isOnline) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 select-none">
        <MessageCircle className="w-12 h-12 text-accent-danger/40 mb-3 animate-pulse" />
        <h4 className="text-sm font-bold text-text-primary">Chat Offline</h4>
        <p className="text-xs text-text-secondary max-w-[280px] mt-1.5 leading-relaxed">
          Real-time chat messaging requires a live network connection. Changes will update when you reconnect.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-1 w-full bg-background-surface border border-white/5 rounded-2xl overflow-hidden glass-panel select-none h-full min-h-0 shadow-glassShadow"
    >
      {/* Left Conversations list */}
      <div className="w-[200px] sm:w-[240px] border-r border-borderColor shrink-0 h-full flex flex-col">
        <ChatSidebar />
      </div>

      {/* Right chat logs window */}
      <div className="flex-1 min-w-0 h-full flex flex-col bg-background-primary/20">
        {activeTicketId ? (
          <ChatWindow />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
            <MessageCircle className="w-12 h-12 text-text-secondary/40 mb-3" />
            <h4 className="text-sm font-bold text-text-primary">Direct Support Chat</h4>
            <p className="text-xs text-text-secondary max-w-[240px] mt-1.5 leading-relaxed">
              Select an active conversation room from the left sidebar to open the chat window.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessagesPage;
