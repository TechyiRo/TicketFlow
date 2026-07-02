import React from 'react';
import { useCall } from '../../context/CallContext';
import { PhoneOff } from 'lucide-react';

export function CallOverlay() {
  const { callState, ticketDisplayId, ticketTitle, endCall, participants } = useCall();

  if (callState !== 'calling') return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#070b14]/95 flex flex-col items-center justify-between py-16 px-6 text-center select-none overflow-hidden">
      
      {/* Concertric Pulsing Ring Backgrounds */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-[300px] h-[300px] border border-accent-cyan rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute w-[450px] h-[450px] border border-accent-cyan rounded-full animate-ping" style={{ animationDuration: '4s' }} />
        <div className="absolute w-[600px] h-[600px] border border-accent-cyan rounded-full animate-ping" style={{ animationDuration: '5s' }} />
      </div>

      {/* Header section */}
      <div className="relative z-10 space-y-2">
        <span className="text-xs font-extrabold text-accent-cyan uppercase tracking-widest block">
          Initiating Voice Connection
        </span>
        <h2 className="text-xl font-black text-text-primary">
          {ticketDisplayId}
        </h2>
        <p className="text-sm text-text-secondary max-w-sm truncate">
          {ticketTitle}
        </p>
      </div>

      {/* Pulsing ring calling labels */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-accent-cyan/10 border-2 border-accent-cyan/60 flex items-center justify-center text-accent-cyan shadow-[0_0_40px_rgba(0,240,255,0.2)] mb-6 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-accent-cyan/20 flex items-center justify-center animate-bounce">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-text-primary mb-1 animate-pulse">
          Calling...
        </h3>
        <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
          Ringing other active ticket members
        </p>
      </div>

      {/* Outgoing Call controls */}
      <div className="relative z-10">
        <button
          onClick={() => endCall(true)}
          className="w-14 h-14 bg-accent-danger hover:bg-red-500/90 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all active:scale-90 touch-target"
          aria-label="Cancel Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}

export default CallOverlay;
