import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import callService from '../services/callService';
import toast from 'react-hot-toast';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useChat();

  // Call state parameters
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'incoming' | 'connected'
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [ticketDisplayId, setTicketDisplayId] = useState('');
  const [ticketTitle, setTicketTitle] = useState('');
  
  const [callerName, setCallerName] = useState('');
  const [callerId, setCallerId] = useState('');
  const [callerRole, setCallerRole] = useState('');
  
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('good'); // 'good' | 'weak'
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  // Track tickets containing active voice calls (for lists indicator badge)
  const [activeCallTickets, setActiveCallTickets] = useState([]);

  // Refs for tracking
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // peerUserId -> RTCPeerConnection
  const durationIntervalRef = useRef(null);
  const activeTicketIdRef = useRef(null);
  const callStartTimeRef = useRef(null);
  const callerNameRef = useRef('');
  const participantsRef = useRef([]);

  // Sync refs to avoid dependency re-renders
  useEffect(() => {
    activeTicketIdRef.current = activeTicketId;
    callerNameRef.current = callerName;
    participantsRef.current = participants;
  }, [activeTicketId, callerName, participants]);

  // Format call duration stopwatch (HH:MM:SS)
  const formatCallDuration = () => {
    const hrs = Math.floor(callDuration / 3600).toString().padStart(2, '0');
    const mins = Math.floor((callDuration % 3600) / 60).toString().padStart(2, '0');
    const secs = (callDuration % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  // Terminate and clean all peer streams
  const cleanupStreamsAndPeers = useCallback(() => {
    // Stop local micro track
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Close all PeerConnections
    peerConnectionsRef.current.forEach((pc, peerId) => {
      pc.close();
      const audioEl = document.getElementById(`audio-peer-${peerId}`);
      if (audioEl) audioEl.remove();
    });
    peerConnectionsRef.current.clear();

    // Clear duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setCallState('idle');
    setActiveTicketId(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsReconnecting(false);
    setConnectionQuality('good');
  }, []);

  // Log voice call summary to DB history
  const logCallLogToDB = useCallback(async (isMissedCall = false) => {
    const currentTicketId = activeTicketIdRef.current;
    const currentCaller = callerNameRef.current;
    
    if (!currentTicketId || !currentCaller) return;

    // Only the caller logs the call to prevent duplicates
    if (user?.fullName !== currentCaller) return;

    const currentStartTime = callStartTimeRef.current || new Date();
    const durationSec = isMissedCall ? 0 : Math.floor((Date.now() - currentStartTime.getTime()) / 1000);
    
    try {
      await callService.logCall(currentTicketId, {
        callerName: currentCaller,
        participants: participantsRef.current.length > 0 ? participantsRef.current : ['Missed Attempt'],
        startTime: currentStartTime,
        duration: durationSec,
        isMissed: isMissedCall,
      });
      console.log('Call history logged successfully in database.');
    } catch (err) {
      console.error('Failed to log call history:', err);
    }
  }, [user]);

  // End Call handler
  const endCall = useCallback((isMissed = false) => {
    const currentTicketId = activeTicketIdRef.current;
    
    // Log before closing
    if (callState === 'connected') {
      logCallLogToDB(false);
    } else if (callState === 'calling' && isMissed) {
      logCallLogToDB(true);
    }

    // Notify backend
    if (socket && user && currentTicketId) {
      socket.emit('leave_call', { 
        ticketId: currentTicketId, 
        userId: user.id, 
        userName: user.fullName 
      });
    }

    cleanupStreamsAndPeers();
  }, [socket, user, callState, logCallLogToDB, cleanupStreamsAndPeers]);

  // Initiate calling outgoing setup
  const startCall = useCallback(async (ticketId, ticketDisplay, title) => {
    if (!socket || !user) return;
    cleanupStreamsAndPeers();

    setActiveTicketId(ticketId);
    setTicketDisplayId(ticketDisplay);
    setTicketTitle(title);
    setCallerName(user.fullName);
    setCallerId(user.id);
    setCallerRole(user.role);
    setParticipants([user.fullName]);
    setCallState('calling');
    callStartTimeRef.current = new Date();

    try {
      // Capture audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      // Broadcast invite over socket
      socket.emit('initiate_call', {
        ticketId,
        callerId: user.id,
        callerName: user.fullName,
        callerRole: user.role,
      });

      // No answer timeout after 30 seconds
      setTimeout(() => {
        setCallState((state) => {
          if (state === 'calling') {
            toast.error('No answer.');
            endCall(true);
          }
          return state;
        });
      }, 30000);
    } catch (err) {
      console.error('Audio capture failed:', err);
      toast.error('Could not access microphone.');
      setCallState('idle');
    }
  }, [socket, user, cleanupStreamsAndPeers, endCall]);

  // Accept incoming call invitation
  const acceptCall = useCallback(async () => {
    if (!socket || !user || !activeTicketId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      setCallState('connected');
      callStartTimeRef.current = new Date();

      // Emit accepted response
      socket.emit('respond_call', {
        ticketId: activeTicketId,
        accepted: true,
        responderId: user.id,
        responderName: user.fullName,
        responderRole: user.role
      });

      // Initialize call timer
      durationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Accept audio stream error:', err);
      toast.error('Could not access microphone.');
      declineCall();
    }
  }, [socket, user, activeTicketId]);

  // Decline incoming call invitation
  const declineCall = useCallback(() => {
    if (!socket || !user || !activeTicketId) return;

    socket.emit('respond_call', {
      ticketId: activeTicketId,
      accepted: false,
      responderId: user.id,
      responderName: user.fullName,
      responderRole: user.role
    });

    cleanupStreamsAndPeers();
  }, [socket, user, activeTicketId, cleanupStreamsAndPeers]);

  // Peer Connection Mesh WebRTC instantiation
  const getOrCreatePeerConnection = useCallback((peerId) => {
    if (peerConnectionsRef.current.has(peerId)) {
      return peerConnectionsRef.current.get(peerId);
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Monitor connection drops
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(`ICE connection with peer ${peerId}: ${state}`);
      
      if (state === 'failed' || state === 'disconnected') {
        setConnectionQuality('weak');
        setIsReconnecting(true);

        // 15 seconds retry logic
        let reconnectTime = 0;
        const interval = setInterval(() => {
          reconnectTime += 1;
          const currentPc = peerConnectionsRef.current.get(peerId);
          if (!currentPc || currentPc.iceConnectionState === 'connected' || currentPc.iceConnectionState === 'completed') {
            clearInterval(interval);
            setConnectionQuality('good');
            setIsReconnecting(false);
            return;
          }
          if (reconnectTime >= 15) {
            clearInterval(interval);
            toast.error('Voice call dropped due to network issues.');
            endCall();
          }
        }, 1000);
      } else if (state === 'connected' || state === 'completed') {
        setConnectionQuality('good');
        setIsReconnecting(false);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_signal', {
          ticketId: activeTicketIdRef.current,
          signal: { type: 'candidate', candidate: event.candidate },
          senderId: user.id
        });
      }
    };

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      let audioEl = document.getElementById(`audio-peer-${peerId}`);
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = `audio-peer-${peerId}`;
        audioEl.autoplay = true;
        audioEl.playsInline = true;
        document.body.appendChild(audioEl);
      }
      audioEl.srcObject = remoteStream;
    };

    // Append local stream track
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionsRef.current.set(peerId, pc);
    return pc;
  }, [socket, user, endCall]);

  // Audio mute toggling
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Mock speaker toggling
  const toggleSpeaker = () => {
    setIsSpeaker(!isSpeaker);
    toast.success(isSpeaker ? 'Audio routed to earpiece.' : 'Audio routed to speaker.');
  };

  // Socket signaling integrations
  useEffect(() => {
    if (!socket || !user) return;

    // Incoming Call trigger
    socket.on('incoming_call', ({ ticketId, ticketDisplayId, callerId, callerName, callerRole, title }) => {
      setCallState((state) => {
        // If already in a call, ignore incoming calls
        if (state !== 'idle') return state;

        setActiveTicketId(ticketId);
        setTicketDisplayId(ticketDisplayId);
        setTicketTitle(title);
        setCallerName(callerName);
        setCallerId(callerId);
        setCallerRole(callerRole);
        setParticipants([callerName]);
        
        socket.emit('join_call_session', { ticketId, userId: user.id, userName: user.fullName });
        return 'incoming';
      });
    });

    // Admin Incoming Call triggers
    socket.on('admin_incoming_call', ({ ticketId, ticketDisplayId, callerId, callerName, callerRole, title }) => {
      setCallState((state) => {
        if (user.role !== 'admin' || state !== 'idle') return state;

        setActiveTicketId(ticketId);
        setTicketDisplayId(ticketDisplayId);
        setTicketTitle(title);
        setCallerName(callerName);
        setCallerId(callerId);
        setCallerRole(callerRole);
        setParticipants([callerName]);
        
        socket.emit('join_call_session', { ticketId, userId: user.id, userName: user.fullName });
        return 'incoming';
      });
    });

    // Call Accepted trigger -> Initiate WebRTC SDP offer
    socket.on('call_accepted', async ({ responderId, responderName }) => {
      setCallState((state) => {
        if (state === 'calling') {
          // Dialer joins the call session timer
          durationIntervalRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
          return 'connected';
        }
        return state;
      });

      // Update participants list
      setParticipants((prev) => {
        if (prev.includes(responderName)) return prev;
        return [...prev, responderName];
      });

      // Initiate WebRTC peer connection
      try {
        const pc = getOrCreatePeerConnection(responderId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit('webrtc_signal', {
          ticketId: activeTicketIdRef.current,
          signal: { type: 'offer', sdp: offer },
          senderId: user.id
        });
      } catch (err) {
        console.error('SDP offer creation error:', err);
      }
    });

    // Call Declined trigger
    socket.on('call_declined', ({ responderName }) => {
      setCallState((state) => {
        if (state === 'calling') {
          toast.error(`${responderName} declined the call.`);
          cleanupStreamsAndPeers();
        }
        return state;
      });
    });

    // WebRTC SDP offers/answers and ICE candidate signaling
    socket.on('webrtc_signal', async ({ senderId, signal }) => {
      try {
        const pc = getOrCreatePeerConnection(senderId);
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('webrtc_signal', {
            ticketId: activeTicketIdRef.current,
            signal: { type: 'answer', sdp: answer },
            senderId: user.id
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        } else if (signal.type === 'candidate' && signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.error('WebRTC signal processing failed:', err);
      }
    });

    // Participant exit events
    socket.on('participant_left', ({ userName }) => {
      setParticipants((prev) => prev.filter((p) => p !== userName));
      toast.error(`${userName} left the call.`);
    });

    // Call End event
    socket.on('call_ended', () => {
      toast.error('Voice call ended.');
      cleanupStreamsAndPeers();
    });

    // Active calls indicators lists updates
    socket.on('active_calls_update', (ticketsList) => {
      setActiveCallTickets(ticketsList);
    });

    return () => {
      socket.off('incoming_call');
      socket.off('admin_incoming_call');
      socket.off('call_accepted');
      socket.off('call_declined');
      socket.off('webrtc_signal');
      socket.off('participant_left');
      socket.off('call_ended');
      socket.off('active_calls_update');
    };
  }, [socket, user, getOrCreatePeerConnection, cleanupStreamsAndPeers]);

  return (
    <CallContext.Provider value={{
      callState,
      activeTicketId,
      ticketDisplayId,
      ticketTitle,
      callerName,
      callerId,
      callerRole,
      participants,
      isMuted,
      isSpeaker,
      callDuration,
      connectionQuality,
      isReconnecting,
      activeCallTickets,
      startCall,
      acceptCall,
      declineCall,
      endCall,
      toggleMute,
      toggleSpeaker,
      formatCallDuration
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
