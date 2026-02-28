import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io as socketIO, Socket } from "socket.io-client";
import {
    Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
    MessageSquare, PhoneOff, Users, ThumbsUp, AlertCircle, Send, X,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { cn } from "../../lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────
type ShadowRole = "host_tutor" | "host_student" | "shadow";

interface Peer {
    socketId: string;
    userId: string;
    name: string;
    role: string;
    shadowRole: ShadowRole;
    pc?: RTCPeerConnection;
    stream?: MediaStream;
}

interface ChatMsg {
    fromUserId: string;
    name: string;
    shadowRole: ShadowRole;
    text: string;
    sentAt: string;
}

interface PollResult {
    round: number;
    gotIt: number;
    confused: number;
    total: number;
}

// ─── ICE config fetcher ────────────────────────────────────────────────────────
async function fetchIceServers(token: string): Promise<RTCIceServer[]> {
    try {
        const res = await fetch("http://localhost:3000/api/shadow/ice-servers", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        return data.iceServers || [{ urls: "stun:stun.l.google.com:19302" }];
    } catch {
        return [{ urls: "stun:stun.l.google.com:19302" }];
    }
}

// ─── Role colours ──────────────────────────────────────────────────────────────
const roleBadge: Record<ShadowRole, string> = {
    host_tutor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    host_student: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    shadow: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};
const roleLabel: Record<ShadowRole, string> = {
    host_tutor: "Tutor",
    host_student: "Student",
    shadow: "Shadow",
};

// ─── VideoTile ─────────────────────────────────────────────────────────────────
function VideoTile({ stream, name, shadowRole, muted = false }: {
    stream?: MediaStream;
    name: string;
    shadowRole: ShadowRole;
    muted?: boolean;
}) {
    const ref = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (ref.current && stream) {
            ref.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-white/8 aspect-video flex items-center justify-center">
            {stream ? (
                <video ref={ref} autoPlay playsInline muted={muted} className="w-full h-full object-cover" />
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-white">
                        {name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <p className="text-slate-500 text-xs">No video</p>
                </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", roleBadge[shadowRole])}>
                    {roleLabel[shadowRole]}
                </span>
                <span className="text-[10px] text-white/70 bg-black/50 px-2 py-0.5 rounded-full">{name}</span>
            </div>
        </div>
    );
}

// ─── Main Session Page ─────────────────────────────────────────────────────────
export default function ShadowSessionPage() {
    const { doubtId } = useParams<{ doubtId: string }>();
    const navigate = useNavigate();
    const { accessToken: token, user } = useAuthStore();

    const socketRef = useRef<Socket | null>(null);
    const localStream = useRef<MediaStream | null>(null);
    const screenStream = useRef<MediaStream | null>(null);
    const iceServersRef = useRef<RTCIceServer[]>([{ urls: "stun:stun.l.google.com:19302" }]);
    const peersRef = useRef<Map<string, Peer>>(new Map());

    const [myRole, setMyRole] = useState<ShadowRole | null>(null);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<Peer[]>([]);
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [mic, setMic] = useState(true);
    const [cam, setCam] = useState(true);
    const [sharing, setSharing] = useState(false);
    const [pollOpen, setPollOpen] = useState(false);
    const [pollResult, setPollResult] = useState<PollResult | null>(null);
    const [pollRound, setPollRound] = useState(1);
    const [voted, setVoted] = useState(false);
    const [doubt, setDoubt] = useState<{ subject: string; description: string } | null>(null);
    const [shadowCount, setShadowCount] = useState(0);
    const [ended, setEnded] = useState(false);
    const [joined, setJoined] = useState(false);

    // ── Create peer connection to one remote peer ───────────────────────────────
    const createPC = useCallback((peerId: string, isInitiator: boolean, shadowRole: ShadowRole) => {
        const pc = new RTCPeerConnection({ iceServers: iceServersRef.current });

        // Send local tracks only if host and peer is not a shadow
        // Shadow learners only receive; hosts send to shadows receive-only tracks
        if (localStream.current && (myRole === "host_tutor" || myRole === "host_student")) {
            localStream.current.getTracks().forEach(t => pc.addTrack(t, localStream.current!));
        }

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socketRef.current?.emit("shadow:ice", {
                    doubtId, toPeerId: peerId, candidate: e.candidate,
                });
            }
        };

        pc.ontrack = (e) => {
            const stream = e.streams[0];
            peersRef.current.get(peerId)!.stream = stream;
            setPeers(prev => prev.map(p => p.socketId === peerId ? { ...p, stream } : p));
        };

        if (isInitiator) {
            pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    socketRef.current?.emit("shadow:offer", {
                        doubtId, toPeerId: peerId, offer: pc.localDescription,
                    });
                });
        }

        peersRef.current.get(peerId)!.pc = pc;
        return pc;
    }, [doubtId, myRole]);

    // ── Initialise local media + join socket room ────────────────────────────────
    useEffect(() => {
        if (!doubtId || !token) return;

        (async () => {
            // Load ICE servers
            iceServersRef.current = await fetchIceServers(token);

            // Get local stream (only for host roles — shadow learners stay muted+no-cam)
            // We'll determine role after join, so request media optimistically
            // and silence it if we turn out to be a shadow
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                localStream.current = stream;
                setMyStream(stream);
            } catch {
                // No media device — camera/mic not available; still allow shadow join
                console.warn("[ShadowSession] No media devices available");
            }

            // Connect socket + join session
            const socket = socketIO("http://localhost:3000", {
                auth: { token },
                transports: ["websocket"],
            });
            socketRef.current = socket;

            // ── shadow:room_state — initial info when we join ─────────────────────
            socket.on("shadow:room_state", async ({ shadowRole, doubt: d, peers: existing }: {
                shadowRole: ShadowRole;
                doubt: { subject: string; description: string };
                peers: Peer[];
            }) => {
                setMyRole(shadowRole);
                setDoubt(d);
                setJoined(true);

                // If we are a shadow, stop our camera — we shouldn't broadcast
                if (shadowRole === "shadow" && localStream.current) {
                    localStream.current.getVideoTracks().forEach(t => t.stop());
                    localStream.current.getVideoTracks().forEach(t => localStream.current!.removeTrack(t));
                    setMic(false);
                    setCam(false);
                }

                const initial: Peer[] = [];
                for (const p of existing) {
                    peersRef.current.set(p.socketId, p);
                    initial.push(p);
                    // We are joining second → we initiate
                    createPC(p.socketId, true, p.shadowRole);
                }
                setPeers(initial);
                setShadowCount(initial.filter(p => p.shadowRole === "shadow").length);
            });

            // ── shadow:participant_joined — someone new enters ─────────────────────
            socket.on("shadow:participant_joined", (p: Peer) => {
                peersRef.current.set(p.socketId, p);
                setPeers(prev => [...prev, p]);
                if (p.shadowRole === "shadow") setShadowCount(c => c + 1);
                // New joiner will initiate; we just await their offer
            });

            // ── shadow:offer — incoming offer, send answer ─────────────────────────
            socket.on("shadow:offer", async ({ fromSocketId, fromUserId, fromRole, offer }: any) => {
                if (!peersRef.current.has(fromSocketId)) {
                    // Peer not yet in state — add ephemeral entry
                    peersRef.current.set(fromSocketId, { socketId: fromSocketId, userId: fromUserId, name: "Peer", role: fromRole, shadowRole: fromRole as ShadowRole });
                }
                const pc = createPC(fromSocketId, false, fromRole);
                await pc.setRemoteDescription(offer);
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("shadow:answer", { doubtId, toPeerId: fromSocketId, answer: pc.localDescription });
            });

            // ── shadow:answer ──────────────────────────────────────────────────────
            socket.on("shadow:answer", async ({ fromSocketId, answer }: any) => {
                const peer = peersRef.current.get(fromSocketId);
                if (peer?.pc) await peer.pc.setRemoteDescription(answer);
            });

            // ── shadow:ice ─────────────────────────────────────────────────────────
            socket.on("shadow:ice", async ({ fromSocketId, candidate }: any) => {
                const peer = peersRef.current.get(fromSocketId);
                try { if (peer?.pc) await peer.pc.addIceCandidate(candidate); } catch { }
            });

            // ── shadow:chat_message ────────────────────────────────────────────────
            socket.on("shadow:chat_message", (msg: ChatMsg) => {
                setChatMsgs(prev => [...prev, msg]);
            });

            // ── shadow:poll_results ────────────────────────────────────────────────
            socket.on("shadow:poll_results", (result: PollResult) => {
                setPollResult(result);
                setPollOpen(true);
            });

            // ── shadow:peer_screen_share ───────────────────────────────────────────
            socket.on("shadow:peer_screen_share", () => {
                // future: handle incoming screen share track swap
            });

            // ── shadow:session_ended ───────────────────────────────────────────────
            socket.on("shadow:session_ended", () => {
                setEnded(true);
                localStream.current?.getTracks().forEach(t => t.stop());
                screenStream.current?.getTracks().forEach(t => t.stop());
                peersRef.current.forEach(p => p.pc?.close());
            });

            // ── shadow:doubt_accepted (doubt asker waiting to enter) ───────────────
            socket.on(`shadow:doubt_accepted:${doubtId}`, () => {
                // Already in room — no action needed
            });

            socket.emit("shadow:join_session", { doubtId });
        })();

        return () => {
            socketRef.current?.disconnect();
            localStream.current?.getTracks().forEach(t => t.stop());
            screenStream.current?.getTracks().forEach(t => t.stop());
            peersRef.current.forEach(p => p.pc?.close());
        };
    }, [doubtId, token]);

    // ── Poll auto-fire for tutors every 4 min ────────────────────────────────────
    useEffect(() => {
        if (myRole !== "host_tutor") return;
        const iv = setInterval(() => {
            setPollRound(r => {
                const newRound = r + 1;
                return newRound;
            });
            setPollOpen(true);
            setVoted(false);
        }, 4 * 60 * 1000);
        return () => clearInterval(iv);
    }, [myRole]);

    // ── Controls ────────────────────────────────────────────────────────────────
    const toggleMic = () => {
        localStream.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        setMic(m => !m);
    };

    const toggleCam = () => {
        localStream.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
        setCam(c => !c);
    };

    const toggleScreen = async () => {
        if (sharing) {
            screenStream.current?.getTracks().forEach(t => t.stop());
            screenStream.current = null;
            setSharing(false);
            socketRef.current?.emit("shadow:screen_share", { doubtId, sharing: false });
        } else {
            try {
                const screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
                screenStream.current = screen;
                const videoTrack = screen.getVideoTracks()[0];
                // Replace video track in all peer connections
                peersRef.current.forEach(p => {
                    if (p.pc) {
                        const sender = p.pc.getSenders().find(s => s.track?.kind === "video");
                        sender?.replaceTrack(videoTrack);
                    }
                });
                videoTrack.onended = () => { setSharing(false); socketRef.current?.emit("shadow:screen_share", { doubtId, sharing: false }); };
                setSharing(true);
                socketRef.current?.emit("shadow:screen_share", { doubtId, sharing: true });
            } catch { /* user cancelled */ }
        }
    };

    const sendChat = () => {
        if (!chatInput.trim()) return;
        socketRef.current?.emit("shadow:chat_message", { doubtId, text: chatInput.trim() });
        setChatInput("");
    };

    const vote = (v: "got_it" | "confused") => {
        if (voted) return;
        socketRef.current?.emit("shadow:poll_vote", { doubtId, vote: v, round: pollRound });
        setVoted(true);
    };

    const endSession = () => {
        socketRef.current?.emit("shadow:end_session", { doubtId });
    };

    // ─── Ended screen ──────────────────────────────────────────────────────────
    if (ended) {
        return (
            <div className="min-h-screen flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #0a0808, #080a12)" }}>
                <div className="text-center p-10 rounded-3xl border border-white/10 max-w-sm">
                    <div className="text-5xl mb-4">🏁</div>
                    <h2 className="text-xl font-bold text-white mb-2">Session Ended</h2>
                    <p className="text-slate-400 text-sm mb-6">The doubt session has concluded. Thank you for participating!</p>
                    <button onClick={() => navigate(user?.role === "tutor" ? "/tutor/doubts" : "/student/shadow/lobby")}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const hostPeers = peers.filter(p => p.shadowRole !== "shadow");
    const shadowPeers = peers.filter(p => p.shadowRole === "shadow");

    return (
        <div className="min-h-screen flex flex-col"
            style={{ background: "linear-gradient(140deg, #080a0c 0%, #0d0a14 100%)" }}>

            {/* ── Top bar ───────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <div>
                        <p className="text-white font-semibold text-sm">{doubt?.subject || "Shadow Session"}</p>
                        {doubt && <p className="text-slate-500 text-xs truncate max-w-xs">{doubt.description}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {myRole && (
                        <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium", roleBadge[myRole])}>
                            You: {roleLabel[myRole]}
                        </span>
                    )}
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Users size={11} /> {shadowPeers.length} shadow{shadowPeers.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* ── Video grid ────────────────────────────────────────────────────── */}
            <div className="flex-1 p-4">
                {/* Main hosts area */}
                <div className={cn("grid gap-3 mb-3", hostPeers.length >= 1 ? "grid-cols-2" : "grid-cols-1")}>
                    {/* My own video (if host) */}
                    {myRole && myRole !== "shadow" && (
                        <VideoTile
                            stream={myStream || undefined}
                            name={`${user?.name || "You"} (You)`}
                            shadowRole={myRole}
                            muted
                        />
                    )}
                    {/* Remote hosts */}
                    {hostPeers.map(p => (
                        <VideoTile key={p.socketId} stream={p.stream} name={p.name} shadowRole={p.shadowRole} />
                    ))}
                </div>

                {/* Shadow learner strip (small tiles, audio only) */}
                {shadowPeers.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {shadowPeers.map(p => (
                            <div key={p.socketId}
                                className="shrink-0 rounded-xl bg-slate-800 border border-white/5 px-3 py-2 flex items-center gap-2 text-xs text-slate-400">
                                <span className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                    {p.name?.[0] ?? "?"}
                                </span>
                                {p.name} · 👁 Shadow
                            </div>
                        ))}
                    </div>
                )}

                {/* Joining indicator */}
                {!joined && (
                    <div className="text-center py-12">
                        <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Connecting to session…</p>
                    </div>
                )}
            </div>

            {/* ── Poll overlay ──────────────────────────────────────────────────── */}
            {pollOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
                    <div className="rounded-3xl border border-white/10 p-8 max-w-sm w-full text-center"
                        style={{ background: "linear-gradient(135deg, #0f0d18, #080c14)" }}>
                        <p className="text-2xl mb-2">🤔</p>
                        <h3 className="text-white font-bold text-lg mb-1">Comprehension Check</h3>
                        <p className="text-slate-400 text-sm mb-6">Round {pollRound} · Did you understand the concept so far?</p>

                        {myRole === "shadow" && !voted ? (
                            <div className="flex gap-3 justify-center mb-4">
                                <button onClick={() => vote("got_it")}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-black"
                                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                                    <ThumbsUp size={14} /> Got it!
                                </button>
                                <button onClick={() => vote("confused")}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 transition-all">
                                    <AlertCircle size={14} /> Still confused
                                </button>
                            </div>
                        ) : myRole === "shadow" && voted ? (
                            <p className="text-emerald-400 text-sm mb-4">✅ Vote submitted — waiting for results…</p>
                        ) : null}

                        {/* Show results (everyone) */}
                        {pollResult && pollResult.round === pollRound && (
                            <div className="mt-2 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-emerald-400 w-24 text-right shrink-0">✅ Got it {pollResult.gotIt}</span>
                                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                                            style={{ width: `${pollResult.total ? (pollResult.gotIt / pollResult.total) * 100 : 0}%` }} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-red-400 w-24 text-right shrink-0">❌ Confused {pollResult.confused}</span>
                                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full transition-all duration-700"
                                            style={{ width: `${pollResult.total ? (pollResult.confused / pollResult.total) * 100 : 0}%` }} />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{pollResult.total} shadow learner{pollResult.total !== 1 ? "s" : ""} responded</p>
                            </div>
                        )}

                        <button onClick={() => setPollOpen(false)} className="mt-5 text-xs text-slate-500 hover:text-slate-300">
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* ── Chat drawer ───────────────────────────────────────────────────── */}
            {chatOpen && (
                <div className="fixed right-0 top-0 h-full w-72 border-l border-white/8 flex flex-col z-30"
                    style={{ background: "linear-gradient(180deg, #0d0a14, #080c0f)" }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                        <p className="text-sm font-semibold text-white">Session Chat</p>
                        <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {chatMsgs.map((m, i) => (
                            <div key={i} className={cn("rounded-xl p-2.5 text-xs",
                                m.fromUserId === user?.id
                                    ? "bg-violet-500/15 text-violet-100 ml-4"
                                    : "bg-white/4 text-slate-300 mr-4")}>
                                <p className="font-semibold text-[10px] mb-0.5" style={{ color: m.fromUserId === user?.id ? "#a78bfa" : "#94a3b8" }}>
                                    {m.name} · {roleLabel[m.shadowRole]}
                                </p>
                                {m.text}
                            </div>
                        ))}
                        {chatMsgs.length === 0 && (
                            <p className="text-slate-600 text-xs text-center py-6">No messages yet</p>
                        )}
                    </div>
                    <div className="p-3 border-t border-white/6 flex gap-2">
                        <input
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && sendChat()}
                            placeholder="Type a message…"
                            className="flex-1 rounded-xl bg-white/5 border border-white/8 text-white text-xs px-3 py-2 focus:outline-none focus:border-violet-500/40"
                        />
                        <button onClick={sendChat}
                            className="p-2 rounded-xl text-violet-400 hover:text-white hover:bg-violet-500/20 transition-colors">
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Control bar ───────────────────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-3 py-4 border-t border-white/6">
                {/* Mic — hosts only */}
                {myRole !== "shadow" && (
                    <button onClick={toggleMic}
                        className={cn("p-3 rounded-full border transition-all",
                            mic ? "border-white/15 bg-white/8 text-white" : "border-red-500/30 bg-red-500/15 text-red-400")}
                        title={mic ? "Mute" : "Unmute"}>
                        {mic ? <Mic size={18} /> : <MicOff size={18} />}
                    </button>
                )}

                {/* Camera — hosts only */}
                {myRole !== "shadow" && (
                    <button onClick={toggleCam}
                        className={cn("p-3 rounded-full border transition-all",
                            cam ? "border-white/15 bg-white/8 text-white" : "border-red-500/30 bg-red-500/15 text-red-400")}
                        title={cam ? "Stop Camera" : "Start Camera"}>
                        {cam ? <Video size={18} /> : <VideoOff size={18} />}
                    </button>
                )}

                {/* Screen share — hosts only */}
                {myRole !== "shadow" && (
                    <button onClick={toggleScreen}
                        className={cn("p-3 rounded-full border transition-all",
                            sharing ? "border-sky-500/40 bg-sky-500/15 text-sky-400" : "border-white/15 bg-white/8 text-white")}
                        title={sharing ? "Stop Sharing" : "Share Screen"}>
                        {sharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
                    </button>
                )}

                {/* Chat — all roles */}
                <button onClick={() => setChatOpen(c => !c)}
                    className={cn("p-3 rounded-full border transition-all",
                        chatOpen ? "border-violet-500/40 bg-violet-500/15 text-violet-400" : "border-white/15 bg-white/8 text-white")}>
                    <MessageSquare size={18} />
                </button>

                {/* Manual poll trigger — tutor and student only */}
                {myRole !== "shadow" && (
                    <button onClick={() => setPollOpen(true)}
                        className="p-3 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
                        title="Launch Poll">
                        <Users size={18} />
                    </button>
                )}

                {/* End session — hosts only */}
                {(myRole === "host_tutor" || myRole === "host_student") && (
                    <button onClick={endSession}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #dc2626, #7f1d1d)" }}>
                        <PhoneOff size={16} /> End
                    </button>
                )}

                {/* Leave — shadow learner */}
                {myRole === "shadow" && (
                    <button onClick={() => navigate("/student/shadow/lobby")}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-slate-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                        <PhoneOff size={16} /> Leave
                    </button>
                )}
            </div>
        </div>
    );
}
