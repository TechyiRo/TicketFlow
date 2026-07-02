import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { useChat } from '../../context/ChatContext';
import ChatWindow from '../../components/chat/ChatWindow';
import Avatar from '../../components/shared/Avatar';
import { MessageSquare, ShieldAlert, MonitorPlay, Calendar, User } from 'lucide-react';

export function AdminChatMonitor() {
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeTicketId, openChatRoom, closeChatRoom, unreadCounts } = useChat();

  const loadChats = async () => {
    try {
      const data = await adminService.getActiveChats();
      setChatRooms(data);
    } catch (err) {
      console.error('Failed to load active chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();

    // Poll to keep last message preview updated (or sync with socket)
    const interval = setInterval(loadChats, 10000);
    return () => {
      clearInterval(interval);
      closeChatRoom();
    };
  }, [closeChatRoom]);

  const handleRoomClick = (roomId) => {
    openChatRoom(roomId);
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full min-h-0 text-left">
      <div className="mb-6 shrink-0">
        <h1 className="text-xl font-black text-text-primary flex items-center gap-2">
          <MonitorPlay className="w-6 h-6 text-accent-cyan" />
          Admin Chat Monitor
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          Supervise ongoing ticket conversations across the entire platform in real time.
        </p>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-accent-cyan" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6">
          
          {/* Active Chats List Pane */}
          <div className="lg:col-span-7 flex flex-col gap-3 overflow-y-auto pr-1 h-full min-h-0">
            {chatRooms.length > 0 ? (
              chatRooms.map((room) => {
                const isActive = activeTicketId === room.ticketId;
                const unread = unreadCounts[room.ticketId] || 0;
                
                return (
                  <div
                    key={room.ticketId}
                    onClick={() => handleRoomClick(room.ticketId)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden group select-none ${
                      isActive
                        ? 'bg-accent-cyan/5 border-accent-cyan shadow-[0_0_12px_rgba(0,240,255,0.1)]'
                        : 'bg-background-elevated/40 border-borderColor/60 hover:border-borderColor hover:bg-background-elevated/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-text-primary">
                          {room.ticketDisplayId}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          room.status === 'open' 
                            ? 'bg-accent-cyan/15 text-accent-cyan'
                            : room.status === 'resolved'
                              ? 'bg-accent-success/15 text-accent-success'
                              : 'bg-background-primary text-text-secondary border border-borderColor'
                        }`}>
                          {room.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      {unread > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-cyan text-background-primary shadow-cyanGlow animate-pulse">
                          {unread} new
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-text-primary truncate">
                      {room.title}
                    </h3>

                    {/* Meta information */}
                    <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {room.creatorName}
                      </span>
                      <span>&rarr;</span>
                      <span>{room.assigneeName}</span>
                    </div>

                    {/* Last Message Preview */}
                    <div className="mt-2 pt-2 border-t border-borderColor/20 flex flex-col gap-0.5">
                      {room.lastMessage ? (
                        <>
                          <div className="flex items-center justify-between text-[10px] text-text-secondary">
                            <span className="font-bold text-text-primary">
                              {room.lastMessage.senderName}
                            </span>
                            <span>
                              {getRelativeTime(room.lastMessage.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary italic truncate">
                            "{room.lastMessage.content}"
                          </p>
                        </>
                      ) : (
                        <span className="text-[10px] text-text-secondary/50 italic">
                          No messages sent in this room.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-borderColor/40 rounded-xl text-center">
                <ShieldAlert className="w-10 h-10 text-text-secondary/50 mb-2" />
                <h4 className="text-sm font-bold text-text-primary mb-1">No Active Rooms</h4>
                <p className="text-xs text-text-secondary">All system chat channels are currently idle.</p>
              </div>
            )}
          </div>

          {/* Right Monitor Panel (Interactive Chat Intervention) */}
          <div className="lg:col-span-5 flex flex-col h-full min-h-0">
            {activeTicketId ? (
              <div className="flex-1 h-full min-h-0 bg-background-elevated/10 border border-borderColor/45 rounded-2xl overflow-hidden shadow-glassShadow">
                <ChatWindow />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-borderColor/30 rounded-2xl bg-background-elevated/5 text-center select-none">
                <MessageSquare className="w-12 h-12 text-text-secondary/30 mb-3" />
                <h4 className="text-sm font-bold text-text-primary mb-1">Select Chat Room</h4>
                <p className="text-xs text-text-secondary max-w-[220px]">
                  Click on any active ticket chat from the monitor list to open the thread.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default AdminChatMonitor;
