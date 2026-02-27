import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/shared/StudentLayout";
import {
    TrendingUp,
    TrendingDown,
    BookOpen,
    Clock,
    Flame,
    BarChart2,
    Award,
    RefreshCcw,
    ChevronLeft,
    ChevronRight,
    Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Pre-seeded Dynamic Data ──────────────────────────────────────────────────

const allWeeksData = [
    { week: "Jan W1", label: "Jan 6–12", mastered: 3, retention: 58, improvement: 4, doubtHours: 6.8, sessions: 1 },
    { week: "Jan W2", label: "Jan 13–19", mastered: 4, retention: 61, improvement: 8, doubtHours: 5.9, sessions: 2 },
    { week: "Jan W3", label: "Jan 20–26", mastered: 5, retention: 64, improvement: 11, doubtHours: 5.4, sessions: 2 },
    { week: "Jan W4", label: "Jan 27–Feb 2", mastered: 4, retention: 60, improvement: 9, doubtHours: 6.1, sessions: 1 },
    { week: "Feb W1", label: "Feb 3–9", mastered: 6, retention: 68, improvement: 14, doubtHours: 4.8, sessions: 2 },
    { week: "Feb W2", label: "Feb 10–16", mastered: 7, retention: 71, improvement: 17, doubtHours: 4.3, sessions: 3 },
    { week: "Feb W3", label: "Feb 17–23", mastered: 8, retention: 74, improvement: 19, doubtHours: 4.1, sessions: 3 },
    { week: "Feb W4", label: "Feb 24–27", mastered: 9, retention: 78, improvement: 22, doubtHours: 4.2, sessions: 3 },
];

const subjectVelocity = [
    { subject: "Mathematics", velocity: 88, mastered: 4, trend: "up" as const, delta: "+18%", slug: "probability" },
    { subject: "Physics", velocity: 72, mastered: 3, trend: "up" as const, delta: "+9%", slug: "rotational-motion" },
    { subject: "Chemistry", velocity: 61, mastered: 2, trend: "down" as const, delta: "-4%", slug: "electrochemistry" },
    { subject: "Calculus", velocity: 55, mastered: 1, trend: "up" as const, delta: "+6%", slug: "integration-by-parts" },
    { subject: "Biology", velocity: 45, mastered: 1, trend: "down" as const, delta: "-2%", slug: "biology" },
];

const recentActivity = [
    { date: "Today", action: "Mastered 'Differential Equations'", icon: "✅", type: "success" },
    { date: "Yesterday", action: "Flashcard session: Probability (18 cards)", icon: "🃏", type: "info" },
    { date: "Feb 25", action: "Session with Mr. Ravi completed", icon: "🎓", type: "success" },
    { date: "Feb 24", action: "Skipped revision: Thermodynamics", icon: "⚠️", type: "warn" },
    { date: "Feb 23", action: "Mastered 'Vectors & 3D Geometry'", icon: "✅", type: "success" },
];

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
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
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
            <defs>
                <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
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
    const [activeMetric, setActiveMetric] = useState<"mastered" | "retention" | "improvement">("mastered");
    const [windowStart, setWindowStart] = useState(2); // which 6-week window to show
    const windowSize = 6;

    const windowEnd = windowStart + windowSize;
    const weeklyData = allWeeksData.slice(windowStart, windowEnd);
    const currentWeek = allWeeksData[allWeeksData.length - 1];
    const prevWeek = allWeeksData[allWeeksData.length - 2];

    // Animated KPI values from current week
    const masteredAnim = useAnimatedCount(currentWeek.mastered);
    const retentionAnim = useAnimatedCount(currentWeek.retention);
    const improvementAnim = useAnimatedCount(currentWeek.improvement);
    const doubtAnim = useAnimatedCount(Math.round(currentWeek.doubtHours * 10));

    const deltaSign = (curr: number, prev: number) => curr >= prev ? "+" : "";

    const kpiCards = [
        {
            label: "Concepts Mastered This Week", value: String(masteredAnim), unit: "topics",
            delta: `${deltaSign(currentWeek.mastered, prevWeek.mastered)}${currentWeek.mastered - prevWeek.mastered} vs last week`,
            positive: currentWeek.mastered >= prevWeek.mastered,
            icon: BookOpen, color: "bg-emerald-500/10 text-emerald-400", borderColor: "border-emerald-500/20",
        },
        {
            label: "Avg Doubt Resolution Time", value: (doubtAnim / 10).toFixed(1), unit: "hours",
            delta: `${deltaSign(prevWeek.doubtHours, currentWeek.doubtHours)}${(prevWeek.doubtHours - currentWeek.doubtHours).toFixed(1)}h vs last week`,
            positive: currentWeek.doubtHours <= prevWeek.doubtHours,
            icon: Clock, color: "bg-blue-500/10 text-blue-400", borderColor: "border-blue-500/20",
        },
        {
            label: "Improvement Slope", value: `+${improvementAnim}%`, unit: "growth",
            delta: `best 8-week score`,
            positive: true,
            icon: TrendingUp, color: "bg-purple-500/10 text-purple-400", borderColor: "border-purple-500/20",
        },
        {
            label: "Retention Rate", value: `${retentionAnim}%`, unit: "avg",
            delta: `+${currentWeek.retention - prevWeek.retention}% vs last week`,
            positive: currentWeek.retention >= prevWeek.retention,
            icon: Flame, color: "bg-amber-500/10 text-amber-400", borderColor: "border-amber-500/20",
        },
    ];

    const metricLabels = {
        mastered: { label: "Concepts Mastered", color: "#7c3aed", max: 10 },
        retention: { label: "Retention Rate (%)", color: "#3b82f6", max: 100 },
        improvement: { label: "Improvement (%)", color: "#10b981", max: 30 },
    };

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
                            Week of {currentWeek.label} · {currentWeek.sessions} session{currentWeek.sessions !== 1 ? "s" : ""} completed
                        </p>
                    </div>
                </div>
            </div>

            {/* Live highlight banners */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {[
                    { emoji: "🚀", label: "Learning speed", value: `↑ ${currentWeek.improvement}%`, sub: "this week", color: "border-purple-500/30 bg-purple-500/5" },
                    { emoji: "💪", label: "Weak topic recovery", value: "+15%", sub: "improvement", color: "border-emerald-500/30 bg-emerald-500/5" },
                    { emoji: "⚡", label: "Concepts mastered", value: `${currentWeek.mastered}`, sub: "this week", color: "border-amber-500/30 bg-amber-500/5" },
                    { emoji: "🎯", label: "Retention rate", value: `${currentWeek.retention}%`, sub: "avg retained", color: "border-blue-500/30 bg-blue-500/5" },
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
                        <p className="text-xs text-morpheus-muted mt-0.5">{weeklyData[0]?.label} → {weeklyData[weeklyData.length - 1]?.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Week window controls */}
                        <button
                            onClick={() => setWindowStart(Math.max(0, windowStart - 1))}
                            disabled={windowStart === 0}
                            className="w-8 h-8 rounded-lg border border-morpheus-border bg-morpheus-bg flex items-center justify-center text-morpheus-muted hover:text-morpheus-text disabled:opacity-30 transition-all"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <button
                            onClick={() => setWindowStart(Math.min(allWeeksData.length - windowSize, windowStart + 1))}
                            disabled={windowEnd >= allWeeksData.length}
                            className="w-8 h-8 rounded-lg border border-morpheus-border bg-morpheus-bg flex items-center justify-center text-morpheus-muted hover:text-morpheus-text disabled:opacity-30 transition-all"
                        >
                            <ChevronRight size={15} />
                        </button>
                        {/* Metric toggle */}
                        <div className="flex gap-1 bg-morpheus-bg rounded-xl p-1 border border-morpheus-border">
                            {(["mastered", "retention", "improvement"] as const).map((m) => (
                                <button key={m} onClick={() => setActiveMetric(m)}
                                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                                        activeMetric === m ? "bg-morpheus-accent text-white" : "text-morpheus-muted hover:text-morpheus-text"
                                    )}
                                >
                                    {m === "mastered" ? "Mastered" : m === "retention" ? "Retention" : "Growth"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bar chart */}
                <div className="flex items-end gap-2 sm:gap-3 h-40">
                    {weeklyData.map((w, idx) => {
                        const val = w[activeMetric];
                        const pct = (val / metricLabels[activeMetric].max) * 100;
                        const isLast = idx === weeklyData.length - 1;
                        return (
                            <div key={w.week} className="flex-1 flex flex-col items-center gap-1.5">
                                <span className="text-[10px] text-morpheus-muted">{val}{activeMetric !== "mastered" ? "%" : ""}</span>
                                <div className="w-full bg-morpheus-bg rounded-t-lg overflow-hidden" style={{ height: 120 }}>
                                    <div
                                        className="w-full rounded-t-lg transition-all duration-700"
                                        style={{
                                            height: `${pct}%`,
                                            marginTop: `${100 - pct}%`,
                                            background: isLast
                                                ? `linear-gradient(to top, ${metricLabels[activeMetric].color}, ${metricLabels[activeMetric].color}cc)`
                                                : `linear-gradient(to top, ${metricLabels[activeMetric].color}55, ${metricLabels[activeMetric].color}88)`,
                                            boxShadow: isLast ? `0 0 12px ${metricLabels[activeMetric].color}44` : "none",
                                        }}
                                    />
                                </div>
                                <span className={cn("text-[10px]", isLast ? "text-morpheus-accent font-semibold" : "text-morpheus-muted")}>
                                    {w.week.split(" ")[1]}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Sparklines */}
                <div className="mt-5 pt-4 border-t border-morpheus-border grid grid-cols-3 gap-4">
                    {(["mastered", "retention", "improvement"] as const).map((m) => (
                        <div key={m}>
                            <p className="text-[10px] text-morpheus-muted mb-1">{metricLabels[m].label}</p>
                            <Sparkline data={allWeeksData.map((w) => w[m])} color={metricLabels[m].color} />
                            <p className="text-[10px] text-morpheus-muted mt-1">
                                Latest: <span className="text-morpheus-text font-medium">
                                    {allWeeksData[allWeeksData.length - 1][m]}{m !== "mastered" ? "%" : ""}
                                </span>
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Subject velocity + Activity feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Subject velocity */}
                <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5">
                    <div className="flex items-center gap-2 mb-5">
                        <Award size={18} className="text-morpheus-accent" />
                        <h3 className="font-display font-semibold text-morpheus-text">Subject Velocity</h3>
                    </div>
                    <div className="space-y-4">
                        {subjectVelocity.map((s) => (
                            <div key={s.subject}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => navigate(`/student/revision/${s.slug}`)}
                            >
                                <div className="flex items-center gap-3 mb-1.5">
                                    <div className="w-28 shrink-0">
                                        <p className="text-sm text-morpheus-text font-medium truncate">{s.subject}</p>
                                        <p className="text-[11px] text-morpheus-muted">{s.mastered} concepts/week</p>
                                    </div>
                                    <div className="flex-1 h-2 bg-morpheus-bg rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-700",
                                                s.velocity >= 75 ? "bg-emerald-500" : s.velocity >= 55 ? "bg-amber-500" : "bg-red-500"
                                            )}
                                            style={{ width: `${s.velocity}%` }}
                                        />
                                    </div>
                                    <div className="w-14 text-right shrink-0">
                                        <span className={cn("text-xs font-semibold", s.trend === "up" ? "text-emerald-400" : "text-red-400")}>
                                            {s.trend === "up" ? "↑" : "↓"} {s.delta}
                                        </span>
                                    </div>
                                    <div className="shrink-0">
                                        {s.trend === "up"
                                            ? <TrendingUp size={14} className="text-emerald-400" />
                                            : <TrendingDown size={14} className="text-red-400" />
                                        }
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={() => navigate("/student/concept-stability")}
                            className="flex items-center gap-1.5 text-xs text-morpheus-accent font-medium hover:underline"
                        >
                            <RefreshCcw size={12} /> View stability meter
                        </button>
                    </div>
                </div>

                {/* Recent activity feed */}
                <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5">
                    <div className="flex items-center gap-2 mb-5">
                        <Zap size={18} className="text-amber-400" />
                        <h3 className="font-display font-semibold text-morpheus-text">Recent Activity</h3>
                    </div>
                    <div className="space-y-3">
                        {recentActivity.map((a, i) => (
                            <div key={i} className={cn(
                                "flex gap-3 p-3 rounded-xl border transition-all",
                                a.type === "success" ? "border-emerald-500/20 bg-emerald-500/5"
                                    : a.type === "warn" ? "border-amber-500/20 bg-amber-500/5"
                                        : "border-morpheus-border bg-morpheus-bg"
                            )}>
                                <span className="text-lg shrink-0">{a.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-morpheus-text">{a.action}</p>
                                    <p className="text-[10px] text-morpheus-muted mt-0.5">{a.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate("/student/sessions")}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border border-morpheus-border text-morpheus-muted text-sm rounded-xl hover:text-morpheus-text hover:bg-morpheus-bg transition-colors"
                    >
                        View all sessions →
                    </button>
                </div>
            </div>
        </StudentLayout>
    );
}
