import React from 'react';
import { useCall } from '../../context/CallContext';
import { Phone, PhoneOff, AlertCircle } from 'lucide-react';

export function IncomingCallToast() {
  const { callState, ticketDisplayId, callerName, callerRole, ticketTitle, acceptCall, declineCall } = useCall();

  if (callState !== 'incoming') return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] w-full max-w-md px-4 pointer-events-none animate-slideDown">
      <div className="glass-panel border-2 border-accent-success/60 p-5 rounded-2xl shadow-[0_0_25px_rgba(34,197,94,0.25)] bg-[#101726]/95 flex flex-col gap-4 pointer-events-auto relative overflow-hidden select-none">
        
        {/* Pulsing ring radial glow backdrop */}
        <div className="absolute inset-0 bg-radial-glow bg-accent-success/5 animate-pulse pointer-events-none" />

        <div className="flex items-start gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-full bg-accent-success/20 flex items-center justify-center text-accent-success shrink-0 animate-ping">
            <Phone className="w-6 h-6 animate-bounce" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-accent-success uppercase tracking-wider block">
              Incoming Voice Call
            </span>
            <h4 className="text-sm font-black text-text-primary mt-1 truncate">
              {callerName} ({callerRole})
            </h4>
            <div className="text-xs text-text-secondary mt-1 truncate flex items-center gap-1.5">
              <span className="font-bold text-accent-cyan">{ticketDisplayId}</span>
              <span className="text-borderColor">|</span>
              <span className="truncate">{ticketTitle}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 relative z-10 mt-1">
          <button
            onClick={declineCall}
            className="h-10 bg-accent-danger hover:bg-red-500/90 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-red-900/10 touch-target"
          >
            <PhoneOff className="w-4 h-4" />
            Decline
          </button>
          <button
            onClick={acceptCall}
            className="h-10 bg-accent-success hover:bg-green-500/90 text-white rounded-xl text-xs font-extrabold tracking-wider uppercase flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-green-900/15 animate-pulse touch-target"
          >
            <Phone className="w-4 h-4" />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallToast;
