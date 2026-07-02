import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useDrag } from '@use-gesture/react';

/**
 * Shared Modal component. Adapts to full-screen/bottom drawers on mobile.
 * Can render inside #card-modal-root to overlay a dashboard card if fullCard is true.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  fullCard = false,
}) {
  const [portalTarget, setPortalTarget] = useState(null);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Set portal target anchor
  useEffect(() => {
    if (isOpen) {
      const target = fullCard 
        ? document.getElementById('card-modal-root') 
        : document.body;
      setPortalTarget(target || document.body);
    }
  }, [isOpen, fullCard]);

  // Swipe gesture for mobile: swipe down to dismiss (disabled for full-card views)
  const bind = useDrag(({ last, velocity: [, vy], movement: [, my] }) => {
    if (!fullCard && last && (my > 150 || vy > 0.5)) {
      onClose();
    }
  }, {
    filterTaps: true,
    bounds: { top: 0 },
    rubberband: true,
  });

  if (!isOpen) return null;
  if (!portalTarget) return null;

  const modalContent = (
    <div className={fullCard 
      ? "absolute inset-0 z-50 flex flex-col select-none rounded-2xl pointer-events-auto overflow-hidden" 
      : "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none pointer-events-auto"
    }>
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#02040A]/85 backdrop-blur-md transition-opacity duration-300 select-none rounded-2xl"
      />

      {/* Modal Container */}
      <div
        {...bind()}
        className={fullCard 
          ? `relative glass-panel rounded-2xl w-full h-full flex flex-col shadow-glassShadow transition-all duration-300 overflow-hidden transform translate-y-0 touch-action-none animate-scale-in ${className}`
          : `relative glass-panel rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-glassShadow transition-all duration-300 overflow-hidden transform translate-y-0 touch-action-none xs:max-h-[85vh] short:max-h-[85vh] animate-scale-in ${className}`
        }
        style={{ touchAction: 'pan-y' }}
      >
        {/* Mobile Swipe Drag Handle */}
        {!fullCard && (
          <div className="sm:hidden w-12 h-1.5 bg-text-secondary/20 rounded-full mx-auto my-3 shrink-0 cursor-grab active:cursor-grabbing" />
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 sm:px-6 sm:py-4 border-b border-white/5 bg-transparent shrink-0">
          <h2 className="text-base font-extrabold text-text-primary tracking-wide">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-text-secondary hover:text-text-primary rounded-full hover:bg-white/5 transition-colors touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable internally) */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalTarget);
}

export default Modal;
