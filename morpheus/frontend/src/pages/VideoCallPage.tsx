/*import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, Loader2, Users
} from "lucide-react";
import { useSocketStore } from "../../src/store/socket.store";    ///    ../../store/socket.store
import { useAuthStore } from "../../src/store/auth.store";///     ../../store/auth.store
import { useSession, useSessionActions } from "../../src/hooks/useSessions";///    ../../hooks/useSessions
import { cn } from "../../src/lib/utils";   ///   ../../lib/utils

type CallState = "connecting" | "waiting" | "connected" | "ended";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
};

export default function VideoCallPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const { session } = useSession(sessionId ?? null);
  const { complete } = useSessionActions();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const isOfferPendingRef = useRef(false);
  const remoteDescSetRef = useRef(false);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  const [callState, setCallState] = useState<CallState>("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const role = user?.role as "student" | "tutor";

  // ─── Create a fresh RTCPeerConnection ────────────────────────────────────────
  const createPC = useCallback(() => {
    // Close any existing connection first
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    remoteDescSetRef.current = false;
    pendingCandidatesRef.current = [];

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add ALL local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
        console.log("[WebRTC] Added local track:", track.kind);
      });
    }

    // When we receive remote tracks — show them
    pc.ontrack = (event) => {
      console.log("[WebRTC] Got remote track:", event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallState("connected");
      }
    };

    // Send ICE candidates to peer via socket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[WebRTC] Sending ICE candidate");
        socket?.emit("webrtc_ice_candidate", {
          sessionId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE state:", pc.iceConnectionState);
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        setCallState("connected");
      }
      if (pc.iceConnectionState === "failed") {
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallState("connected");
      }
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        setCallState("ended");
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, sessionId]);

  // ─── Apply buffered ICE candidates after remote desc is set ─────────────────
  const applyPendingCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !remoteDescSetRef.current) return;
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("[WebRTC] Applied buffered ICE candidate");
      } catch (e) {
        console.warn("[WebRTC] Failed to apply buffered candidate:", e);
      }
    }
    pendingCandidatesRef.current = [];
  }, []);

  // ─── Step 1: Get camera/mic, then join the socket room ──────────────────────
  useEffect(() => {
    if (!sessionId || !socket) return;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("[Media] Got local stream");
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn("[Media] Could not get camera/mic:", err);
      })
      .finally(() => {
        // Join even if camera fails
        console.log("[Socket] Joining call room:", sessionId);
        socket.emit("join_call", { sessionId });
        setCallState("waiting");
      });

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.close();
    };
  }, [sessionId, socket]);

  // ─── Step 2: Handle all socket signaling events ──────────────────────────────
  useEffect(() => {
    if (!socket || !sessionId) return;

    // Another peer joined → TUTOR creates and sends offer
    const onPeerJoined = async ({ role: peerRole }: { userId: string; role: string }) => {
      console.log("[Socket] Peer joined, my role:", role, "peer role:", peerRole);
      setCallState("connected");

      if (role === "tutor") {
        console.log("[WebRTC] I am tutor, creating offer...");
        isOfferPendingRef.current = true;
        const pc = createPC();

        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          console.log("[WebRTC] Sending offer");
          socket.emit("webrtc_offer", { sessionId, offer: pc.localDescription });
        } catch (e) {
          console.error("[WebRTC] Error creating offer:", e);
        } finally {
          isOfferPendingRef.current = false;
        }
      }
    };

    // Student receives offer → creates answer
    const onOffer = async ({ offer }: { offer: RTCSessionDescriptionInit; from: string }) => {
      console.log("[WebRTC] Received offer");
      const pc = createPC();

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSetRef.current = true;
        await applyPendingCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("[WebRTC] Sending answer");
        socket.emit("webrtc_answer", { sessionId, answer: pc.localDescription });
        setCallState("connected");
      } catch (e) {
        console.error("[WebRTC] Error handling offer:", e);
      }
    };

    // Tutor receives answer from student
    const onAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit; from: string }) => {
      console.log("[WebRTC] Received answer");
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        remoteDescSetRef.current = true;
        await applyPendingCandidates();
        setCallState("connected");
      } catch (e) {
        console.error("[WebRTC] Error handling answer:", e);
      }
    };

    // Both sides: receive ICE candidates
    const onIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit; from: string }) => {
      console.log("[WebRTC] Received ICE candidate");
      const pc = peerConnectionRef.current;
      if (!pc) return;

      if (remoteDescSetRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("[WebRTC] Failed to add ICE candidate:", e);
        }
      } else {
        // Buffer until remote description is set
        console.log("[WebRTC] Buffering ICE candidate");
        pendingCandidatesRef.current.push(candidate);
      }
    };

    // Call ended by other party
    const onCallEnded = ({ endedBy }: { endedBy: string; role: string; endedAt: string }) => {
      console.log("[Socket] Call ended by:", endedBy);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.close();
      setCallState("ended");
    };

    socket.on("call_peer_joined", onPeerJoined);
    socket.on("webrtc_offer", onOffer);
    socket.on("webrtc_answer", onAnswer);
    socket.on("webrtc_ice_candidate", onIceCandidate);
    socket.on("call_ended", onCallEnded);

    return () => {
      socket.off("call_peer_joined", onPeerJoined);
      socket.off("webrtc_offer", onOffer);
      socket.off("webrtc_answer", onAnswer);
      socket.off("webrtc_ice_candidate", onIceCandidate);
      socket.off("call_ended", onCallEnded);
    };
  }, [socket, sessionId, role, createPC, applyPendingCandidates]);

  // ─── Controls ────────────────────────────────────────────────────────────────

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
      socket?.emit("call_event", {
        sessionId,
        eventType: track.enabled ? "unmuted" : "muted",
      });
    }
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCameraOff(!track.enabled);
      socket?.emit("call_event", {
        sessionId,
        eventType: track.enabled ? "video_on" : "video_off",
      });
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(cameraTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(screenTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          toggleScreenShare();
        };
        setIsScreenSharing(true);
      } catch (e) {
        console.warn("Screen share cancelled or failed:", e);
      }
    }
  };

  const endCall = async () => {
    socket?.emit("end_call", { sessionId });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();

    if (role === "tutor" && sessionId) {
      try { await complete(sessionId); } catch {console.log("error line catched at line 332")}
    }

    navigate(role === "tutor" ? "/tutor/sessions" : "/student/sessions");
  };

  useEffect(() => {
    if (callState === "ended") {
      const timer = setTimeout(() => {
        navigate(role === "tutor" ? "/tutor/sessions" : "/student/sessions");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [callState, navigate, role]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Video area */
     /* <div className="flex-1 relative overflow-hidden">
        {/* Remote video — full screen */
  /*      <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Waiting overlay */
  /*      {(callState === "waiting" || callState === "connecting") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
            <div className="w-16 h-16 rounded-2xl bg-morpheus-accent/10 border border-morpheus-accent/20 flex items-center justify-center mb-4">
              <Users size={28} className="text-morpheus-accent" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">
              {session?.topic || "Tutoring Session"}
            </p>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Loader2 size={15} className="animate-spin" />
              Waiting for the other person to join…
            </div>
            <p className="text-white/30 text-xs mt-3">
              Make sure your camera and microphone are allowed in your browser.
            </p>
          </div>
        )}

        {/* Call ended overlay */
   /*     {callState === "ended" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
            <p className="text-white text-xl font-semibold mb-2">Call Ended</p>
            <p className="text-white/50 text-sm">Redirecting you back…</p>
          </div>
        )}

        {/* Local video (PiP) */
   /*     <div className="absolute bottom-24 right-4 w-40 h-28 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-zinc-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isCameraOff && (
            <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
              <VideoOff size={20} className="text-white/40" />
            </div>
          )}
          <div className="absolute bottom-1.5 left-2 text-white/60 text-xs">You</div>
        </div>

        {/* Session info badge */
   /*     <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2.5">
          <p className="text-white text-sm font-medium">
            {session?.topic || "Tutoring Session"}
          </p>
          {session?.subjectName && (
            <p className="text-white/50 text-xs mt-0.5">{session.subjectName}</p>
          )}
        </div>

        {/* Connection status badge */
 /*       {callState === "connected" && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Connected</span>
          </div>
        )}
      </div>

      {/* Controls */
 /*     <div className="bg-zinc-900/95 backdrop-blur-sm border-t border-white/10 px-6 py-5">
        <div className="flex items-center justify-center gap-4">
          {/* Mute */
     /*     <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleMute}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <span className="text-white/40 text-xs">{isMuted ? "Unmute" : "Mute"}</span>
          </div>

          {/* Camera */
     /*     <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleCamera}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                isCameraOff ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
            <span className="text-white/40 text-xs">{isCameraOff ? "Start video" : "Stop video"}</span>
          </div>

          {/* End call */
  /*        <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
            >
              <PhoneOff size={22} />
            </button>
            <span className="text-white/40 text-xs">End call</span>
          </div>

          {/* Screen share */
  /*        <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleScreenShare}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                isScreenSharing ? "bg-morpheus-accent text-white" : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
            </button>
            <span className="text-white/40 text-xs">{isScreenSharing ? "Stop share" : "Share screen"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}*/
















