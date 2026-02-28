import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/shared/StudentLayout";
import { Users, Clock, Zap, BookOpen, RefreshCw } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

interface ActiveSession {
    id: string;
    subject: string;
    description: string;
    startedAt: string;
    studentName: string;
}

export default function ShadowLobbyPage() {
    const navigate = useNavigate();
    const { accessToken: token } = useAuthStore();
    const [sessions, setSessions] = useState<ActiveSession[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = async () => {
        try {
            const res = await fetch("http://localhost:3000/api/shadow/doubts/active", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch { /* ignore */ }
        setLoading(false);
    };

    useEffect(() => {
        fetchSessions();
        const iv = setInterval(fetchSessions, 10000); // refresh every 10s
        return () => clearInterval(iv);
    }, []);

    return (
        <StudentLayout>
            <div className="max-w-2xl mx-auto py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, #0891b2, #7c3aed)" }}>
                            <Users size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Shadow Lobby</h1>
                            <p className="text-sm text-slate-400">Join a live doubt session as a silent learner</p>
                        </div>
                    </div>
                    <button onClick={fetchSessions}
                        className="p-2 rounded-xl border border-white/8 bg-white/3 text-slate-400 hover:text-white transition-colors">
                        <RefreshCw size={16} />
                    </button>
                </div>

                {/* Info banner */}
                <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 mb-6 text-sm text-sky-300">
                    🎭 As a <strong>Shadow Learner</strong> you can watch the tutor's video, hear the conversation, and chat — but won't appear on tutor's or student's screen.
                    Polls appear every ~4 minutes to check your understanding.
                </div>

                {/* Session list */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Loading live sessions…</p>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-16 rounded-3xl border border-dashed border-white/10">
                        <p className="text-4xl mb-3">🌙</p>
                        <p className="text-white font-medium mb-1">No active sessions right now</p>
                        <p className="text-slate-500 text-sm mb-6">Post your own doubt or check back soon!</p>
                        <button onClick={() => navigate("/student/shadow/post")}
                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                            Post a Doubt
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map(s => {
                            const ago = Math.floor((Date.now() - new Date(s.startedAt).getTime()) / 60000);
                            return (
                                <div key={s.id}
                                    className="rounded-2xl border border-white/8 p-5 transition-all hover:border-sky-500/30 cursor-pointer group"
                                    style={{ background: "linear-gradient(135deg, #0f1014, #0c0f18)" }}
                                    onClick={() => navigate(`/shadow/session/${s.id}`)}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-lg">
                                            📚
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/25 font-medium">
                                                    {s.subject}
                                                </span>
                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                    <Clock size={10} />
                                                    {ago < 1 ? "just started" : `${ago}m ago`}
                                                </div>
                                            </div>
                                            <p className="text-white font-medium text-sm leading-tight mb-1">{s.description}</p>
                                            <p className="text-xs text-slate-500">Posted by <span className="text-slate-400">{s.studentName}</span></p>
                                        </div>
                                        <button
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-black shrink-0 transition-all group-hover:shadow-lg"
                                            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                                            <Zap size={11} /> Join Live
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Post your own */}
                <div className="mt-8 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 flex items-center justify-between gap-4">
                    <div>
                        <p className="font-semibold text-white text-sm">Have your own doubt?</p>
                        <p className="text-xs text-slate-400 mt-0.5">Post it and get live help from a tutor!</p>
                    </div>
                    <button onClick={() => navigate("/student/shadow/post")}
                        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                        <BookOpen size={13} /> Post Doubt
                    </button>
                </div>
            </div>
        </StudentLayout>
    );
}
