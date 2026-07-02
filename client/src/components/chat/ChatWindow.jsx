import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Search, X, ArrowDown, ChevronUp, ChevronDown, FileText, Image, Phone } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { useCall } from '../../context/CallContext';
import MessageBubble from './MessageBubble';
import chatService from '../../services/chatService';
import toast from 'react-hot-toast';

export function ChatWindow() {
  const { user } = useAuth();
  const { tickets } = useTickets();
  const { 
    messages, 
    activeTicketId, 
    sendMessage, 
    sendTypingState, 
    typingUsers 
  } = useChat();
  const { startCall, callState } = useCall();

  const [text, setText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  
  const [showJumpBtn, setShowJumpBtn] = useState(false);
  
  // Attachments state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Find ticket metadata
  const ticket = tickets.find((t) => t._id === activeTicketId);

  // Search filter matching
  useEffect(() => {
    if (!searchQuery.trim() || messages.length === 0) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const matches = messages.filter((msg) => msg.content && msg.content.toLowerCase().includes(query));
    setSearchResults(matches);
    setCurrentSearchIndex(0);
  }, [searchQuery, messages]);

  // Jump scroll to matched search index
  useEffect(() => {
    if (searchResults.length > 0 && searchResults[currentSearchIndex]) {
      const matchMsg = searchResults[currentSearchIndex];
      const element = document.getElementById(`msg-${matchMsg._id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentSearchIndex, searchResults]);

  // Smooth scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: behavior,
      });
    }
  };

  // Monitor scroll for jump button visibility
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 150;
      setShowJumpBtn(isScrolledUp);
    }
  };

  useEffect(() => {
    // If not manually scrolled up, auto-scroll to bottom on new messages
    if (!showJumpBtn) {
      scrollToBottom('smooth');
    }
  }, [messages, showJumpBtn]);

  // Adjust textarea row height
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // Caps at 4 lines (approx 120px)
    }
  };

  // Typing event emissions
  const handleTextChange = (e) => {
    setText(e.target.value);
    adjustHeight();

    sendTypingState(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingState(false);
    }, 1500);
  };

  // Process selected attachment
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File exceeds the 5MB size limit.');
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('attachment', file);

    try {
      const response = await chatService.uploadFile(formData);
      setSelectedFile(response); // { fileName, fileType, fileSize, fileUrl }
      toast.success('File attached successfully.');
    } catch (err) {
      console.error(err);
      toast.error('File upload failed.');
    } finally {
      setUploadingFile(false);
      // Clear file picker so it can trigger on same file next time
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Send message submission
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingState(false);

    const attachments = selectedFile ? [selectedFile] : [];
    await sendMessage(text.trim(), attachments);
    
    // Reset inputs
    setText('');
    setSelectedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    scrollToBottom('smooth');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!ticket) return null;

  // Retrieve list of typing user names
  const roomTypers = typingUsers[activeTicketId] || {};
  const typingNames = Object.entries(roomTypers)
    .filter(([userId, name]) => userId !== user?.id && name)
    .map(([_, name]) => name);

  // Search navigation triggers
  const nextSearch = () => {
    setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
  };

  const prevSearch = () => {
    setCurrentSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {/* 1. Chat Header */}
      <div className="h-16 border-b border-borderColor px-4 flex items-center justify-between shrink-0 bg-[#162235]/40 select-none">
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-accent-cyan tracking-wide flex items-center gap-1.5 leading-none">
            {ticket.ticketId}
          </h4>
          <div className="text-[10px] text-text-secondary mt-1 flex flex-wrap gap-x-2 gap-y-0.5 truncate">
            <span>Raised by: {ticket.createdBy?.fullName || ticket.createdByName || 'User'}</span>
            <span className="text-borderColor/80">|</span>
            <span>Assignee: {ticket.assignedTo?.fullName || ticket.assignedToName || 'Unassigned'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={callState !== 'idle'}
            onClick={() => startCall(ticket._id, ticket.ticketId, ticket.title)}
            className="p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all touch-target disabled:opacity-50 disabled:pointer-events-none"
            title="Start voice call"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all touch-target ${showSearch ? 'bg-white/5 text-accent-cyan' : ''}`}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Slide Open Search Bar */}
      {showSearch && (
        <div className="bg-[#121926]/90 border-b border-borderColor px-4 py-2 flex items-center gap-2.5 shrink-0 animate-slideDown">
          <input
            type="text"
            placeholder="Search keyword in chat logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-9 bg-background-elevated/40 border border-borderColor/60 focus:border-accent-cyan focus:outline-none rounded-lg px-3 text-xs text-text-primary"
          />
          {searchResults.length > 0 && (
            <div className="flex items-center gap-1 select-none">
              <span className="text-[10px] text-text-secondary whitespace-nowrap mr-1">
                {currentSearchIndex + 1} of {searchResults.length}
              </span>
              <button onClick={prevSearch} className="p-1 hover:bg-white/5 rounded text-text-secondary hover:text-text-primary touch-target">
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button onClick={nextSearch} className="p-1 hover:bg-white/5 rounded text-text-secondary hover:text-text-primary touch-target">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button 
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="p-1.5 hover:bg-white/5 rounded text-text-secondary hover:text-text-primary touch-target"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Messages History View */}
      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scroll-smooth"
      >
        {messages.length > 0 ? (
          messages.map((msg, index) => {
            const showSenderName = index === 0 || messages[index - 1].senderId !== msg.senderId;
            return (
              <div key={msg._id || index} id={`msg-${msg._id}`}>
                <MessageBubble
                  message={msg}
                  isOwnMessage={msg.senderId === user?.id}
                  showSenderName={showSenderName}
                  searchQuery={searchQuery}
                />
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-xs font-semibold text-text-secondary/70 select-none">
            No messages. Ask a question to begin live chat!
          </div>
        )}

        {/* Live typing indicator lists */}
        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 select-none animate-pulse pl-1 pt-1.5">
            <span className="text-[10px] font-bold text-text-secondary flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full animate-ping" />
              {typingNames.join(', ')} is typing
            </span>
            <div className="flex gap-0.5 items-center">
              <div className="w-1 h-1 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 rounded-full bg-text-secondary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* 4. "Jump to Latest" Floating Button */}
      {showJumpBtn && (
        <button 
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-24 right-4 bg-accent-cyan hover:bg-[#00F0FF]/90 text-background-primary px-3.5 py-1.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1 border border-accent-cyan shadow-cyanGlow transition-transform active:scale-95 z-40 pointer-events-auto touch-target select-none"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          Jump to Latest
        </button>
      )}

      {/* 5. Message Input Footer Panel */}
      <div className="p-3 border-t border-borderColor shrink-0 bg-[#162235]/20 select-none">
        
        {/* Attachment preview banner */}
        {selectedFile && (
          <div className="mb-2 p-2 rounded-lg bg-[#141b2b] border border-borderColor flex items-center justify-between animate-fadeIn select-none">
            <div className="flex items-center gap-2 min-w-0">
              {selectedFile.fileType.startsWith('image/') ? (
                <Image className="w-4 h-4 text-accent-cyan shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-accent-cyan shrink-0" />
              )}
              <span className="text-[11px] font-semibold text-text-primary truncate max-w-[180px]">
                {selectedFile.fileName}
              </span>
              <span className="text-[9px] text-text-secondary shrink-0">
                ({(selectedFile.fileSize / 1024).toFixed(0)} KB)
              </span>
            </div>
            <button 
              onClick={() => setSelectedFile(null)}
              className="p-1 hover:bg-white/5 rounded-full text-text-secondary hover:text-text-primary touch-target"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploadingFile}
            onClick={() => fileInputRef.current?.click()}
            className={`p-2.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-white/5 transition-colors touch-target shrink-0 flex items-center justify-center ${uploadingFile ? 'animate-pulse text-accent-cyan bg-white/5' : ''}`}
            aria-label="Add attachment"
          >
            <Paperclip className="w-4 h-4 rotate-45" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={uploadingFile ? "Uploading attachment..." : "Type live chat response..."}
            disabled={uploadingFile}
            className="flex-1 bg-background-elevated/40 border border-borderColor focus:border-accent-cyan focus:outline-none rounded-lg px-3 py-3 text-xs text-text-primary placeholder:text-text-secondary/40 focus:ring-1 focus:ring-accent-cyan/15 resize-none overflow-y-auto leading-relaxed h-11"
            style={{ maxHeight: '120px' }}
          />

          <button
            type="submit"
            disabled={(!text.trim() && !selectedFile) || uploadingFile}
            className="h-10 w-10 bg-accent-cyan hover:bg-[#00F0FF]/90 disabled:opacity-50 disabled:pointer-events-none text-background-primary rounded-lg flex items-center justify-center shadow-cyanGlow transition-transform active:scale-95 shrink-0 focus:outline-none touch-target"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatWindow;
