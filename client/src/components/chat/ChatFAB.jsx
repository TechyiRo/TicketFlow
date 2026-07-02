import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Plus } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import useOnlineStatus from '../../pwa/useOnlineStatus';
import { useTickets } from '../../context/TicketContext';

/**
 * ChatFAB - Floating action button that opens the slide-over Support Chat panel
 */
export function ChatFAB() {
  const { getTotalUnreadCount, activeTicketId, openChatRoom, closeChatRoom } = useChat();
  const { tickets } = useTickets();
  const { isOnline } = useOnlineStatus();
  
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = getTotalUnreadCount();

  // Watch URL hash changes for manual redirection to chat
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#messages') {
        setIsOpen(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      closeChatRoom();
      if (window.location.hash === '#messages') {
        window.location.hash = ''; // Clear hash
      }
    } else {
      setIsOpen(true);
      // Auto-open first ticket chat if available
      if (tickets.length > 0 && !activeTicketId) {
        openChatRoom(tickets[0]._id);
      }
    }
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      {isOnline && (
        <div className="fixed bottom-6 right-6 z-40 select-none">
          {/* Pulse ring when there are unread messages */}
          {unreadCount > 0 && !isOpen && (
            <div className="absolute inset-0 rounded-full border-4 border-accent-glow animate-ping opacity-75 pointer-events-none" />
          )}
          
          <button
            onClick={handleToggle}
            aria-label="Toggle live support chat"
            className="w-16 h-16 rounded-full bg-accent-primary hover:bg-accent-glow text-white flex items-center justify-center shadow-primaryGlow active:scale-95 transition-all focus:outline-none"
          >
            {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
          </button>

          {/* Red Unread Badge */}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-accent-danger text-white text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center border-2 border-background-primary shadow-md">
              {unreadCount}
            </span>
          )}
        </div>
      )}

      {/* SLIDE-OVER CHAT PANEL */}
      {isOpen && isOnline && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop (dismisses chat on click) */}
          <div 
            onClick={handleToggle}
            className="absolute inset-0 bg-[#0A0F1E]/60 backdrop-blur-xs" 
          />

          {/* Slide-over Container */}
          <div 
            className="relative w-full sm:w-[600px] md:w-[700px] lg:w-[800px] h-full bg-background-surface border-l border-borderColor flex shadow-2xl animate-slide-up sm:animate-fade-in z-10"
            style={{
              height: '100dvh',
              animationDuration: '0.3s'
            }}
          >
            {/* Conversations Sidebar (240px) */}
            <div className="w-[200px] sm:w-[240px] border-r border-borderColor flex flex-col shrink-0">
              <ChatSidebar />
            </div>

            {/* Chat Window Panel */}
            <div className="flex-1 flex flex-col min-w-0 bg-background-primary/40">
              {activeTicketId ? (
                <ChatWindow />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
                  <MessageCircle className="w-12 h-12 text-text-secondary/40 mb-3" />
                  <h4 className="text-sm font-bold text-text-primary">Support Rooms</h4>
                  <p className="text-xs text-text-secondary max-w-[200px] mt-1 leading-relaxed">
                    Select a ticket from the sidebar to open the real-time chat room.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatFAB;
