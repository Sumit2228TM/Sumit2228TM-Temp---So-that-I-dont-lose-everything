import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/shared/StudentLayout";
import {
    Activity,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Clock,
    Target,
    TrendingDown,
    RefreshCcw,
    Filter,
    BookOpen,
    Search,
    ArrowRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Types & Data ─────────────────────────────────────────────────────────────

type Stability = "stable" | "shaky" | "fragile";

interface Topic {
    name: string;
    subject: string;
    stability: Stability;
    score: number;
    daysSince: number;
    accuracy: number;
    mistakes: number;
    slug: string;
}

const topicsData: Topic[] = [
    { name: "Differential Equations", subject: "Calculus", stability: "stable", score: 91, daysSince: 2, accuracy: 94, mistakes: 0, slug: "differential-equations" },
    { name: "Limits & Continuity", subject: "Calculus", stability: "stable", score: 86, daysSince: 3, accuracy: 88, mistakes: 1, slug: "limits-continuity" },
    { name: "Vectors & 3D Geometry", subject: "Mathematics", stability: "stable", score: 83, daysSince: 4, accuracy: 85, mistakes: 1, slug: "vectors-3d-geometry" },
    { name: "Waves & Oscillations", subject: "Physics", stability: "stable", score: 78, daysSince: 5, accuracy: 80, mistakes: 2, slug: "waves-oscillations" },
    { name: "Chemical Bonding", subject: "Chemistry", stability: "stable", score: 76, daysSince: 6, accuracy: 79, mistakes: 2, slug: "chemical-bonding" },
    { name: "Probability", subject: "Mathematics", stability: "shaky", score: 62, daysSince: 9, accuracy: 65, mistakes: 3, slug: "probability" },
    { name: "Integration by Parts", subject: "Calculus", stability: "shaky", score: 58, daysSince: 11, accuracy: 61, mistakes: 4, slug: "integration-by-parts" },
    { name: "Thermodynamics", subject: "Physics", stability: "shaky", score: 55, daysSince: 12, accuracy: 57, mistakes: 3, slug: "thermodynamics" },
    { name: "Organic Reactions", subject: "Chemistry", stability: "shaky", score: 51, daysSince: 14, accuracy: 53, mistakes: 5, slug: "organic-reactions" },
    { name: "Binomial Theorem", subject: "Mathematics", stability: "shaky", score: 47, daysSince: 15, accuracy: 49, mistakes: 4, slug: "binomial-theorem" },
    { name: "Permutations & Combinations", subject: "Mathematics", stability: "fragile", score: 28, daysSince: 22, accuracy: 31, mistakes: 8, slug: "permutations-combinations" },
    { name: "Electrochemistry", subject: "Chemistry", stability: "fragile", score: 32, daysSince: 20, accuracy: 35, mistakes: 7, slug: "electrochemistry" },
    { name: "Rotational Motion", subject: "Physics", stability: "fragile", score: 24, daysSince: 25, accuracy: 28, mistakes: 9, slug: "rotational-motion" },
    { name: "Matrices & Determinants", subject: "Mathematics", stability: "fragile", score: 38, daysSince: 18, accuracy: 40, mistakes: 6, slug: "matrices-determinants" },
];

const stabilityConfig = {
    stable: {
        label: "Stable", icon: CheckCircle2,
        text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30",
        glow: "hover:shadow-emerald-500/10", ring: "#22c55e", bar: "bg-emerald-500",
        badge: "bg-emerald-500/20 text-emerald-400",
    },
    shaky: {
        label: "Shaky", icon: AlertCircle,
        text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30",
        glow: "hover:shadow-amber-500/10", ring: "#f59e0b", bar: "bg-amber-500",
        badge: "bg-amber-500/20 text-amber-400",
    },
    fragile: {
        label: "Fragile", icon: XCircle,
        text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30",
        glow: "hover:shadow-red-500/10", ring: "#ef4444", bar: "bg-red-500",
        badge: "bg-red-500/20 text-red-400",
    },
};

function RadialRing({ score, color }: { score: number; color: string }) {
    const r = 28, cx = 36, cy = 36;
    const circ = 2 * Math.PI * r;
    const offset = circ - (score / 100) * circ;
    return (
        <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e1e2e" strokeWidth="5" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="5"
                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                transform="rotate(-90 36 36)" style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
            <text x={cx} y={cy + 5} textAnchor="middle" fill={color} fontSize="14"
                fontWeight="700" fontFamily="DM Sans, sans-serif">{score}</text>
        </svg>
    );
}

function TopicCard({ topic, onRevise, onFlashcards }: {
    topic: Topic;
    onRevise: (slug: string) => void;
    onFlashcards: (slug: string) => void;
}) {
    const cfg = stabilityConfig[topic.stability];
    const Icon = cfg.icon;
    const [showActions, setShowActions] = useState(false);

    return (
        <div
            className={cn(
                "rounded-2xl border p-4 transition-all duration-200 hover:shadow-lg cursor-pointer select-none",
                cfg.bg, cfg.border, cfg.glow
            )}
            onClick={() => setShowActions((s) => !s)}
        >
            <div className="flex items-start gap-3">
                <RadialRing score={topic.score} color={cfg.ring} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", cfg.badge)}>
                            <Icon size={10} className="inline mr-1" />{cfg.label}
                        </span>
                        <span className="text-[10px] text-morpheus-muted">{topic.subject}</span>
                    </div>
                    <p className="font-display font-semibold text-morpheus-text text-sm leading-tight">{topic.name}</p>
                    <p className="text-[10px] text-morpheus-muted mt-1">Tap to see options</p>
                </div>
            </div>

            {/* Stats */}
            <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Clock size={10} className="text-morpheus-muted" />
                        <span className="text-[9px] text-morpheus-muted uppercase tracking-wide">Revised</span>
                    </div>
                    <p className="text-xs font-semibold text-morpheus-text">{topic.daysSince}d ago</p>
                </div>
                <div className="text-center border-x border-white/5">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Target size={10} className="text-morpheus-muted" />
                        <span className="text-[9px] text-morpheus-muted uppercase tracking-wide">Accuracy</span>
                    </div>
                    <p className="text-xs font-semibold text-morpheus-text">{topic.accuracy}%</p>
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                        <TrendingDown size={10} className="text-morpheus-muted" />
                        <span className="text-[9px] text-morpheus-muted uppercase tracking-wide">Mistakes</span>
                    </div>
                    <p className={cn("text-xs font-semibold", topic.mistakes >= 6 ? "text-red-400" : topic.mistakes >= 3 ? "text-amber-400" : "text-morpheus-text")}>
                        {topic.mistakes}x
                    </p>
                </div>
            </div>

            {/* Score bar */}
            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-700", cfg.bar)} style={{ width: `${topic.score}%` }} />
            </div>

            {/* Action buttons (shown on tap) */}
            {showActions && (
                <div className="mt-4 pt-3 border-t border-white/10 flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => onFlashcards(topic.slug)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-morpheus-accent/10 border border-morpheus-accent/20 text-morpheus-accent text-xs font-medium hover:bg-morpheus-accent/20 transition-colors"
                    >
                        <BookOpen size={12} /> Flashcards
                    </button>
                    <button
                        onClick={() => onRevise(topic.slug)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-morpheus-surface border border-morpheus-border text-morpheus-text text-xs font-medium hover:border-white/20 transition-colors"
                    >
                        All options <ArrowRight size={12} />
                    </button>
                    <button
                        onClick={() => window.location.href = "/student/discovery"}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-morpheus-surface border border-morpheus-border text-morpheus-muted text-xs font-medium hover:border-white/20 transition-colors"
                    >
                        <Search size={12} /> Find Tutor
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConceptStabilityPage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<"all" | Stability>("all");
    const [subjectFilter, setSubjectFilter] = useState<string>("All");
    const [lastRefreshed] = useState(new Date());

    const subjects = useMemo(() => ["All", ...Array.from(new Set(topicsData.map((t) => t.subject)))], []);

    const stableCount = topicsData.filter((t) => t.stability === "stable").length;
    const shakyCount = topicsData.filter((t) => t.stability === "shaky").length;
    const fragileCount = topicsData.filter((t) => t.stability === "fragile").length;

    const filtered = topicsData.filter((t) => {
        const matchStab = filter === "all" || t.stability === filter;
        const matchSubj = subjectFilter === "All" || t.subject === subjectFilter;
        return matchStab && matchSubj;
    });

    const handleRevise = (slug: string) => navigate(`/student/revision/${slug}`);
    const handleFlashcards = (slug: string) => navigate(`/student/flashcards/${slug}`);

    const overallScore = Math.round(topicsData.reduce((a, t) => a + t.score, 0) / topicsData.length);

    return (
        <StudentLayout>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-morpheus-accent/10 border border-morpheus-accent/20 flex items-center justify-center">
                        <Activity size={20} className="text-morpheus-accent" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-semibold text-morpheus-text">Concept Stability Meter</h1>
                        <p className="text-sm text-morpheus-muted">Real-time health check · Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                </div>
            </div>

            {/* Overall health ring + summary */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {/* Big ring */}
                <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5 flex items-center gap-5 flex-1">
                    <div className="relative w-24 h-24 shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#1e1e2e" strokeWidth="8" />
                            <circle cx="50" cy="50" r="40" fill="none"
                                stroke={overallScore >= 70 ? "#22c55e" : overallScore >= 50 ? "#f59e0b" : "#ef4444"}
                                strokeWidth="8" strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (overallScore / 100) * 251.2}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold font-display text-morpheus-text">{overallScore}%</span>
                            <span className="text-[9px] text-morpheus-muted">Overall</span>
                        </div>
                    </div>
                    <div>
                        <p className="font-display font-semibold text-morpheus-text mb-0.5">Curriculum Health</p>
                        <p className="text-xs text-morpheus-muted">
                            {fragileCount > 0
                                ? `${fragileCount} topic${fragileCount > 1 ? "s" : ""} need urgent attention`
                                : "Looking good! Keep revising regularly."}
                        </p>
                        <div className="mt-2 h-1.5 w-48 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all duration-700"
                                style={{ width: `${overallScore}%` }} />
                        </div>
                    </div>
                </div>

                {/* Summary counters */}
                <div className="grid grid-cols-3 gap-3 sm:w-auto">
                    {[
                        { label: "Stable", count: stableCount, color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/30", filterVal: "stable" as const },
                        { label: "Shaky", count: shakyCount, color: "text-amber-400", bg: "bg-amber-500/5 border-amber-500/30", filterVal: "shaky" as const },
                        { label: "Fragile", count: fragileCount, color: "text-red-400", bg: "bg-red-500/5 border-red-500/30", filterVal: "fragile" as const },
                    ].map((s) => (
                        <div
                            key={s.label}
                            onClick={() => setFilter(filter === s.filterVal ? "all" : s.filterVal)}
                            className={cn("rounded-2xl border p-4 cursor-pointer hover:brightness-110 transition-all text-center min-w-[80px]", s.bg,
                                filter === s.filterVal && "ring-2 ring-white/10"
                            )}
                        >
                            <p className={cn("font-display text-2xl font-bold", s.color)}>{s.count}</p>
                            <p className="text-xs text-morpheus-muted mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4 items-center">
                <Filter size={13} className="text-morpheus-muted" />
                <div className="flex gap-1 flex-wrap">
                    {(["all", "stable", "shaky", "fragile"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-3 py-1 rounded-lg border text-xs font-medium capitalize transition-all",
                                filter === f
                                    ? f === "stable" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                                        : f === "shaky" ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                            : f === "fragile" ? "bg-red-500/20 border-red-500/40 text-red-400"
                                                : "bg-morpheus-accent/20 border-morpheus-accent/40 text-morpheus-accent"
                                    : "text-morpheus-muted border-morpheus-border hover:text-morpheus-text"
                            )}
                        >
                            {f === "all" ? `All (${topicsData.length})` : `${f} (${topicsData.filter((t) => t.stability === f).length})`}
                        </button>
                    ))}
                </div>
                <span className="text-morpheus-border">|</span>
                <div className="flex gap-1 flex-wrap">
                    {subjects.map((s) => (
                        <button
                            key={s}
                            onClick={() => setSubjectFilter(s)}
                            className={cn(
                                "px-3 py-1 rounded-lg border text-xs font-medium transition-all",
                                subjectFilter === s
                                    ? "bg-morpheus-surface border-morpheus-accent/40 text-morpheus-accent"
                                    : "text-morpheus-muted border-morpheus-border hover:text-morpheus-text"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="flex-1" />
                <button className="flex items-center gap-1.5 text-xs text-morpheus-accent hover:underline font-medium">
                    <RefreshCcw size={12} /> Recalculate
                </button>
            </div>

            <p className="text-xs text-morpheus-muted mb-6">
                Score = composite of revision recency × accuracy × repeated mistakes · <span className="font-medium">Tap any card</span> to start revision
            </p>

            {/* Topic grid */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-morpheus-border p-12 text-center">
                    <p className="text-morpheus-muted">No topics found for this filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((t) => (
                        <TopicCard key={t.name} topic={t} onRevise={handleRevise} onFlashcards={handleFlashcards} />
                    ))}
                </div>
            )}

            {/* Action banner for fragile topics */}
            {(filter === "all" || filter === "fragile") && fragileCount > 0 && (
                <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
                    <div>
                        <p className="font-display font-semibold text-morpheus-text text-sm">
                            🚨 {fragileCount} fragile topics need immediate attention!
                        </p>
                        <p className="text-xs text-morpheus-muted mt-0.5">
                            Revising these now can significantly improve your exam performance.
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap shrink-0">
                        <button
                            onClick={() => setFilter("fragile")}
                            className="px-4 py-2 border border-red-500/30 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/10 transition-colors"
                        >
                            View fragile
                        </button>
                        <button
                            onClick={() => handleRevise(topicsData.filter((t) => t.stability === "fragile").sort((a, b) => a.score - b.score)[0].slug)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            Start revision
                        </button>
                    </div>
                </div>
            )}
        </StudentLayout>
    );
}
