import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TutorLayout from "../../components/shared/TutorLayout";
import { BookOpen, Check, X, Clock, RefreshCw, Zap } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { io as socketIO } from "socket.io-client";

interface Doubt {
    id: string;
    subject: string;
    description: string;
    studentName: string;
    createdAt: string;
}

export default function DoubtFeedPage() {
    const navigate = useNavigate();
    const { accessToken: token } = useAuthStore();
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);

    const fetchDoubts = async () => {
        try {
            const res = await fetch("http://localhost:3000/api/shadow/doubts/pending", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setDoubts(data.doubts || []);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => {
        fetchDoubts();

        // Listen for new doubts over socket in real time
        const socket = socketIO("http://localhost:3000", {
            auth: { token },
            transports: ["websocket"],
        });

        socket.on("shadow:new_doubt", (doubt: Doubt) => {
            setDoubts(prev => [doubt, ...prev]);
        });

        socket.on("shadow:doubt_removed_from_feed", ({ doubtId }: { doubtId: string }) => {
            setDoubts(prev => prev.filter(d => d.id !== doubtId));
        });

        return () => { socket.disconnect(); };
    }, []);

    const accept = async (doubtId: string) => {
        setActingId(doubtId);
        try {
            // Emit via socket (server handles DB update + notifications)
            const socket = socketIO("http://localhost:3000", {
                auth: { token },
                transports: ["websocket"],
            });
            socket.emit("shadow:accept_doubt", { doubtId });
            setDoubts(prev => prev.filter(d => d.id !== doubtId));
            setTimeout(() => {
                socket.disconnect();
                navigate(`/shadow/session/${doubtId}`);
            }, 300);
        } catch { /* ignore */ }
        setActingId(null);
    };

    const decline = (doubtId: string) => {
        const socket = socketIO("http://localhost:3000", {
            auth: { token },
            transports: ["websocket"],
        });
        socket.emit("shadow:decline_doubt", { doubtId });
        setTimeout(() => socket.disconnect(), 1000);
        setDoubts(prev => prev.filter(d => d.id !== doubtId));
    };

    return (
        <TutorLayout>
            <div className="max-w-2xl mx-auto py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #0891b2)" }}>
                            <BookOpen size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Live Doubts</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                                </span>
                                <span className="text-xs text-emerald-400 font-medium">New doubts appear in real time</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={fetchDoubts}
                        className="p-2 rounded-xl border border-white/8 bg-white/3 text-slate-400 hover:text-white transition-colors">
                        <RefreshCw size={16} />
                    </button>
                </div>

                {/* Info */}
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 mb-6 text-sm text-violet-300">
                    🎓 When you <strong>accept</strong> a doubt you'll go live immediately — students can join as shadow learners to watch &amp; learn.
                </div>

                {loading ? (
                    <div className="text-center py-16">
                        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mx-auto" />
                    </div>
                ) : doubts.length === 0 ? (
                    <div className="text-center py-16 rounded-3xl border border-dashed border-white/10">
                        <p className="text-4xl mb-3">☀️</p>
                        <p className="text-white font-medium mb-1">No pending doubts right now</p>
                        <p className="text-slate-500 text-sm">New doubts will appear here instantly when students post them.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {doubts.map(d => {
                            const ago = Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 60000);
                            return (
                                <div key={d.id}
                                    className="rounded-2xl border border-white/8 p-5"
                                    style={{ background: "linear-gradient(135deg, #0f0d1a, #0a0d14)" }}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 text-lg">
                                            ❓
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25 font-medium">
                                                    {d.subject}
                                                </span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {ago < 1 ? "just now" : `${ago}m ago`} · by {d.studentName}
                                                </span>
                                            </div>
                                            <p className="text-white text-sm leading-relaxed mb-3">{d.description}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    disabled={actingId === d.id}
                                                    onClick={() => accept(d.id)}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-black transition-all hover:shadow-lg disabled:opacity-60"
                                                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                                                    <Check size={12} /> Accept &amp; Go Live
                                                </button>
                                                <button
                                                    onClick={() => decline(d.id)}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 border border-white/10 bg-white/3 hover:text-red-400 hover:border-red-500/30 transition-all">
                                                    <X size={12} /> Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </TutorLayout>
    );
}
