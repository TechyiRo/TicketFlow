import React, { useState } from 'react';
import { Check, CheckCheck, FileText, Download, X, Smile } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export function MessageBubble({ message, isOwnMessage, showSenderName, searchQuery }) {
  const { user } = useAuth();
  const { toggleReaction } = useChat();
  const [showLightbox, setShowLightbox] = useState(false);
  const [showReactionToolbar, setShowReactionToolbar] = useState(false);

  const isSystem = message.messageType === 'system';

  // Format time stamp
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

  if (isSystem) {
    return (
      <div className="w-full text-center py-2 select-none">
        <span className="text-[10px] font-bold italic text-text-secondary/60">
          {message.content}
        </span>
      </div>
    );
  }

  // Highlight search keywords
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

  // Border and glow colors based on sender role
  const getSenderStyle = () => {
    if (isOwnMessage) return '';
    const isSenderAdmin = message.senderModel === 'Employee' && message.senderId === user?.id; // fallback, but let's check role
    
    // Check role based on badge color standard
    if (message.senderModel === 'Employee') {
      // Could be admin or employee, check by name/avatar or fallback
      if (message.senderName.toLowerCase().includes('admin')) {
        return 'border border-violet-500/35 shadow-[0_0_12px_rgba(139,92,246,0.12)] bg-[#171a2b]/95';
      }
      return 'border border-sky-500/35 shadow-[0_0_12px_rgba(56,189,248,0.12)] bg-[#171a2b]/95';
    }
    return 'border border-slate-400/30 shadow-[0_0_8px_rgba(255,255,255,0.05)] bg-[#171a2b]/95';
  };

  const handleEmojiClick = (emoji) => {
    toggleReaction(message._id, emoji);
    setShowReactionToolbar(false);
  };

  // Group reactions by emoji counts
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
    <div 
      className={`flex flex-col max-w-[75%] relative group/msg ${isOwnMessage ? 'ml-auto items-end' : 'mr-auto items-start'}`}
      onMouseEnter={() => setShowReactionToolbar(true)}
      onMouseLeave={() => setShowReactionToolbar(false)}
    >
      {/* Sender Name */}
      {showSenderName && !isOwnMessage && (
        <span className="text-[10px] font-bold text-text-secondary mb-1 px-1 select-none">
          {message.senderName}
        </span>
      )}

      {/* Hover Emojis Toolbar */}
      {showReactionToolbar && (
        <div 
          className={`absolute -top-7 bg-[#141d2d] border border-borderColor rounded-full px-2 py-1 shadow-glassShadow flex gap-1.5 z-40 animate-fadeIn pointer-events-auto select-none ${
            isOwnMessage ? 'right-0' : 'left-0'
          }`}
        >
          {['👍', '✅', '🔥', '⏰', '🚩'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="text-xs hover:scale-125 transition-transform p-0.5 touch-target"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bubble Container */}
      <div 
        className={`px-4 py-2.5 rounded-2xl text-xs break-words leading-relaxed shadow-sm flex flex-col gap-2 ${
          isOwnMessage
            ? 'bg-accent-cyan text-background-primary font-medium rounded-tr-none shadow-[0_4px_12px_rgba(0,240,255,0.15)]'
            : `text-text-primary rounded-tl-none ${getSenderStyle()}`
        }`}
      >
        {/* Render text content */}
        {message.content && (
          <p className="margin-0 whitespace-pre-wrap select-text">
            {renderHighlightedContent(message.content)}
          </p>
        )}

        {/* Render file attachments */}
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

                    {/* Lightbox Portal */}
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

              // Document layout card
              return (
                <div 
                  key={idx} 
                  className={`p-2.5 rounded-xl border flex items-center gap-3 w-full max-w-[240px] ${
                    isOwnMessage
                      ? 'bg-black/10 border-black/15'
                      : 'bg-background-elevated/40 border-borderColor/60'
                  }`}
                >
                  <FileText className="w-8 h-8 text-accent-cyan shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className={`text-[11px] font-bold truncate block ${isOwnMessage ? 'text-background-primary' : 'text-text-primary'}`}>
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
                      isOwnMessage ? 'text-background-primary' : 'text-accent-cyan'
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
        
        {/* Render Reactions Pills list */}
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
          <span className="text-[9px] text-text-secondary/60">
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
  );
}

export default MessageBubble;
