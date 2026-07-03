import React, { useState, useRef } from 'react';
import { Check, CheckCheck, FileText, Download, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export function MessageBubble({ message, isOwnMessage, showSenderName, searchQuery, onLongPress }) {
  const { user } = useAuth();
  const { toggleReaction } = useChat();
  const [showLightbox, setShowLightbox] = useState(false);
  const touchTimer = useRef(null);

  const isSystem = message.messageType === 'system';

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isPreviousDay = 
      date.getDate() !== now.getDate() || 
      date.getMonth() !== now.getMonth() || 
      date.getFullYear() !== now.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isPreviousDay) {
      const dateString = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `${timeStr} (${dateString})`;
    }
    return timeStr;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleTouchStart = (e) => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress(message);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
  };

  const handleEmojiClick = (emoji) => {
    toggleReaction(message._id, emoji);
  };

  if (isSystem) {
    return (
      <div className="w-full text-center py-2 select-none">
        <span className="text-[10px] font-bold italic text-text-secondary/60">
          {message.content}
        </span>
      </div>
    );
  }

  const renderHighlightedContent = (content) => {
    if (!searchQuery || !searchQuery.trim()) return content;
    const parts = content.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase()
            ? <mark key={i} className="bg-amber-500/50 text-white rounded px-0.5">{part}</mark>
            : part
        )}
      </span>
    );
  };

  const getSenderStyle = () => {
    if (isOwnMessage) return '';
    if (message.senderModel === 'Employee') {
      if (message.senderName?.toLowerCase().includes('admin')) {
        return 'border border-violet-500/35 shadow-[0_0_12px_rgba(139,92,246,0.12)] bg-[#101625]/60';
      }
      return 'border border-sky-500/35 shadow-[0_0_12px_rgba(56,189,248,0.12)] bg-[#101625]/60';
    }
    return 'border border-slate-400/30 shadow-[0_0_8px_rgba(255,255,255,0.05)] bg-[#101625]/60';
  };

  const reactionCounts = {};
  const userReacted = {};
  if (message.reactions) {
    message.reactions.forEach((r) => {
      reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
      if (r.userId.toString() === user?.id) {
        userReacted[r.emoji] = true;
      }
    });
  }

  return (
    <div className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end mb-1 px-2 select-none`}>
      {/* Sender Avatar: left side, only for others on first message of group */}
      {!isOwnMessage && (
        <div className="w-8 h-8 shrink-0 mr-2 flex items-center justify-center">
          {showSenderName ? (
            <div className="w-8 h-8 rounded-full bg-accent-cyan/15 border border-accent-cyan/35 text-accent-cyan flex items-center justify-center text-[10px] font-bold select-none">
              {getInitials(message.senderName)}
            </div>
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      {/* Bubble Container */}
      <div 
        className={`flex flex-col max-w-[75%] relative group/msg ${isOwnMessage ? 'items-end' : 'items-start'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        {showSenderName && !isOwnMessage && (
          <span className="text-[10px] font-bold text-text-secondary mb-1 px-1 select-none">
            {message.senderName}
          </span>
        )}

        <div 
          className={`px-4 py-2.5 rounded-2xl text-[15px] break-words leading-relaxed shadow-sm flex flex-col gap-2 ${
            isOwnMessage
              ? 'bg-gradient-to-br from-[#0891b2] to-[#06b6d4] text-white font-medium rounded-br-sm shadow-[0_4px_12px_rgba(6,182,212,0.15)]'
              : `text-text-primary rounded-bl-sm backdrop-blur-md ${getSenderStyle()}`
          }`}
        >
          {/* Reply Context Quote Preview inside bubble */}
          {message.replyTo && (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                const el = document.getElementById(`msg-${message.replyTo.messageId}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="mb-1.5 p-2 rounded bg-black/25 border-l-2 border-accent-cyan text-left cursor-pointer select-none"
            >
              <span className="block text-[10px] font-bold text-accent-cyan">{message.replyTo.senderName}</span>
              <p className="text-[10px] text-text-secondary truncate m-0">{message.replyTo.content}</p>
            </div>
          )}

          {message.content && (
            <p className="m-0 whitespace-pre-wrap select-text">
              {renderHighlightedContent(message.content)}
            </p>
          )}

          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-col gap-2 pt-1">
              {message.attachments.map((attach, idx) => {
                const isImage = attach.fileType.startsWith('image/');
                
                if (isImage) {
                  return (
                    <div key={idx} className="relative overflow-hidden rounded-lg border border-borderColor/40 max-w-[200px] aspect-video">
                      <img 
                        src={attach.fileUrl} 
                        alt={attach.fileName}
                        onClick={() => setShowLightbox(true)}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      />

                      {showLightbox && (
                        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
                          <button 
                            onClick={() => setShowLightbox(false)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <img 
                            src={attach.fileUrl} 
                            alt={attach.fileName} 
                            className="max-w-full max-h-full object-contain rounded"
                          />
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div 
                    key={idx} 
                    className={`p-2.5 rounded-xl border flex items-center gap-3 w-full max-w-[240px] ${
                      isOwnMessage ? 'bg-black/10 border-black/15' : 'bg-background-elevated/40 border-borderColor/60'
                    }`}
                  >
                    <FileText className="w-8 h-8 text-accent-cyan shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className={`text-[11px] font-bold truncate block ${isOwnMessage ? 'text-white' : 'text-text-primary'}`}>
                        {attach.fileName}
                      </span>
                      <span className="text-[9px] text-text-secondary block">
                        {(attach.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </div>
                    <a 
                      href={attach.fileUrl} 
                      download={attach.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors touch-target shrink-0 ${
                        isOwnMessage ? 'text-white' : 'text-accent-cyan'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TimeStamp, Status indicator & reactions */}
        <div className="flex flex-col gap-1 mt-1 px-1 items-end w-full select-none">
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-0.5 justify-end">
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 transition-all ${
                    userReacted[emoji]
                      ? 'bg-accent-cyan/15 border-accent-cyan text-accent-cyan shadow-cyanGlow'
                      : 'bg-background-elevated/60 border-borderColor text-text-secondary hover:border-slate-400'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-text-secondary/60">
              {formatTime(message.createdAt)}
            </span>
            {isOwnMessage && (
              <span>
                {message.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-[#00FFFF]" />
                ) : message.status === 'delivered' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-text-secondary/60" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-text-secondary/50" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
