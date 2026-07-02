import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ticketSchema } from '../../utils/validators';
import { TICKET_PRIORITY, TICKET_CATEGORY } from '../../constants';
import {
  X,
  Paperclip,
  AlertTriangle,
  Zap,
  Bug,
  CreditCard,
  Sparkles,
  MessageSquare,
  Wrench,
  ChevronDown,
} from 'lucide-react';
import ticketService from '../../services/ticketService';
import toast from 'react-hot-toast';

/* ─────────────────────────────── data ──────────────────────────────── */

const CATEGORIES = [
  { value: TICKET_CATEGORY.TECHNICAL, label: 'Technical Support', icon: Wrench, dept: 'IT' },
  { value: TICKET_CATEGORY.BILLING,   label: 'Billing Inquiry',   icon: CreditCard, dept: 'Finance' },
  { value: TICKET_CATEGORY.BUG,       label: 'Bug Report',        icon: Bug, dept: 'Engineering' },
  { value: TICKET_CATEGORY.FEATURE,   label: 'Feature Request',   icon: Sparkles, dept: 'Product' },
  { value: TICKET_CATEGORY.GENERAL,   label: 'General Request',   icon: MessageSquare, dept: 'Support' },
];

const PRIORITIES = [
  {
    value: TICKET_PRIORITY.LOW,
    label: 'Low Severity',
    dot: '🟢',
    activeClass: 'active-low',
    ringColor: 'rgba(16,185,129,0.45)',
  },
  {
    value: TICKET_PRIORITY.MEDIUM,
    label: 'Medium Threat',
    dot: '🟡',
    activeClass: 'active-medium',
    ringColor: 'rgba(99,102,241,0.55)',
  },
  {
    value: TICKET_PRIORITY.HIGH,
    label: 'High Priority',
    dot: '🔴',
    activeClass: 'active-high',
    ringColor: 'rgba(245,158,11,0.45)',
  },
  {
    value: TICKET_PRIORITY.CRITICAL,
    label: 'Critical Escalation',
    dot: '🔥',
    activeClass: 'active-critical',
    ringColor: 'rgba(239,68,68,0.45)',
  },
];

/* ─────────────────────────── component ─────────────────────────────── */

