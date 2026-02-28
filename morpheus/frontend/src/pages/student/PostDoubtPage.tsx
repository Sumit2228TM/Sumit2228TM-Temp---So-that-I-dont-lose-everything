import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/shared/StudentLayout";
import { Send, BookOpen, AlertCircle, Loader2, Zap } from "lucide-react";
import { useAuthStore } from "../../store/auth.store";

const SUBJECTS = [
    "Mathematics", "Physics", "Chemistry", "Biology",
    "Calculus", "Statistics", "Computer Science", "English",
    "History", "Geography", "Economics", "Other",
];

export default function PostDoubtPage() {
    const navigate = useNavigate();
    const { accessToken: token } = useAuthStore();
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [posted, setPosted] = useState(false);
    const [doubtId, setDoubtId] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !description.trim()) {
            setError("Please select a subject and describe your doubt.");
            return;
        }
        setLoading(true); setError("");
        try {
            const res = await fetch("http://localhost:3000/api/shadow/doubts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ subject, description: description.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to post doubt");
            setPosted(true);
            setDoubtId(data.doubt.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (posted && doubtId) {
        return (
            <StudentLayout>
                <div className="min-h-[70vh] flex items-center justify-center">
                    <div className="rounded-3xl border border-white/10 p-10 text-center max-w-md w-full"
                        style={{ background: "linear-gradient(135deg, #0d1a0d, #0a0f1a)" }}>
                        <div className="text-5xl mb-4">📡</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Doubt Posted!</h2>
                        <p className="text-slate-400 text-sm mb-6">
                            Your doubt has been broadcast to all online tutors.<br />
                            You'll be notified the moment a tutor accepts.
                        </p>
                        <div className="flex items-center justify-center gap-2 mb-8">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                            </span>
                            <span className="text-emerald-400 text-sm font-medium">Waiting for tutor to accept…</span>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => navigate(`/shadow/session/${doubtId}`)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black"
                                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                                <Zap size={14} /> Enter Session Room
                            </button>
                            <button
                                onClick={() => navigate("/student/shadow/lobby")}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                                Go to Lobby
                            </button>
                        </div>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout>
            <div className="max-w-xl mx-auto py-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                        <BookOpen size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Post a Doubt</h1>
                        <p className="text-sm text-slate-400">
                            A tutor will accept and help you live — others can shadow learn for free
                        </p>
                    </div>
                </div>

                {/* How it works */}
                <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 mb-6">
                    <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider mb-2">How Shadow Learning Works</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        {[
                            { step: "1", emoji: "📝", text: "You post a doubt" },
                            { step: "2", emoji: "🎓", text: "A tutor accepts live" },
                            { step: "3", emoji: "👥", text: "Others shadow-learn" },
                        ].map(s => (
                            <div key={s.step} className="p-2">
                                <div className="text-2xl mb-1">{s.emoji}</div>
                                <p className="text-xs text-slate-300">{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}
                    className="rounded-3xl border border-white/8 p-6"
                    style={{ background: "linear-gradient(135deg, #0f0d1a, #0a0d14)" }}>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}

                    {/* Subject */}
                    <div className="mb-5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Subject</label>
                        <div className="flex flex-wrap gap-2">
                            {SUBJECTS.map(s => (
                                <button key={s} type="button" onClick={() => setSubject(s)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${subject === s
                                        ? "border-violet-500/60 bg-violet-500/15 text-violet-300"
                                        : "border-white/8 bg-white/3 text-slate-400 hover:text-slate-200 hover:border-white/15"
                                        }`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                            Describe Your Doubt
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={5}
                            placeholder="E.g. I don't understand how integration by parts works when both functions are trigonometric..."
                            className="w-full rounded-2xl border border-white/8 bg-white/3 text-white text-sm p-4 resize-none placeholder-white/20 focus:outline-none focus:border-violet-500/40 focus:bg-white/5 transition-all"
                        />
                        <p className="text-xs text-slate-600 mt-1 text-right">{description.length}/500</p>
                    </div>

                    <button type="submit" disabled={loading || !subject || !description.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {loading ? "Posting…" : "Post Doubt — Start Shadow Session"}
                    </button>
                </form>
            </div>
        </StudentLayout>
    );
}
