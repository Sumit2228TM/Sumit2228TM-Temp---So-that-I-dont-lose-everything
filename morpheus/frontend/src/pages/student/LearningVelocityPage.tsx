import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/shared/StudentLayout";
import {
    TrendingUp, TrendingDown, BookOpen, Clock, Flame, BarChart2,
    Award, RefreshCcw, ChevronLeft, ChevronRight, Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useLearningStore, timeAgo } from "../../store/learning.store";

// ─── Animated Counter ─────────────────────────────────────────────────────────

function useAnimatedCount(target: number, duration = 800) {
    const [value, setValue] = useState(0);
    const prevTarget = useRef(0);
    useEffect(() => {
        const start = prevTarget.current;
        prevTarget.current = target;
        const startTime = performance.now();
        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(start + (target - start) * eased));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [target, duration]);
    return value;
}

function KpiCard({ label, value, unit, delta, positive, icon: Icon, color, borderColor }: {
    label: string; value: string; unit: string; delta: string;
    positive: boolean; icon: typeof BookOpen; color: string; borderColor: string;
}) {
    return (
        <div className={cn("rounded-2xl border bg-morpheus-surface p-4 transition-all hover:shadow-lg", borderColor)}>
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", color)}>
                <Icon size={18} />
            </div>
            <p className="font-display text-2xl font-bold text-morpheus-text">{value}</p>
            <p className="text-xs text-morpheus-muted">{unit}</p>
            <p className={cn("text-xs mt-1 font-medium", positive ? "text-emerald-400" : "text-red-400")}>{delta}</p>
            <p className="text-[11px] text-morpheus-muted mt-1 leading-tight">{label}</p>
        </div>
    );
}

