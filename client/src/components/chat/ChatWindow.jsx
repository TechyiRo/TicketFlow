import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Info, 
  Send, 
  Paperclip, 
  Smile, 
  Search, 
  X, 
  ArrowDown, 
  ChevronUp, 
  ChevronDown, 
  FileText, 
  Image, 
  Copy, 
  Trash, 
  Reply, 
  Camera, 
  MapPin, 
  FolderOpen 
} from 'lucide-react';
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
    closeChatRoom,
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Overlays & Sheets State
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedActionMessage, setSelectedActionMessage] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);

  // Attachments state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const scrollContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const ticket = tickets.find((t) => t._id === activeTicketId);

  // Keyboard offset Visual Viewport sync
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleVisualViewportResize = () => {
      const vv = window.visualViewport;
      const offset = window.innerHeight - vv.height;
      if (window.innerWidth < 768) {
        setKeyboardHeight(Math.max(0, offset));
      } else {
        setKeyboardHeight(0);
      }
    };

    window.visualViewport.addEventListener('resize', handleVisualViewportResize);
    handleVisualViewportResize();

    return () => {
      window.visualViewport.removeEventListener('resize', handleVisualViewportResize);
    };
  }, []);

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

  const scrollToBottom = (behavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: behavior,
      });
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 150;
      setShowJumpBtn(isScrolledUp);
    }
  };

  useEffect(() => {
    if (!showJumpBtn) {
      scrollToBottom('smooth');
    }
  }, [messages, showJumpBtn]);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

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
      setSelectedFile(response);
      toast.success('File attached successfully.');
    } catch (err) {
      console.error(err);
      toast.error('File upload failed.');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() && !selectedFile) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingState(false);

    const attachments = selectedFile ? [selectedFile] : [];
    
    // Pass reply context if active
    let replyPayload = null;
    if (replyingToMessage) {
      replyPayload = {
        messageId: replyingToMessage._id,
        senderName: replyingToMessage.senderName,
        content: replyingToMessage.content || 'Attached file',
      };
    }

    await sendMessage(text.trim(), attachments, replyPayload);
    
    setText('');
    setSelectedFile(null);
    setReplyingToMessage(null);
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

  const handleLongPress = (msg) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30); // Buzz slightly on message longpress sheet open
    }
    setSelectedActionMessage(msg);
  };

  const executeReaction = (emoji) => {
    if (selectedActionMessage) {
      chatService.toggleReaction(selectedActionMessage._id, emoji).catch(console.error);
      setSelectedActionMessage(null);
    }
  };

  const executeCopy = () => {
    if (selectedActionMessage && selectedActionMessage.content) {
      navigator.clipboard.writeText(selectedActionMessage.content);
      toast.success('Text copied to clipboard.');
      setSelectedActionMessage(null);
    }
  };

  const executeDelete = async () => {
    if (selectedActionMessage) {
      try {
        await chatService.deleteMessage(selectedActionMessage._id);
        toast.success('Message deleted.');
      } catch (err) {
        toast.error('Delete message failed.');
      }
      setSelectedActionMessage(null);
    }
  };

  const triggerReply = () => {
    if (selectedActionMessage) {
      setReplyingToMessage(selectedActionMessage);
      setSelectedActionMessage(null);
    }
  };

  const selectEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleAttachmentSelect = (type) => {
    setShowAttachmentSheet(false);
    if (type === 'location') {
      const locMock = {
        fileName: 'Location Share.txt',
        fileType: 'text/plain',
        fileSize: 120,
        fileUrl: 'https://maps.google.com/?q=current_location',
      };
      setSelectedFile(locMock);
      toast.success('Shared location pin preview.');
    } else {
      fileInputRef.current?.click();
    }
  };

  if (!ticket) return null;

  const roomTypers = typingUsers[activeTicketId] || {};
  const typingNames = Object.entries(roomTypers)
    .filter(([userId, name]) => userId !== user?.id && name)
    .map(([_, name]) => name);

  const nextSearch = () => {
    setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length);
  };

  const prevSearch = () => {
    setCurrentSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
  };

  const emojiCategories = {
    Smileys: ['😀', '😂', '😍', '😎', '🤩', '😭', '😡', '😱'],
    Hands: ['👍', '👏', '🙌', '🙏', '✌️', '💪', '👋', '🤝'],
    Symbols: ['🔥', '🎉', '❤️', '⏰', '🚩', '💡', '✅', '❌'],
  };

  return (
    <div 
      className="flex flex-col h-full overflow-hidden relative bg-[#05070F] select-none"
      style={{ 
        transform: `translateY(-${keyboardHeight}px)`, 
        transition: 'transform 0.1s ease-out',
        backgroundImage: `radial-gradient(rgba(255,255,255,0.015) 1px, transparent 0), radial-gradient(rgba(255,255,255,0.015) 1px, transparent 0)`,
        backgroundSize: '8px 8px',
        backgroundPosition: '0 0, 4px 4px'
      }}
    >
      {/* 1. Header Bar */}
      <div className="h-[60px] pt-safe-top border-b border-[#06b6d4]/30 shadow-[0_1px_6px_rgba(6,182,212,0.15)] px-4 flex items-center justify-between shrink-0 bg-[#070b16]/95 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <button 
            onClick={closeChatRoom}
            className="p-1.5 hover:bg-white/5 rounded-full text-text-secondary hover:text-text-primary touch-target shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div className="min-w-0">
            <span className="block text-[11px] font-mono text-text-secondary leading-none">{ticket.ticketId}</span>
            <span className="block text-[14px] font-semibold text-white leading-tight truncate max-w-[180px]">{ticket.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={callState !== 'idle'}
            onClick={() => startCall(ticket._id, ticket.ticketId, ticket.title)}
            className="p-2.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all touch-target disabled:opacity-50"
          >
            <Phone className="w-5 h-5 text-accent-cyan" />
          </button>

          <button
            onClick={() => setShowDetailPanel(!showDetailPanel)}
            className={`p-2.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all touch-target ${showDetailPanel ? 'bg-white/5 text-accent-cyan' : ''}`}
          >
            <Info className="w-5 h-5 text-accent-cyan" />
          </button>

          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all touch-target ${showSearch ? 'bg-white/5 text-accent-cyan' : ''}`}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Slide Down Info Details Panel Overlay */}
      {showDetailPanel && (
        <div className="absolute top-[60px] left-0 right-0 z-50 bg-[#0e1322]/95 border-b border-borderColor/35 p-4 flex flex-col gap-3 shadow-glassShadow animate-slideDown pointer-events-auto">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-xs font-bold text-accent-cyan uppercase tracking-wider">Ticket Info</span>
            <button onClick={() => setShowDetailPanel(false)} className="text-text-secondary hover:text-white touch-target">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="block text-text-secondary font-medium">Priority</span>
              <span className="font-bold text-text-primary uppercase">{ticket.priority}</span>
            </div>
            <div>
              <span className="block text-text-secondary font-medium">Status</span>
              <span className="font-bold text-accent-cyan uppercase">{ticket.status.replace('_', ' ')}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-text-secondary font-medium">Assignee</span>
              <span className="font-semibold text-text-primary">{ticket.assignedTo?.fullName || 'Unassigned'}</span>
            </div>
            <div className="col-span-2 pt-1">
              <span className="block text-text-secondary font-medium">Description</span>
              <p className="text-text-primary/90 mt-0.5 leading-relaxed font-normal">{ticket.description || 'No description provided.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search overlay bar */}
      {showSearch && (
        <div className="bg-[#121926]/95 border-b border-borderColor/30 px-4 py-2 flex items-center gap-2.5 shrink-0 z-10 animate-slideDown">
          <input
            type="text"
            placeholder="Search keyword in chat logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-9 bg-background-elevated/40 border border-borderColor/60 focus:border-accent-cyan focus:outline-none rounded-lg px-3 text-xs text-text-primary"
          />
          {searchResults.length > 0 && (
            <div className="flex items-center gap-1 select-none">
              <span className="text-[10px] text-text-secondary mr-1">
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

      {/* 3. Scrollable Message Feed Area */}
      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll}
        onClick={() => {
          setShowDetailPanel(false);
          setShowAttachmentSheet(false);
          setShowEmojiPicker(false);
        }}
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scroll-smooth select-none"
        style={{ webkitOverflowScrolling: 'touch' }}
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
                  onLongPress={handleLongPress}
                />
              </div>
            );
          })
        ) : (
          <div className="h-full flex items-center justify-center text-xs font-semibold text-text-secondary/70 select-none">
            No messages. Ask a question to begin live chat!
          </div>
        )}

        {/* Live typing indicator loops */}
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

      {/* Floating latest button */}
      {showJumpBtn && (
        <button 
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-20 right-4 bg-accent-cyan hover:bg-[#00F0FF]/90 text-background-primary px-3.5 py-1.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1 border border-accent-cyan shadow-cyanGlow z-40 touch-target"
        >
          <ArrowDown className="w-3.5 h-3.5" />
          New Messages
        </button>
      )}

      {/* 4. Chat Input Bar */}
      <div className="p-3 border-t border-borderColor shrink-0 bg-[#070b16]/95 z-30 pb-[calc(12px+env(safe-area-inset-bottom))]">
        {/* Reply Preview Strip */}
        {replyingToMessage && (
          <div className="mb-2 p-2 rounded bg-[#101524] border-l-4 border-accent-cyan flex items-center justify-between select-none">
            <div className="min-w-0">
              <span className="block text-[10px] font-bold text-accent-cyan">{replyingToMessage.senderName}</span>
              <p className="text-[11px] text-text-secondary truncate leading-normal m-0">{replyingToMessage.content}</p>
            </div>
            <button 
              onClick={() => setReplyingToMessage(null)}
              className="p-1 hover:bg-white/5 rounded-full text-text-secondary hover:text-white touch-target shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attachment preview banner */}
        {selectedFile && (
          <div className="mb-2 p-2 rounded-lg bg-[#141b2b] border border-borderColor flex items-center justify-between select-none">
            <div className="flex items-center gap-2 min-w-0">
              {selectedFile.fileType?.startsWith('image/') ? (
                <Image className="w-4 h-4 text-accent-cyan shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-accent-cyan shrink-0" />
              )}
              <span className="text-[11px] font-semibold text-text-primary truncate max-w-[180px]">
                {selectedFile.fileName}
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

        {/* Form controls row */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploadingFile}
            onClick={() => setShowAttachmentSheet(!showAttachmentSheet)}
            className={`p-2.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-white/5 transition-colors touch-target shrink-0 flex items-center justify-center ${showAttachmentSheet ? 'text-accent-cyan bg-white/5' : ''}`}
            aria-label="Add attachment"
          >
            <Paperclip className="w-5 h-5 rotate-45" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={uploadingFile ? "Uploading attachment..." : "Type response..."}
            disabled={uploadingFile}
            className="flex-1 bg-background-elevated/40 border border-borderColor focus:border-accent-cyan focus:outline-none rounded-lg px-3 py-2 text-[15px] text-text-primary placeholder:text-text-secondary/40 focus:ring-1 focus:ring-accent-cyan/15 resize-none overflow-y-auto leading-relaxed h-10 min-h-[40px]"
            style={{ maxHeight: '120px' }}
          />

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-white/5 transition-colors touch-target shrink-0 flex items-center justify-center ${showEmojiPicker ? 'text-accent-cyan bg-white/5' : ''}`}
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            type="submit"
            disabled={(!text.trim() && !selectedFile) || uploadingFile}
            className="h-10 w-10 bg-accent-cyan hover:bg-[#00F0FF]/90 disabled:opacity-50 disabled:pointer-events-none text-background-primary rounded-full flex items-center justify-center shadow-cyanGlow transition-transform active:scale-95 shrink-0 focus:outline-none touch-target"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 text-background-primary" />
          </button>
        </form>

        {/* Category-based 280px Emoji Picker Drawer */}
        {showEmojiPicker && (
          <div className="mt-3 bg-[#0d121f] border border-borderColor/40 rounded-xl p-3 flex flex-col gap-2 h-[280px] z-50 relative animate-slideUp">
            <div className="flex gap-2 border-b border-borderColor/20 pb-2">
              {Object.keys(emojiCategories).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => selectEmoji(emojiCategories[cat][0])}
                  className="text-xs px-2.5 py-1 rounded bg-[#161d30] text-text-primary font-bold hover:bg-[#06b6d4]/10"
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-2 overflow-y-auto p-1">
              {Object.values(emojiCategories).flat().map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectEmoji(emoji)}
                  className="text-2xl p-2 hover:scale-125 transition-transform touch-target"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Attachment Options Bottom Sheet */}
      {showAttachmentSheet && (
        <div className="fixed inset-0 bg-black/60 z-[9998] flex items-end justify-center pointer-events-auto" onClick={() => setShowAttachmentSheet(false)}>
          <div className="w-full bg-[#0a0f1d] border-t border-[#ffffff]/10 rounded-t-3xl p-5 pb-8 flex flex-col gap-4 shadow-glassShadow animate-slideUp pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-[#ffffff]/20 rounded-full mx-auto" />
            <h4 className="text-sm font-bold text-center text-text-primary pt-1">Select Attachment</h4>
            <div className="grid grid-cols-4 gap-4 pt-2">
              <button onClick={() => handleAttachmentSelect('camera')} className="flex flex-col items-center gap-2 p-3 bg-[#111728] rounded-2xl hover:border-accent-cyan border border-transparent touch-target">
                <Camera className="w-7 h-7 text-accent-cyan" />
                <span className="text-[11px] text-text-primary">Camera</span>
              </button>
              <button onClick={() => handleAttachmentSelect('gallery')} className="flex flex-col items-center gap-2 p-3 bg-[#111728] rounded-2xl hover:border-accent-cyan border border-transparent touch-target">
                <Image className="w-7 h-7 text-accent-cyan" />
                <span className="text-[11px] text-text-primary">Gallery</span>
              </button>
              <button onClick={() => handleAttachmentSelect('file')} className="flex flex-col items-center gap-2 p-3 bg-[#111728] rounded-2xl hover:border-accent-cyan border border-transparent touch-target">
                <FolderOpen className="w-7 h-7 text-accent-cyan" />
                <span className="text-[11px] text-text-primary">File</span>
              </button>
              <button onClick={() => handleAttachmentSelect('location')} className="flex flex-col items-center gap-2 p-3 bg-[#111728] rounded-2xl hover:border-accent-cyan border border-transparent touch-target">
                <MapPin className="w-7 h-7 text-accent-cyan" />
                <span className="text-[11px] text-text-primary">Location</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Contextual Action Sheet (Long press dialog) */}
      {selectedActionMessage && (
        <div className="fixed inset-0 bg-black/60 z-[9998] flex items-end justify-center pointer-events-auto" onClick={() => setSelectedActionMessage(null)}>
          <div className="w-full bg-[#0a0f1d] border-t border-[#ffffff]/10 rounded-t-3xl p-5 pb-8 flex flex-col gap-4 shadow-glassShadow animate-slideUp pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-[#ffffff]/20 rounded-full mx-auto" />
            
            {/* Horizontal reaction buttons bar */}
            <div className="flex justify-around bg-[#111728] p-2.5 rounded-2xl border border-[#ffffff]/5">
              {['👍', '✅', '🔥', '⏰', '🚩'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => executeReaction(emoji)}
                  className="text-2xl hover:scale-125 transition-transform touch-target"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              <button onClick={triggerReply} className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-white/5 rounded-xl text-xs font-semibold text-text-primary transition-colors touch-target">
                <Reply className="w-4 h-4 text-accent-cyan" />
                Reply message
              </button>
              {selectedActionMessage.content && (
                <button onClick={executeCopy} className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-white/5 rounded-xl text-xs font-semibold text-text-primary transition-colors touch-target">
                  <Copy className="w-4 h-4 text-accent-cyan" />
                  Copy message text
                </button>
              )}
              {selectedActionMessage.senderId === user?.id && (
                <button onClick={executeDelete} className="w-full text-left py-3 px-4 flex items-center gap-3 hover:bg-red-500/10 rounded-xl text-xs font-semibold text-red-500 transition-colors touch-target">
                  <Trash className="w-4 h-4 text-red-500" />
                  Delete message
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWindow;