import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  PhoneOff, Loader2, Users
} from "lucide-react";
import { useSocketStore } from "../../src/store/socket.store";  ///    ../../store/socket.store
import { useAuthStore } from "../../src/store/auth.store";    ///      ../../store/auth.store
import { useSession, useSessionActions } from "../../src/hooks/useSessions"; ///     ../../hooks/useSessions
import { cn } from "../../src/lib/utils";///    ../../lib/utils
import api from "../../src/api/axios";///   ../../api/axios

type CallState = "connecting" | "waiting" | "connected" | "ended";

const FALLBACK_ICE: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export default function VideoCallPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const { session } = useSession(sessionId ?? null);
  const { complete } = useSessionActions();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const remoteDescSetRef = useRef(false);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_ICE);

  const [callState, setCallState] = useState<CallState>("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [iceReady, setIceReady] = useState(false);

  const role = user?.role as "student" | "tutor";

  // ─── Step 1: Fetch ICE servers from backend ──────────────────────────────────
  useEffect(() => {
    api.get("/api/sessions/ice-servers")
      .then((r) => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          iceServersRef.current = r.data;
          console.log("[ICE] Loaded", r.data.length, "ICE servers from backend");
        } else {
          console.warn("[ICE] Empty response, using fallback STUN");
        }
      })
      .catch(() => {
        console.warn("[ICE] Failed to fetch, using fallback STUN");
      })
      .finally(() => {
        setIceReady(true);
      });
  }, []);

  // ─── Create a fresh RTCPeerConnection ────────────────────────────────────────
  const createPC = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    remoteDescSetRef.current = false;
    pendingCandidatesRef.current = [];

    const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });
    console.log("[WebRTC] Created PC with", iceServersRef.current.length, "ICE servers");

    // Add all local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
        console.log("[WebRTC] Added local track:", track.kind);
      });
    }

    // Receive remote stream → show in remote video
    pc.ontrack = (event) => {
      console.log("[WebRTC] Got remote track:", event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallState("connected");
      }
    };

    // Send ICE candidates to peer via socket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[WebRTC] Sending ICE candidate");
        socket?.emit("webrtc_ice_candidate", {
          sessionId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE state:", pc.iceConnectionState);
      if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        setCallState("connected");
      }
      if (pc.iceConnectionState === "failed") {
        console.warn("[WebRTC] ICE failed, restarting...");
        pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallState("connected");
      }
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "closed"
      ) {
        setCallState("ended");
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [socket, sessionId]);

  // ─── Apply buffered ICE candidates ───────────────────────────────────────────
  const applyPendingCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !remoteDescSetRef.current) return;
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("[WebRTC] Applied buffered ICE candidate");
      } catch (e) {
        console.warn("[WebRTC] Failed to apply buffered candidate:", e);
      }
    }
    pendingCandidatesRef.current = [];
  }, []);

  // ─── Step 2: Get camera/mic, then join socket room ───────────────────────────
  useEffect(() => {
    if (!sessionId || !socket || !iceReady) return;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        console.log("[Media] Got local stream");
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn("[Media] Could not get camera/mic:", err);
      })
      .finally(() => {
        console.log("[Socket] Joining call room:", sessionId);
        socket.emit("join_call", { sessionId });
        setCallState("waiting");
      });

    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.close();
    };
  }, [sessionId, socket, iceReady]);

  // ─── Step 3: Handle all socket signaling events ──────────────────────────────
  useEffect(() => {
    if (!socket || !sessionId) return;

    // Another peer joined → TUTOR creates and sends offer
    const onPeerJoined = async ({ role: peerRole }: { userId: string; role: string }) => {
      console.log("[Socket] Peer joined. My role:", role, "| Peer role:", peerRole);

      if (role === "tutor") {
        console.log("[WebRTC] I am tutor → creating offer...");
        const pc = createPC();
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          console.log("[WebRTC] Sending offer");
          socket.emit("webrtc_offer", { sessionId, offer: pc.localDescription });
        } catch (e) {
          console.error("[WebRTC] Error creating offer:", e);
        }
      }
    };

    // Student receives offer → creates answer
    const onOffer = async ({ offer }: { offer: RTCSessionDescriptionInit }) => {
      console.log("[WebRTC] Received offer");
      const pc = createPC();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        remoteDescSetRef.current = true;
        await applyPendingCandidates();

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("[WebRTC] Sending answer");
        socket.emit("webrtc_answer", { sessionId, answer: pc.localDescription });
        setCallState("connected");
      } catch (e) {
        console.error("[WebRTC] Error handling offer:", e);
      }
    };

    // Tutor receives answer from student
    const onAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log("[WebRTC] Received answer");
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        remoteDescSetRef.current = true;
        await applyPendingCandidates();
        setCallState("connected");
      } catch (e) {
        console.error("[WebRTC] Error handling answer:", e);
      }
    };

    // Both sides receive ICE candidates
    const onIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      if (remoteDescSetRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("[WebRTC] Added ICE candidate");
        } catch (e) {
          console.warn("[WebRTC] Failed to add ICE candidate:", e);
        }
      } else {
        console.log("[WebRTC] Buffering ICE candidate");
        pendingCandidatesRef.current.push(candidate);
      }
    };

    // Call ended by other party
    const onCallEnded = () => {
      console.log("[Socket] Call ended by other party");
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerConnectionRef.current?.close();
      setCallState("ended");
    };

    socket.on("call_peer_joined", onPeerJoined);
    socket.on("webrtc_offer", onOffer);
    socket.on("webrtc_answer", onAnswer);
    socket.on("webrtc_ice_candidate", onIceCandidate);
    socket.on("call_ended", onCallEnded);

    return () => {
      socket.off("call_peer_joined", onPeerJoined);
      socket.off("webrtc_offer", onOffer);
      socket.off("webrtc_answer", onAnswer);
      socket.off("webrtc_ice_candidate", onIceCandidate);
      socket.off("call_ended", onCallEnded);
    };
  }, [socket, sessionId, role, createPC, applyPendingCandidates]);

  // ─── Controls ────────────────────────────────────────────────────────────────

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
      socket?.emit("call_event", {
        sessionId,
        eventType: track.enabled ? "unmuted" : "muted",
      });
    }
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCameraOff(!track.enabled);
      socket?.emit("call_event", {
        sessionId,
        eventType: track.enabled ? "video_on" : "video_off",
      });
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen → revert to camera
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (cameraTrack) {
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(cameraTrack);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        // Replace video track in peer connection → other side sees screen
        const sender = peerConnectionRef.current
          ?.getSenders()
          .find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(screenTrack);

        // Show screen in local PiP
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Auto stop when user clicks browser's "Stop sharing"
        screenTrack.onended = async () => {
          const cam = localStreamRef.current?.getVideoTracks()[0];
          if (cam) {
            const s = peerConnectionRef.current
              ?.getSenders()
              .find((s) => s.track?.kind === "video");
            await s?.replaceTrack(cam);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }
          }
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (e) {
        console.warn("[ScreenShare] Cancelled or failed:", e);
      }
    }
  };

  const endCall = async () => {
    socket?.emit("end_call", { sessionId });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();

    if (role === "tutor" && sessionId) {
      try { await complete(sessionId); } catch {console.log("Error from line no 865")}
    }

    navigate(role === "tutor" ? "/tutor/sessions" : "/student/sessions");
  };

  // Auto navigate when call ends
  useEffect(() => {
    if (callState === "ended") {
      const timer = setTimeout(() => {
        navigate(role === "tutor" ? "/tutor/sessions" : "/student/sessions");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [callState, navigate, role]);

  // ─── Loading screen while fetching ICE servers ───────────────────────────────
  if (!iceReady) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-morpheus-accent" />
          <p className="text-white/60 text-sm">Setting up secure connection…</p>
        </div>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Video area */}
      <div className="flex-1 relative overflow-hidden">

        {/* Remote video — full screen background */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Waiting overlay */}
        {(callState === "waiting" || callState === "connecting") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
            <div className="w-16 h-16 rounded-2xl bg-morpheus-accent/10 border border-morpheus-accent/20 flex items-center justify-center mb-4">
              <Users size={28} className="text-morpheus-accent" />
            </div>
            <p className="text-white font-semibold text-lg mb-2">
              {session?.topic || "Tutoring Session"}
            </p>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Loader2 size={15} className="animate-spin" />
              Waiting for the other person to join…
            </div>
            <p className="text-white/30 text-xs mt-3 text-center max-w-xs">
              Make sure camera and microphone access is allowed in your browser.
            </p>
          </div>
        )}

        {/* Call ended overlay */}
        {callState === "ended" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90">
            <p className="text-white text-xl font-semibold mb-2">Call Ended</p>
            <p className="text-white/50 text-sm">Redirecting you back…</p>
          </div>
        )}

        {/* Local video — picture in picture (bottom right) */}
        <div className="absolute bottom-24 right-4 w-40 h-28 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-zinc-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isCameraOff && !isScreenSharing && (
            <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center">
              <VideoOff size={20} className="text-white/40" />
            </div>
          )}
          <div className="absolute bottom-1.5 left-2 text-white/60 text-xs">
            {isScreenSharing ? "Your screen" : "You"}
          </div>
        </div>

        {/* Session info — top left */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2.5">
          <p className="text-white text-sm font-medium">
            {session?.topic || "Tutoring Session"}
          </p>
          {session?.subjectName && (
            <p className="text-white/50 text-xs mt-0.5">{session.subjectName}</p>
          )}
        </div>

        {/* Connection status — top right */}
        {callState === "connected" && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Connected</span>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="bg-zinc-900/95 backdrop-blur-sm border-t border-white/10 px-6 py-5">
        <div className="flex items-center justify-center gap-6">

          {/* Mute */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleMute}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                isMuted
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <span className="text-white/40 text-xs">
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </div>

          {/* Camera */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleCamera}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                isCameraOff
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
            <span className="text-white/40 text-xs">
              {isCameraOff ? "Start video" : "Stop video"}
            </span>
          </div>

          {/* End call — center, bigger */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={endCall}
              className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
            >
              <PhoneOff size={22} />
            </button>
            <span className="text-white/40 text-xs">End call</span>
          </div>

          {/* Screen share */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleScreenShare}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                isScreenSharing
                  ? "bg-morpheus-accent text-white shadow-lg shadow-morpheus-accent/30"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              {isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
            </button>
            <span className="text-white/40 text-xs">
              {isScreenSharing ? "Stop share" : "Share screen"}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}