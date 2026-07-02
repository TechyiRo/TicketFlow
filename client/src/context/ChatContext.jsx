import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import chatService from '../services/chatService';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { X, MessageCircle } from 'lucide-react';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({}); // { ticketId: count }
  const [typingUsers, setTypingUsers] = useState({}); // { ticketId: { userId: userName } }
  
  // Custom stacking notifications toasts
  const [notifications, setNotifications] = useState([]);
  
  const socketRef = useRef(null);
  const activeTicketIdRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    activeTicketIdRef.current = activeTicketId;
  }, [activeTicketId]);

  // Initialize socket connection
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      setMessages([]);
      setActiveTicketId(null);
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    console.log(`Connecting Socket.IO to ${socketUrl}...`);
    
    const s = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = s;
    setSocket(s);

    s.on('connect', () => {
      console.log('Socket.IO connection established.');
      if (activeTicketIdRef.current) {
        s.emit('join_room', { 
          ticketId: activeTicketIdRef.current, 
          userId: user.id, 
          role: user.role 
        });
      }
    });

    s.on('receive_message', (message) => {
      const currentActiveId = activeTicketIdRef.current;
      
      if (message.ticketId === currentActiveId) {
        setMessages((prev) => {
          if (message.tempId) {
            const alreadySaved = prev.some(m => m._id === message._id);
            if (alreadySaved) {
              return prev.filter(m => m._id !== message.tempId);
            }
            return prev.map(m => m._id === message.tempId ? message : m);
          }
          
          if (prev.find(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
        
        // Immediately notify server that we read it
        s.emit('read_messages', { ticketId: currentActiveId, userId: user.id });
        chatService.markAsRead(currentActiveId).catch(console.error);
      } else {
        // Increment unread count badge
        setUnreadCounts((prev) => ({
          ...prev,
          [message.ticketId]: (prev[message.ticketId] || 0) + 1,
        }));

        // Trigger toast notification
        const toastId = Math.random().toString(36).substring(7);
        const newNotification = {
          id: toastId,
          senderName: message.senderName,
          ticketId: message.ticketId,
          content: message.content || 'Sent an attachment',
          senderId: message.senderId
        };

        // Don't show toast for messages sent by the user themselves
        if (message.senderId !== user.id) {
          setNotifications((prev) => [newNotification, ...prev]);

          // Clear toast after 5 seconds
          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== toastId));
          }, 5000);
        }
      }
    });

    // Handle read receipt updates (cyan checkmarks)
    s.on('messages_read_receipt', ({ ticketId, readByUserId }) => {
      if (readByUserId === user.id) return;
      
      const currentActiveId = activeTicketIdRef.current;
      if (ticketId === currentActiveId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.senderId === user.id && msg.status !== 'read') {
              return {
                ...msg,
                status: 'read',
                readBy: [...(msg.readBy || []), readByUserId]
              };
            }
            return msg;
          })
        );
      }
    });

    // Handle reaction updates in real time
    s.on('message_reaction_updated', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId) {
            return { ...msg, reactions };
          }
          return msg;
        })
      );
    });

    // Handle typing states
    s.on('user_typing', ({ ticketId, userId, userName, isTyping }) => {
      if (userId === user.id) return;
      
      setTypingUsers((prev) => {
        const roomTypers = { ...(prev[ticketId] || {}) };
        if (isTyping) {
          roomTypers[userId] = userName;
        } else {
          delete roomTypers[userId];
        }
        return {
          ...prev,
          [ticketId]: roomTypers,
        };
      });
    });

    s.on('disconnect', () => {
      console.log('Socket.IO connection disconnected.');
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user]);

  // Load message history for a ticket
  const openChatRoom = useCallback(async (ticketId) => {
    setActiveTicketId(ticketId);
    setMessages([]);
    
    // Clear unread badge
    setUnreadCounts((prev) => ({
      ...prev,
      [ticketId]: 0,
    }));

    try {
      const history = await chatService.getMessages(ticketId);
      setMessages(history);

      // Join socket room
      if (socketRef.current && user) {
        socketRef.current.emit('join_room', { 
          ticketId, 
          userId: user.id, 
          role: user.role 
        });
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  }, [user]);

  // Close active chat room
  const closeChatRoom = useCallback(() => {
    setActiveTicketId(null);
    setMessages([]);
  }, []);

  // Send message
  const sendMessage = useCallback(async (content, attachments = []) => {
    const currentActiveId = activeTicketIdRef.current;
    if (!currentActiveId || !user) return;

    // Generate optimistic ID
    const tempId = 'temp-' + Date.now();
    const optimisticMessage = {
      _id: tempId,
      ticketId: currentActiveId,
      senderId: user.id,
      senderModel: user.role === 'user' ? 'User' : 'Employee',
      senderName: user.fullName,
      senderAvatar: user.avatar || '',
      content: content ? content.trim() : '',
      attachments: attachments || [],
      readBy: [user.id],
      status: 'sending',
      createdAt: new Date().toISOString(),
    };

    // Optimistically add message to UI list immediately (0ms latency response)
    setMessages((prev) => [...prev, optimisticMessage]);

    const payload = {
      tempId,
      ticketId: currentActiveId,
      content,
      senderId: user.id,
      senderModel: user.role === 'user' ? 'User' : 'Employee',
      senderName: user.fullName,
      senderAvatar: user.avatar,
      attachments,
    };

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', payload);
    } else {
      // Fallback via HTTP REST API
      try {
        const savedMsg = await chatService.sendMessageFallback(currentActiveId, content, attachments);
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? savedMsg : m))
        );
      } catch (err) {
        console.error('HTTP Send message fallback failed:', err);
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, status: 'error' } : m))
        );
      }
    }
  }, [user]);

  // Toggle Reaction on a message
  const toggleReaction = useCallback(async (messageId, emoji) => {
    const currentActiveId = activeTicketIdRef.current;
    if (!currentActiveId || !user) return;

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('toggle_reaction', {
        messageId,
        emoji,
        userId: user.id,
        userName: user.fullName
      });
    } else {
      try {
        const updatedMsg = await chatService.toggleReaction(messageId, emoji);
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? updatedMsg : msg))
        );
      } catch (err) {
        console.error('HTTP toggle reaction failed:', err);
      }
    }
  }, [user]);

  // Emit typing indicator
  const sendTypingState = useCallback((isTyping) => {
    const currentActiveId = activeTicketIdRef.current;
    if (!currentActiveId || !user || !socketRef.current) return;
    
    socketRef.current.emit('typing', {
      ticketId: currentActiveId,
      userId: user.id,
      userName: user.fullName,
      isTyping,
    });
  }, [user]);

  // Sum of all unread messages
  const getTotalUnreadCount = useCallback(() => {
    return Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);
  }, [unreadCounts]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = (ticketId, id) => {
    removeNotification(id);
    openChatRoom(ticketId);
    // Navigate or trigger modal open depending on user state
    navigate(`/dashboard?ticketId=${ticketId}&chat=true`);
  };

  const value = {
    socket,
    messages,
    activeTicketId,
    unreadCounts,
    typingUsers,
    openChatRoom,
    closeChatRoom,
    sendMessage,
    toggleReaction,
    sendTypingState,
    getTotalUnreadCount,
    setUnreadCounts,
  };

  // Stack rendering for notifications
  const displayedNotifications = notifications.slice(0, 3);
  const collapsedCount = notifications.length - 3;

  return (
    <ChatContext.Provider value={value}>
      {children}

      {/* Floating Notifications UI Container */}
      {notifications.length > 0 && (
        <div className="fixed bottom-20 right-6 md:bottom-6 md:right-6 flex flex-col gap-2 z-[9999] max-w-sm w-full pointer-events-none">
          {collapsedCount > 0 ? (
            <div className="glass-panel border border-borderColor p-4 rounded-xl shadow-glassShadow flex items-center gap-3 bg-[#131926]/95 pointer-events-auto animate-bounce text-xs font-bold text-accent-cyan">
              <MessageCircle className="w-5 h-5" />
              <span>You have {notifications.length} unread chat messages waiting.</span>
              <button 
                onClick={() => setNotifications([])} 
                className="ml-auto text-text-secondary hover:text-text-primary touch-target"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            displayedNotifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif.ticketId, notif.id)}
                className="glass-panel border border-borderColor/80 p-4 rounded-xl shadow-glassShadow flex flex-col gap-1.5 bg-[#131926]/95 hover:border-accent-cyan transition-colors cursor-pointer pointer-events-auto text-left relative overflow-hidden group border-l-4 border-l-accent-cyan animate-slideIn"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-accent-cyan uppercase tracking-wider">
                    New Message
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notif.id);
                    }} 
                    className="text-text-secondary hover:text-text-primary p-0.5 rounded touch-target"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs font-black text-text-primary">
                  {notif.senderName}
                </div>
                <p className="text-xs text-text-secondary line-clamp-1 break-all">
                  {notif.content}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