function Sparkline({ data, color = "#7c3aed" }: { data: number[]; color?: string }) {
    if (data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 200, h = 48, pad = 4;
    const points = data.map((v, i) => {
        const x = pad + (i / (data.length - 1)) * (w - pad * 2);
        const y = h - pad - ((v - min) / range) * (h - pad * 2);
        return `${x},${y}`;
    }).join(" ");
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
            <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {data.map((v, i) => {
                const x = pad + (i / (data.length - 1)) * (w - pad * 2);
                const y = h - pad - ((v - min) / range) * (h - pad * 2);
                return <circle key={i} cx={x} cy={y} r={i === data.length - 1 ? 4 : 2.5} fill={color} />;
            })}
        </svg>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LearningVelocityPage() {
    const navigate = useNavigate();

    // Live data from store
    const topics = useLearningStore((s) => s.topics);
    const activity = useLearningStore((s) => s.activity);
    const history = useLearningStore((s) => s.weeklyHistory);
    const currentWeekMastered = useLearningStore((s) => s.currentWeekMastered);
    const totalSessions = useLearningStore((s) => s.totalSessions);

    const [activeMetric, setActiveMetric] = useState<"mastered" | "retention" | "improvement">("mastered");
    const [windowStart, setWindowStart] = useState(0);
    const windowSize = 6;

    // Keep window at the latest data when new entries arrive
    useEffect(() => {
        const maxStart = Math.max(0, history.length - windowSize);
        setWindowStart(maxStart);
    }, [history.length]);

    const windowEnd = Math.min(windowStart + windowSize, history.length);
    const weeklyData = history.slice(windowStart, windowEnd);

    // KPI calculations from live data
    const currentWeek = history[history.length - 1];
    const prevWeek = history[history.length - 2] ?? currentWeek;

    const avgAccuracy = Math.round(topics.reduce((a, t) => a + t.accuracy, 0) / topics.length);
    const avgSessionsPerWeek = totalSessions / Math.max(history.length, 1);
    const avgDoubt = currentWeek?.doubtHours ?? 4.2;
    const improvement = currentWeek?.improvement ?? 22;

    const masteredAnim = useAnimatedCount(currentWeekMastered);
    const retentionAnim = useAnimatedCount(avgAccuracy);
    const improvementAnim = useAnimatedCount(improvement);
    const doubtAnim = useAnimatedCount(Math.round(avgDoubt * 10));

    const deltaSign = (curr: number, prev: number) => curr >= prev ? "+" : "";

    const kpiCards = [
        {
            label: "Concepts Mastered This Week", value: String(masteredAnim), unit: "topics",
            delta: `${deltaSign(currentWeek?.mastered ?? 0, prevWeek?.mastered ?? 0)}${(currentWeek?.mastered ?? 0) - (prevWeek?.mastered ?? 0)} vs last week`,
            positive: (currentWeek?.mastered ?? 0) >= (prevWeek?.mastered ?? 0),
            icon: BookOpen, color: "bg-emerald-500/10 text-emerald-400", borderColor: "border-emerald-500/20",
        },
        {
            label: "Avg Doubt Resolution Time", value: (doubtAnim / 10).toFixed(1), unit: "hours",
            delta: `${deltaSign(prevWeek?.doubtHours ?? 0, currentWeek?.doubtHours ?? 0)}${((prevWeek?.doubtHours ?? 0) - (currentWeek?.doubtHours ?? 0)).toFixed(1)}h vs last week`,
            positive: (currentWeek?.doubtHours ?? 0) <= (prevWeek?.doubtHours ?? 0),
            icon: Clock, color: "bg-blue-500/10 text-blue-400", borderColor: "border-blue-500/20",
        },
        {
            label: "Improvement Slope", value: `+${improvementAnim}%`, unit: "growth",
            delta: `lifetime best ${Math.max(...history.map(w => w.improvement), improvement)}%`,
            positive: true,
            icon: TrendingUp, color: "bg-purple-500/10 text-purple-400", borderColor: "border-purple-500/20",
        },
        {
            label: "Retention Rate", value: `${retentionAnim}%`, unit: "avg across all topics",
            delta: `${deltaSign(avgAccuracy, prevWeek?.retention ?? 0)}${avgAccuracy - (prevWeek?.retention ?? 0)}% this week`,
            positive: avgAccuracy >= (prevWeek?.retention ?? 0),
            icon: Flame, color: "bg-amber-500/10 text-amber-400", borderColor: "border-amber-500/20",
        },
    ];

    const metricLabels = {
        mastered: { label: "Concepts Mastered", color: "#7c3aed", max: Math.max(10, ...history.map(w => w.mastered)) },
        retention: { label: "Retention Rate (%)", color: "#3b82f6", max: 100 },
        improvement: { label: "Improvement (%)", color: "#10b981", max: Math.max(30, ...history.map(w => w.improvement)) },
    };

    // Subject velocity from live topic data
    type SubjectVelocityItem = { subject: string; velocity: number; mastered: number; trend: "up" | "down"; delta: string; slug: string };
    const subjects = ["Mathematics", "Physics", "Chemistry", "Calculus", "Biology"];
    const subjectVelocity: SubjectVelocityItem[] = subjects.flatMap((subject) => {
        const subjectTopics = topics.filter((t) => t.subject === subject);
        if (subjectTopics.length === 0) return [];
        const avgScore = Math.round(subjectTopics.reduce((a, t) => a + t.score, 0) / subjectTopics.length);
        const mastered = subjectTopics.filter((t) => t.stability === "stable").length;
        const trend: "up" | "down" = avgScore >= 65 ? "up" : "down";
        const delta = trend === "up" ? `+${Math.floor(avgScore / 10)}%` : `-${Math.floor((100 - avgScore) / 20)}%`;
        const slug = [...subjectTopics].sort((a, b) => a.score - b.score)[0].slug;
        return [{ subject, velocity: avgScore, mastered, trend, delta, slug }];
    });

    return (
        <StudentLayout>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <BarChart2 size={20} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-semibold text-morpheus-text">Learning Velocity Dashboard</h1>
                        <p className="text-sm text-morpheus-muted">
                            Live data · {totalSessions} session{totalSessions !== 1 ? "s" : ""} completed · {topics.filter(t => t.flashcardSessions > 0).length} topics practiced
                        </p>
                    </div>
                </div>
            </div>

            {/* Live highlight banners */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {[
                    { emoji: "🚀", label: "Learning speed", value: `↑ ${improvement}%`, sub: "this week", color: "border-purple-500/30 bg-purple-500/5" },
                    { emoji: "💪", label: "Weak topic recovery", value: `+${Math.min(topics.filter(t => t.stability !== "fragile" && t.flashcardSessions > 0).length * 5, 30)}%`, sub: "improvement", color: "border-emerald-500/30 bg-emerald-500/5" },
                    { emoji: "⚡", label: "Concepts mastered", value: String(currentWeekMastered), sub: "this week", color: "border-amber-500/30 bg-amber-500/5" },
                    { emoji: "🎯", label: "Retention rate", value: `${avgAccuracy}%`, sub: "live avg", color: "border-blue-500/30 bg-blue-500/5" },
                ].map((h) => (
                    <div key={h.label} className={cn("rounded-2xl border p-4 flex flex-col gap-1 transition-all hover:shadow-md", h.color)}>
                        <span className="text-2xl">{h.emoji}</span>
                        <p className="text-xs text-morpheus-muted">{h.label}</p>
                        <p className="font-display text-lg font-bold text-morpheus-text leading-tight">{h.value}</p>
                        <p className="text-[10px] text-morpheus-muted">{h.sub}</p>
                    </div>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {kpiCards.map((k) => <KpiCard key={k.label} {...k} />)}
            </div>

            {/* Chart section */}
            <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                        <h3 className="font-display font-semibold text-morpheus-text">Weekly Progress</h3>
                        <p className="text-xs text-morpheus-muted mt-0.5">
                            {weeklyData[0]?.label ?? "—"} → {weeklyData[weeklyData.length - 1]?.label ?? "—"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => setWindowStart(Math.max(0, windowStart - 1))} disabled={windowStart === 0}
                            className="w-8 h-8 rounded-lg border border-morpheus-border bg-morpheus-bg flex items-center justify-center text-morpheus-muted hover:text-morpheus-text disabled:opacity-30 transition-all">
                            <ChevronLeft size={15} />
                        </button>
                        <button onClick={() => setWindowStart(Math.min(Math.max(0, history.length - windowSize), windowStart + 1))} disabled={windowEnd >= history.length}
                            className="w-8 h-8 rounded-lg border border-morpheus-border bg-morpheus-bg flex items-center justify-center text-morpheus-muted hover:text-morpheus-text disabled:opacity-30 transition-all">
                            <ChevronRight size={15} />
                        </button>
                        <div className="flex gap-1 bg-morpheus-bg rounded-xl p-1 border border-morpheus-border">
                            {(["mastered", "retention", "improvement"] as const).map((m) => (
                                <button key={m} onClick={() => setActiveMetric(m)}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                                        activeMetric === m ? "bg-morpheus-accent text-white" : "text-morpheus-muted hover:text-morpheus-text")}>
                                    {m === "mastered" ? "Mastered" : m === "retention" ? "Retention" : "Growth"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bar chart */}
                {weeklyData.length > 0 ? (
                    <div className="flex items-end gap-2 sm:gap-3 h-40">
                        {weeklyData.map((w, idx) => {
                            const val = w[activeMetric];
                            const pct = Math.min(100, (val / metricLabels[activeMetric].max) * 100);
                            const isLast = idx === weeklyData.length - 1;
                            return (
                                <div key={w.weekKey} className="flex-1 flex flex-col items-center gap-1.5">
                                    <span className="text-[10px] text-morpheus-muted">{val}{activeMetric !== "mastered" ? "%" : ""}</span>
                                    <div className="w-full bg-morpheus-bg rounded-t-lg overflow-hidden" style={{ height: 120 }}>
                                        <div className="w-full rounded-t-lg transition-all duration-700"
                                            style={{
                                                height: `${pct}%`, marginTop: `${100 - pct}%`,
                                                background: isLast
                                                    ? `linear-gradient(to top, ${metricLabels[activeMetric].color}, ${metricLabels[activeMetric].color}cc)`
                                                    : `linear-gradient(to top, ${metricLabels[activeMetric].color}55, ${metricLabels[activeMetric].color}88)`,
                                                boxShadow: isLast ? `0 0 12px ${metricLabels[activeMetric].color}44` : "none",
                                            }} />
                                    </div>
                                    <span className={cn("text-[10px]", isLast ? "text-morpheus-accent font-semibold" : "text-morpheus-muted")}>
                                        W{w.weekKey.split("W")[1]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-40 flex items-center justify-center text-morpheus-muted text-sm">
                        No weekly data yet — complete your first flashcard session!
                    </div>
                )}

                {/* Sparklines */}
                <div className="mt-5 pt-4 border-t border-morpheus-border grid grid-cols-3 gap-4">
                    {(["mastered", "retention", "improvement"] as const).map((m) => (
                        <div key={m}>
                            <p className="text-[10px] text-morpheus-muted mb-1">{metricLabels[m].label}</p>
                            <Sparkline data={history.map((w) => w[m])} color={metricLabels[m].color} />
                            <p className="text-[10px] text-morpheus-muted mt-1">
                                Latest: <span className="text-morpheus-text font-medium">
                                    {history[history.length - 1]?.[m] ?? 0}{m !== "mastered" ? "%" : ""}
                                </span>
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Subject velocity + Activity feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Subject velocity — live from topics */}
                <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5">
                    <div className="flex items-center gap-2 mb-5">
                        <Award size={18} className="text-morpheus-accent" />
                        <h3 className="font-display font-semibold text-morpheus-text">Subject Velocity</h3>
                        <span className="ml-auto text-xs text-morpheus-muted">Live</span>
                    </div>
                    <div className="space-y-4">
                        {subjectVelocity.map((s) => (
                            <div key={s.subject} className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => navigate(`/student/revision/${s.slug}`)}>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <div className="w-28 shrink-0">
                                        <p className="text-sm text-morpheus-text font-medium truncate">{s.subject}</p>
                                        <p className="text-[11px] text-morpheus-muted">{s.mastered} stable concepts</p>
                                    </div>
                                    <div className="flex-1 h-2 bg-morpheus-bg rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full transition-all duration-700",
                                            s.velocity >= 70 ? "bg-emerald-500" : s.velocity >= 50 ? "bg-amber-500" : "bg-red-500")}
                                            style={{ width: `${s.velocity}%` }} />
                                    </div>
                                    <span className={cn("text-xs font-semibold w-14 text-right shrink-0",
                                        s.trend === "up" ? "text-emerald-400" : "text-red-400")}>
                                        {s.trend === "up" ? "↑" : "↓"} {s.delta}
                                    </span>
                                    {s.trend === "up"
                                        ? <TrendingUp size={14} className="text-emerald-400 shrink-0" />
                                        : <TrendingDown size={14} className="text-red-400 shrink-0" />}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button onClick={() => navigate("/student/concept-stability")}
                            className="flex items-center gap-1.5 text-xs text-morpheus-accent font-medium hover:underline">
                            <RefreshCcw size={12} /> View stability meter
                        </button>
                    </div>
                </div>

                {/* Live activity feed */}
                <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5">
                    <div className="flex items-center gap-2 mb-5">
                        <Zap size={18} className="text-amber-400" />
                        <h3 className="font-display font-semibold text-morpheus-text">Recent Activity</h3>
                        <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live
                        </span>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {activity.length === 0 ? (
                            <p className="text-sm text-morpheus-muted text-center py-6">No activity yet — complete a flashcard session!</p>
                        ) : (
                            activity.slice(0, 12).map((a) => (
                                <div key={a.id} className={cn(
                                    "flex gap-3 p-3 rounded-xl border transition-all",
                                    a.type === "success" ? "border-emerald-500/20 bg-emerald-500/5"
                                        : a.type === "warn" ? "border-amber-500/20 bg-amber-500/5"
                                            : "border-morpheus-border bg-morpheus-bg")}>
                                    <span className="text-lg shrink-0">{a.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-morpheus-text">{a.action}</p>
                                        <p className="text-[10px] text-morpheus-muted mt-0.5">{timeAgo(a.timestamp)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button onClick={() => navigate("/student/sessions")}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-morpheus-border text-morpheus-muted text-sm rounded-xl hover:text-morpheus-text hover:bg-morpheus-bg transition-colors">
                        View all sessions →
                    </button>
                </div>
            </div>
        </StudentLayout>
    );
}
