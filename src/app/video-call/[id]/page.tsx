'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare,
  Monitor, MoreVertical, Loader2, Users, Volume2,
} from 'lucide-react';
import { db, COLLECTIONS } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export default function VideoCallPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuthStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const callDocRef = doc(db, 'calls', id);

  // ─── Hide controls after 3s of inactivity ─────────────────
  function resetControlsTimer() {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }

  // ─── Start timer once connected ─────────────────────────────
  function startTimer() {
    timerRef.current = setInterval(() => setCallDuration((d) => d + 1), 1000);
  }

  function formatDuration(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // ─── Initialize WebRTC ──────────────────────────────────────
  const initCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setIsConnected(true);
          setIsConnecting(false);
          startTimer();
        }
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          toast.error('Connection lost. Reconnecting...');
          setIsConnected(false);
        }
      };

      // ICE candidates to Firestore
      const iceCandidatesRef = collection(callDocRef, 'iceCandidates_' + (profile?.role === 'doctor' ? 'doctor' : 'patient'));
      pc.onicecandidate = async (e) => {
        if (e.candidate) {
          await addDoc(iceCandidatesRef, e.candidate.toJSON());
        }
      };

      // Doctor creates offer; patient answers
      if (profile?.role === 'doctor') {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await setDoc(callDocRef, { offer: { sdp: offer.sdp, type: offer.type }, createdAt: serverTimestamp() }, { merge: true });

        // Listen for answer
        onSnapshot(callDocRef, async (snap) => {
          const data = snap.data();
          if (data?.answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });

        // Listen for patient ICE
        onSnapshot(collection(callDocRef, 'iceCandidates_patient'), (snap) => {
          snap.docChanges().forEach((change) => {
            if (change.type === 'added') {
              pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            }
          });
        });
      } else {
        // Patient listens for offer then answers
        onSnapshot(callDocRef, async (snap) => {
          const data = snap.data();
          if (data?.offer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await updateDoc(callDocRef, { answer: { sdp: answer.sdp, type: answer.type } });
          }
        });

        // Listen for doctor ICE
        onSnapshot(collection(callDocRef, 'iceCandidates_doctor'), (snap) => {
          snap.docChanges().forEach((change) => {
            if (change.type === 'added') {
              pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            }
          });
        });
      }

      // Timeout if no connection after 30s
      setTimeout(() => {
        if (!isConnected) setIsConnecting(false);
      }, 30000);

    } catch (err) {
      toast.error('Could not access camera/microphone. Check permissions.');
      setIsConnecting(false);
    }
  }, [id, profile?.role]);

  useEffect(() => {
    initCall();
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      if (timerRef.current) clearInterval(timerRef.current);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  function toggleMute() {
    const audio = localStreamRef.current?.getAudioTracks()[0];
    if (audio) {
      audio.enabled = !audio.enabled;
      setIsMuted(!audio.enabled);
    }
  }

  function toggleVideo() {
    const video = localStreamRef.current?.getVideoTracks()[0];
    if (video) {
      video.enabled = !video.enabled;
      setIsVideoOff(!video.enabled);
    }
  }

  async function endCall() {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900 flex items-center justify-center overflow-hidden"
      onMouseMove={resetControlsTimer}
      onClick={resetControlsTimer}
    >
      {/* Remote Video (Full Screen) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />

      {/* Connecting Overlay */}
      {isConnecting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90">
          <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          </div>
          <p className="text-white font-semibold text-lg">Connecting…</p>
          <p className="text-slate-400 text-sm mt-1">Waiting for the other participant</p>
          <p className="text-slate-500 text-xs mt-1">Low bandwidth mode active</p>
        </div>
      )}

      {/* No Connection Placeholder */}
      {!isConnecting && !isConnected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
          <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm">Waiting for participant to join…</p>
        </div>
      )}

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute top-4 right-4 w-32 h-24 sm:w-44 sm:h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
            <VideoOff className="w-6 h-6 text-slate-400" />
          </div>
        )}
      </div>

      {/* Top HUD */}
      <div className={`absolute top-4 left-4 flex items-center gap-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-white text-xs font-medium">
            {isConnected ? formatDuration(callDuration) : 'Connecting'}
          </span>
        </div>
        {isConnected && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-xs text-green-400">
            <Volume2 className="w-3 h-3" /> HD Audio
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 inset-x-0 px-4 pb-6 pt-16 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-center gap-4">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Toggle Video */}
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'}`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        </div>

        <p className="text-center text-white/50 text-xs mt-4">
          Tap screen to show controls • Tap phone icon to end call
        </p>
      </div>
    </div>
  );
}
