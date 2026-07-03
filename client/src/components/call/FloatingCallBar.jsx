import React from 'react';
import { useCall } from '../../context/CallContext';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Crown, AlertTriangle, RefreshCw } from 'lucide-react';

export function FloatingCallBar() {
  const { 
    callState, 
    ticketDisplayId, 
    participants, 
    isMuted, 
    isSpeaker, 
    connectionQuality, 
    isReconnecting, 
    endCall, 
    toggleMute, 
    toggleSpeaker, 
    formatCallDuration 
  } = useCall();

  if (callState !== 'connected') return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[99998] md:w-[650px] pointer-events-none animate-slideDown select-none">
      <div className="glass-panel border-b-2 border-b-accent-success/80 border-t border-x border-borderColor/80 px-4 py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] bg-[#0d121f]/90 flex items-center justify-between pointer-events-auto gap-4">
        
        {/* Call Info & Duration */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-success/15 text-accent-success animate-pulse">
            <Volume2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-accent-success uppercase tracking-widest block leading-none">
              On Call
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs font-black text-text-primary leading-none">
                {ticketDisplayId}
              </span>
              <span className="text-borderColor/80 text-[10px]">&bull;</span>
              <span className="text-xs font-mono font-bold text-accent-cyan leading-none">
                {formatCallDuration()}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Participants list */}
        <div className="flex-1 flex flex-wrap gap-1.5 items-center justify-center min-w-0">
          {participants.map((name, idx) => {
            const isAdmin = name.toLowerCase().includes('admin') || name.toLowerCase().includes('administrator');
            return (
              <span 
                key={idx}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                  isAdmin 
                    ? 'bg-violet-500/15 border border-violet-500/35 text-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.15)]'
                    : 'bg-[#151c2d] border border-borderColor text-text-secondary'
                }`}
              >
                {isAdmin && <Crown className="w-3 h-3 text-amber-400 animate-pulse" />}
                {name}
              </span>
            );
          })}
        </div>

        {/* Warnings / Reconnection alerts */}
        {(isReconnecting || connectionQuality === 'weak') && (
          <div className="flex items-center gap-1.5 shrink-0 select-none px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
            {isReconnecting ? (
              <>
                <RefreshCw className="w-3 h-3 text-accent-warning animate-spin" />
                <span className="text-[9px] font-bold text-accent-warning uppercase tracking-wider">
                  Reconnecting...
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-accent-warning animate-bounce" />
                <span className="text-[9px] font-bold text-accent-warning uppercase tracking-wider">
                  Weak Connection
                </span>
              </>
            )}
          </div>
        )}

        {/* Call control action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mute button */}
          <button
            onClick={toggleMute}
            className={`p-2.5 rounded-xl border transition-all active:scale-90 touch-target ${
              isMuted
                ? 'bg-accent-danger border-accent-danger text-white'
                : 'bg-[#151c2d] border-borderColor text-text-secondary hover:text-text-primary'
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Speaker button */}
          {typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype && (
            <button
              onClick={toggleSpeaker}
              className={`p-2.5 rounded-xl border transition-all active:scale-90 touch-target ${
                !isSpeaker
                  ? 'bg-[#151c2d] border-borderColor text-text-secondary/40'
                  : 'bg-[#151c2d] border-borderColor text-text-secondary hover:text-text-primary'
              }`}
              title={isSpeaker ? "Disable Speaker" : "Enable Speaker"}
            >
              {isSpeaker ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          )}

          {/* End Call button */}
          <button
            onClick={() => endCall(false)}
            className="p-2.5 bg-accent-danger hover:bg-red-500/90 text-white border border-accent-danger rounded-xl flex items-center justify-center transition-all active:scale-90 touch-target"
            title="Hang Up"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

export default FloatingCallBar;