export function CreateTicketModal({ isOpen, onClose, onTicketCreated }) {
  const [loading, setLoading]       = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive]  = useState(false);
  const [visible, setVisible]        = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const fileInputRef = useRef(null);

  /* ── portal + open animation ── */
  useEffect(() => {
    if (isOpen) {
      const target = document.body;
      setPortalTarget(target);
      document.body.style.overflow = 'hidden';
      // tiny delay so the DOM renders before we trigger the animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* ── react-hook-form ── */
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title:       '',
      description: '',
      priority:    TICKET_PRIORITY.LOW,
      category:    TICKET_CATEGORY.TECHNICAL,
    },
  });

  const selectedPriority = watch('priority');
  const selectedCategory = watch('category');

  /* ── drag-drop ── */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) addFiles(e.dataTransfer.files);
  };

  const addFiles = (fileList) => {
    const valid = Array.from(fileList).filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit.`);
        return false;
      }
      return true;
    });
    setAttachments((prev) => [...prev, ...valid].slice(0, 5));
  };

  const removeFile = (i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i));

  /* ── submit ── */
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const formData = new FormData();
        formData.append('title',       data.title);
        formData.append('description', data.description);
        formData.append('priority',    data.priority);
        formData.append('category',    data.category);
        attachments.forEach((f) => formData.append('attachments', f));
        const newTicket = await ticketService.createTicket(formData);
        toast.success('Ticket incepted successfully!');
        if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
        onTicketCreated(newTicket);
      } else {
        const base64Files = [];
        for (const file of attachments) {
          const b64 = await new Promise((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result);
            reader.readAsDataURL(file);
          });
          base64Files.push(b64);
        }
        const offlinePayload = {
          title: data.title, description: data.description,
          priority: data.priority, category: data.category,
          attachments: base64Files,
        };
        await ticketService.createTicket(offlinePayload);
        if (navigator.vibrate) navigator.vibrate([20, 50, 20]);
        onTicketCreated({
          ...offlinePayload,
          _id: `temp-${Date.now()}`, ticketId: 'TKT-PENDING',
          status: 'open', createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(), _offline: true,
        });
      }
      reset();
      setAttachments([]);
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const activePriority = PRIORITIES.find(p => p.value === selectedPriority);
  const activeCategory = CATEGORIES.find(c => c.value === selectedCategory);

  if (!isOpen || !portalTarget) return null;

  /* ── render ── */
  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: 'rgba(2, 4, 12, 0.88)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.28s ease',
      }}
    >
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* ── Modal Card ── */}
      <div
        className="relative w-full max-w-2xl flex flex-col"
        style={{
          background: 'linear-gradient(160deg, rgba(13,16,36,0.97) 0%, rgba(8,11,26,0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(32px)',
          opacity: visible ? 1 : 0,
          filter: visible ? 'blur(0)' : 'blur(6px)',
          transition: 'transform 0.52s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease, filter 0.4s ease',
          maxHeight: '90dvh',
          overflow: 'hidden',
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[1.5px] rounded-t-[20px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.7) 30%, rgba(6,182,212,0.8) 60%, transparent 100%)',
          }}
        />

        {/* Corner glow orbs */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-7 pt-6 pb-5 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Zap className="w-3.5 h-3.5" style={{ color: 'rgba(6,182,212,0.9)' }} />
              <span className="ticket-section-label" style={{ color: 'rgba(6,182,212,0.7)', fontSize: '0.6rem' }}>
                TICKETFLOW DIAGNOSTIC SYSTEM
              </span>
            </div>
            <h2 className="text-lg font-black text-white tracking-tight leading-tight">
              Incept New Diagnostic Ticket
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(148,163,184,0.7)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(148,163,184,0.7)';
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-0 overflow-y-auto scrollbar-thin flex-1"
          style={{ padding: '0 28px 0 28px' }}
        >
          <div className="flex flex-col gap-5 py-5">

            {/* ── Title ── */}
            <div className="flex flex-col gap-1.5">
              <label className="ticket-section-label">
                TICKET TITLE / CORE INCIDENT SUMMARY<span>*</span>
              </label>
              <input
                {...register('title')}
                disabled={loading}
                placeholder="Provide a specific descriptive title (e.g., VPN Floor 3 authentication failing)"
                className="cyber-input field-focus-glow w-full rounded-lg text-sm text-white px-4 py-3 placeholder:text-slate-600"
                style={{ fontFamily: 'inherit' }}
              />
              {errors.title && (
                <span className="text-[11px] font-semibold mt-0.5" style={{ color: '#ef4444' }}>
                  {errors.title.message}
                </span>
              )}
            </div>

            {/* ── Category + Dept side by side ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="ticket-section-label">
                  🏷 DIAGNOSTIC CATEGORY<span>*</span>
                </label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <select
                        {...field}
                        disabled={loading}
                        className="cyber-input w-full rounded-lg text-sm text-white px-4 py-3 pr-10 appearance-none cursor-pointer"
                        style={{ fontFamily: 'inherit' }}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.value} value={c.value} style={{ background: '#0d1024' }}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: 'rgba(148,163,184,0.5)' }} />
                    </div>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="ticket-section-label">
                  🏢 DEPARTMENT ALLOCATION
                </label>
                <div
                  className="cyber-input w-full rounded-lg text-sm px-4 py-3 flex items-center"
                  style={{ color: 'rgba(148,163,184,0.7)', cursor: 'default' }}
                >
                  {activeCategory?.dept ?? 'IT'}
                </div>
              </div>
            </div>

            {/* ── Priority selector ── */}
            <div className="flex flex-col gap-2">
              <label className="ticket-section-label">
                RISK ASSESSMENT PRIORITY<span>*</span>
              </label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRIORITIES.map((p) => {
                      const isActive = field.value === p.value;
                      return (
                        <button
                          key={p.value}
                          type="button"
                          disabled={loading}
                          onClick={() => field.onChange(p.value)}
                          className={`priority-btn rounded-xl py-2.5 px-2 text-center select-none ${isActive ? p.activeClass : ''}`}
                          style={{
                            color: isActive ? undefined : 'rgba(148,163,184,0.65)',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                          }}
                        >
                          <span className="block text-base mb-0.5">{p.dot}</span>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {/* ── Description ── */}
            <div className="flex flex-col gap-1.5">
              <label className="ticket-section-label">
                DETAILED DIAGNOSTICS INCIDENT LOG<span>*</span>
                <span style={{ color: 'rgba(148,163,184,0.45)', marginLeft: 8, letterSpacing: 0 }}>
                  (MIN 20 CHARACTERS)
                </span>
              </label>
              <div className="relative cyber-input rounded-xl" style={{ border: errors.description ? '1px solid rgba(239,68,68,0.5)' : undefined }}>
                <textarea
                  {...register('description')}
                  rows={5}
                  disabled={loading}
                  placeholder="Document the full diagnostic trail — what failed, steps to reproduce, error codes, timestamps, affected systems..."
                  className="w-full bg-transparent text-sm text-white px-4 py-3 resize-none placeholder:text-slate-700 focus:outline-none block"
                  style={{ fontFamily: 'inherit', borderRadius: '11px' }}
                />
                {/* char indicator corner icon */}
                <div className="absolute bottom-2.5 right-3 p-1 rounded-md" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <Zap className="w-3 h-3" style={{ color: 'rgba(99,102,241,0.7)' }} />
                </div>
              </div>
              {errors.description && (
                <span className="text-[11px] font-semibold" style={{ color: '#ef4444' }}>
                  {errors.description.message}
                </span>
              )}
            </div>

            {/* ── Attachments ── */}
            <div className="flex flex-col gap-2">
              <label className="ticket-section-label">
                OPTIONAL DIAGNOSTICS ATTACHMENTS
                <span style={{ color: 'rgba(148,163,184,0.45)', marginLeft: 8, letterSpacing: 0 }}>
                  (PDF, IMAGES, LOG FILES · MAX 5 FILES · MAX 10MB PER PACKET)
                </span>
              </label>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`drop-zone rounded-xl py-7 flex flex-col items-center justify-center gap-2 cursor-pointer select-none ${dragActive ? 'drag-over' : ''}`}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full mb-1"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Paperclip className="w-5 h-5" style={{ color: 'rgba(6,182,212,0.8)' }} />
                </div>
                <p className="text-sm font-bold" style={{ color: 'rgba(148,163,184,0.8)' }}>
                  Drag & Drop diagnostics log bytes here
                </p>
                <p className="text-xs" style={{ color: 'rgba(100,116,139,0.7)' }}>
                  or click to browse filesystem
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.log,.txt"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) addFiles(e.target.files); }}
                  disabled={loading}
                />
              </div>

              {/* Attachment chips */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-semibold"
                      style={{
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        color: 'rgba(148,163,184,0.9)',
                      }}
                    >
                      <Paperclip className="w-3 h-3" style={{ color: 'rgba(6,182,212,0.7)' }} />
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                        className="ml-0.5 p-0.5 rounded hover:text-red-400 transition-colors"
                        style={{ color: 'rgba(100,116,139,0.6)' }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Footer ── */}
          <div
            className="flex items-center justify-between py-4 shrink-0 sticky bottom-0"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: 'linear-gradient(to top, rgba(8,11,26,1) 70%, transparent 100%)',
              marginLeft: -28,
              marginRight: -28,
              paddingLeft: 28,
              paddingRight: 28,
            }}
          >
            {/* Priority indicator */}
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'rgba(245,158,11,0.7)' }} />
              <span className="text-[11px] font-semibold" style={{ color: 'rgba(100,116,139,0.8)' }}>
                Priority:&nbsp;
                <span style={{ color: activePriority?.activeClass?.includes('critical') ? '#ef4444' : activePriority?.activeClass?.includes('high') ? '#f59e0b' : activePriority?.activeClass?.includes('medium') ? '#818cf8' : '#10b981' }}>
                  {activePriority?.label}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(148,163,184,0.7)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = 'rgba(148,163,184,0.7)';
                }}
              >
                Cancel / Discard
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn-incept px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Incept Diagnostic Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, portalTarget);
}

export default CreateTicketModal;
