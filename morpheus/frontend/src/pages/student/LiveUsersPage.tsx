import React, { useState, useEffect, useRef, useCallback } from "react";
import StudentLayout from "../../components/shared/StudentLayout";
import {
    Users, GraduationCap, BookOpen, Zap, TrendingUp, Activity,
    MessageSquare, Video, Globe, Clock, Star, Flame,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useLearningStore } from "../../store/learning.store";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LiveStats {
    onlineStudents: number;
    onlineTutors: number;
    activeSessions: number;
    messagesLastHour: number;
    questionsAnswered: number;
    flashcardsCompleted: number;
}

interface PulseEvent {
    id: string;
    text: string;
    emoji: string;
    type: "student" | "tutor" | "session" | "milestone";
    time: number;
}

interface HourBar {
    hour: number;
    students: number;
    tutors: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

// Realistic user count by hour (IST peak 5 PM – 11 PM)
function baseCountByHour(hour: number): { students: number; tutors: number } {
    const profile = [
        4, 3, 2, 2, 3, 5,   // 0–5 AM
        12, 28, 45, 52, 48, 44, // 6–11 AM
        40, 38, 36, 42, 55, 72, // 12–5 PM
        88, 102, 115, 108, 94, 72, // 6–11 PM
    ];
    const base = profile[hour] ?? 40;
    return {
        students: Math.round(base * 2.5),
        tutors: Math.round(base * 0.65),
    };
}

function jitter(n: number, pct = 0.08): number {
    return Math.max(1, Math.round(n + n * (Math.random() - 0.5) * pct));
}

const STUDENT_NAMES = ["Aryan", "Priya", "Rahul", "Anjali", "Kabir", "Meera", "Rohan", "Sneha", "Aditya", "Pooja", "Vivek", "Nisha"];
const TUTOR_NAMES = ["Mr. Ravi", "Ms. Divya", "Prof. Sharma", "Mrs. Iyer", "Mr. Khan", "Ms. Patel"];
const SUBJECTS = ["Calculus", "Physics", "Chemistry", "Mathematics", "Biology", "Statistics", "CS"];
const ACTIONS_STUDENT = ["started a flashcard session", "answered 3 transfer challenges", "completed a revision", "joined a live session", "mastered a new concept", "solved a weakness quiz"];
const ACTIONS_TUTOR = ["started a live session", "answered a student's doubt", "shared practice problems", "joined the platform", "uploaded notes", "completed a session"];

function randomEvent(): PulseEvent {
    const isTutor = Math.random() < 0.22;
    const isMilestone = Math.random() < 0.12;
    if (isMilestone) {
        return {
            id: uid(), time: Date.now(),
            emoji: "🏆", type: "milestone",
            text: `${STUDENT_NAMES[Math.floor(Math.random() * STUDENT_NAMES.length)]} just mastered ${SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]}!`,
        };
    }
    if (Math.random() < 0.08) {
        return {
            id: uid(), time: Date.now(),
            emoji: "📡", type: "session",
            text: `New live session started: ${TUTOR_NAMES[Math.floor(Math.random() * TUTOR_NAMES.length)]} · ${SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]}`,
        };
    }
    const name = isTutor
        ? TUTOR_NAMES[Math.floor(Math.random() * TUTOR_NAMES.length)]
        : STUDENT_NAMES[Math.floor(Math.random() * STUDENT_NAMES.length)];
    const actions = isTutor ? ACTIONS_TUTOR : ACTIONS_STUDENT;
    const action = actions[Math.floor(Math.random() * actions.length)];
    return {
        id: uid(), time: Date.now(),
        emoji: isTutor ? "🎓" : "📚",
        type: isTutor ? "tutor" : "student",
        text: `${name} ${action}`,
    };
}

// ─── Pulse Dot ─────────────────────────────────────────────────────────────────

function PulseDot({ color = "#22c55e", size = 8 }: { color?: string; size?: number }) {
    return (
        <span className="relative inline-flex" style={{ width: size, height: size }}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ backgroundColor: color }} />
            <span className="relative inline-flex rounded-full"
                style={{ width: size, height: size, backgroundColor: color }} />
        </span>
    );
}

// ─── Animated Counter ──────────────────────────────────────────────────────────

function AnimCount({ value, className }: { value: number; className?: string }) {
    const [display, setDisplay] = useState(value);
    const prev = useRef(value);
    useEffect(() => {
        const start = prev.current;
        prev.current = value;
        const diff = value - start;
        if (diff === 0) return;
        const steps = 20;
        let i = 0;
        const iv = setInterval(() => {
            i++;
            setDisplay(Math.round(start + (diff * i) / steps));
            if (i >= steps) { clearInterval(iv); setDisplay(value); }
        }, 30);
        return () => clearInterval(iv);
    }, [value]);
    return <span className={className}>{display.toLocaleString()}</span>;
}

// ─── 24-Hour Activity Chart ─────────────────────────────────────────────────────

function ActivityChart({ bars, currentHour }: { bars: HourBar[]; currentHour: number }) {
    const maxVal = Math.max(...bars.map(b => b.students + b.tutors), 1);
    const w = 580, h = 100, pad = 4;
    const barW = (w - pad * 2) / bars.length - 2;

    return (
        <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full min-w-[320px]" style={{ minWidth: 320 }}>
                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map(v => (
                    <line key={v} x1={pad} x2={w - pad} y1={h - v * h} y2={h - v * h}
                        stroke="#ffffff06" strokeWidth="1" />
                ))}

                {/* Bars */}
                {bars.map((bar, i) => {
                    const x = pad + i * ((w - pad * 2) / bars.length);
                    const totalH = ((bar.students + bar.tutors) / maxVal) * (h - 8);
                    const studentH = (bar.students / (bar.students + bar.tutors || 1)) * totalH;
                    const tutorH = totalH - studentH;
                    const isCurrent = bar.hour === currentHour;
                    return (
                        <g key={i}>
                            {/* Tutor segment (bottom) */}
                            <rect x={x + 1} y={h - tutorH} width={barW} height={tutorH}
                                fill={isCurrent ? "#a78bfa" : "#7c3aed55"} rx={2}
                                style={{ transition: "height 0.6s ease, y 0.6s ease" }} />
                            {/* Student segment (top) */}
                            <rect x={x + 1} y={h - totalH} width={barW} height={studentH}
                                fill={isCurrent ? "#22c55e" : "#16a34a44"} rx={2}
                                style={{ transition: "height 0.6s ease, y 0.6s ease" }} />
                            {/* Current hour glow */}
                            {isCurrent && (
                                <rect x={x + 1} y={h - totalH} width={barW} height={totalH}
                                    fill="none" stroke="#22c55e" strokeWidth="0.8" rx={2} opacity={0.5} />
                            )}
                            {/* Hour label (every 3h) */}
                            {bar.hour % 4 === 0 && (
                                <text x={x + barW / 2} y={h + 14} textAnchor="middle"
                                    fill="#ffffff30" fontSize="7" fontFamily="DM Sans">
                                    {bar.hour}h
                                </text>
                            )}
                        </g>
                    );
                })}

                {/* "NOW" marker */}
                {bars.map((bar, i) => {
                    if (bar.hour !== currentHour) return null;
                    const x = pad + i * ((w - pad * 2) / bars.length) + barW / 2;
                    return (
                        <g key="now">
                            <line x1={x} x2={x} y1={0} y2={h} stroke="#22c55e" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
                            <text x={x} y={-2} textAnchor="middle" fill="#22c55e" fontSize="7" fontFamily="DM Sans" fontWeight="600">NOW</text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// ─── Radial Gauge ──────────────────────────────────────────────────────────────

function Gauge({ value, max, label, color, size = 90 }: {
    value: number; max: number; label: string; color: string; size?: number;
}) {
    const r = (size - 12) / 2;
    const circ = 2 * Math.PI * r;
    const pct = Math.min(value / max, 1);
    return (
        <div className="flex flex-col items-center gap-1">
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ffffff08" strokeWidth={8} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
                    strokeWidth={8} strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                    style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }} />
            </svg>
            <div className="text-center -mt-1">
                <p className="text-lg font-bold font-display text-white leading-none">{value.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">{label}</p>
            </div>
        </div>
    );
}

// ─── Subject Heatmap ───────────────────────────────────────────────────────────

const SUBJECT_COLORS: Record<string, string> = {
    Calculus: "#7c3aed", Physics: "#2563eb", Chemistry: "#d97706",
    Mathematics: "#059669", Biology: "#db2777", Statistics: "#0891b2", CS: "#dc2626",
};

function SubjectHeat({ data }: { data: { subject: string; active: number; pct: number }[] }) {
    return (
        <div className="space-y-2">
            {data.map(d => (
                <div key={d.subject} className="flex items-center gap-3">
                    <div className="w-20 shrink-0">
                        <p className="text-xs text-slate-300 truncate">{d.subject}</p>
                    </div>
                    <div className="flex-1 h-4 rounded-full overflow-hidden bg-white/4 relative">
                        <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${d.pct}%`, background: SUBJECT_COLORS[d.subject] ?? "#6b7280" }} />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right shrink-0">{d.active}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function LiveUsersPage() {
    const activity = useLearningStore(s => s.activity);

    const nowHour = new Date().getHours();
    const base = baseCountByHour(nowHour);

    const [stats, setStats] = useState<LiveStats>({
        onlineStudents: base.students,
        onlineTutors: base.tutors,
        activeSessions: Math.round(base.tutors * 0.6),
        messagesLastHour: Math.round(base.students * 1.4),
        questionsAnswered: Math.round(base.students * 0.8),
        flashcardsCompleted: Math.round(base.students * 2.1),
    });

    const [pulseEvents, setPulseEvents] = useState<PulseEvent[]>(() =>
        Array.from({ length: 6 }, (_, i) => ({
            ...randomEvent(),
            time: Date.now() - (6 - i) * 18000,
        }))
    );

    const [peakHour, setPeakHour] = useState<string>("8 PM – 10 PM IST");

    // 24h bars — seeded once, jittered by tick
    const [bars24h, setBars24h] = useState<HourBar[]>(() =>
        Array.from({ length: 24 }, (_, h) => {
            const c = baseCountByHour(h);
            return { hour: h, students: jitter(c.students, 0.12), tutors: jitter(c.tutors, 0.12) };
        })
    );

    // Subject active users
    const [subjectData, setSubjectData] = useState(() => {
        const subjects = ["Calculus", "Physics", "Chemistry", "Mathematics", "Biology", "Statistics", "CS"];
        const vals = subjects.map(s => ({ subject: s, raw: Math.floor(Math.random() * 60 + 15) }));
        const max = vals[0].raw;
        return vals.map(v => ({ subject: v.subject, active: v.raw, pct: Math.round((v.raw / max) * 100) }));
    });

    const [uptime, setUptime] = useState(0); // seconds since mount

    // ── Tick: update stats every 5s ──────────────────────────────────────────────
    useEffect(() => {
        const iv = setInterval(() => {
            setStats(s => {
                const b = baseCountByHour(new Date().getHours());
                return {
                    onlineStudents: jitter(b.students),
                    onlineTutors: jitter(b.tutors),
                    activeSessions: Math.max(1, jitter(Math.round(b.tutors * 0.6))),
                    messagesLastHour: jitter(Math.round(b.students * 1.4)),
                    questionsAnswered: jitter(Math.round(b.students * 0.8)),
                    flashcardsCompleted: jitter(Math.round(b.students * 2.1)),
                };
            });
            // Update current hour bar
            setBars24h(prev => prev.map(bar => {
                if (bar.hour !== new Date().getHours()) return bar;
                const c = baseCountByHour(bar.hour);
                return { ...bar, students: jitter(c.students, 0.05), tutors: jitter(c.tutors, 0.05) };
            }));
            // Shuffle subject data slightly
            setSubjectData(prev => {
                const updated = prev.map(d => ({ ...d, active: Math.max(5, jitter(d.active, 0.06)) }));
                const max = Math.max(...updated.map(d => d.active));
                return updated.map(d => ({ ...d, pct: Math.round((d.active / max) * 100) }));
            });
        }, 5000);
        return () => clearInterval(iv);
    }, []);

    // ── Tick: new pulse event every 4–8s ──────────────────────────────────────────
    useEffect(() => {
        const scheduleNext = () => {
            const delay = 4000 + Math.random() * 4000;
            return setTimeout(() => {
                setPulseEvents(prev => [randomEvent(), ...prev].slice(0, 14));
                scheduleNext();
            }, delay);
        };
        const t = scheduleNext();
        return () => clearTimeout(t);
    }, []);

    // ── Uptime counter ─────────────────────────────────────────────────────────────
    useEffect(() => {
        const iv = setInterval(() => setUptime(s => s + 1), 1000);
        return () => clearInterval(iv);
    }, []);

    const totalOnline = stats.onlineStudents + stats.onlineTutors;
    const uptimeStr = `${String(Math.floor(uptime / 3600)).padStart(2, "0")}:${String(Math.floor((uptime % 3600) / 60)).padStart(2, "0")}:${String(uptime % 60).padStart(2, "0")}`;

    const typeColor: Record<string, string> = {
        student: "#22c55e", tutor: "#a78bfa", session: "#38bdf8", milestone: "#fbbf24",
    };

    const nowH = new Date().getHours();
    const nowLabel = `${nowH % 12 || 12}:${String(new Date().getMinutes()).padStart(2, "0")} ${nowH >= 12 ? "PM" : "AM"}`;

    return (
        <StudentLayout>
            {/* Custom dark green/slate bg — different from all previous pages */}
            <div className="-m-6 min-h-screen" style={{
                background: "linear-gradient(140deg, #080d0e 0%, #091610 50%, #060d14 100%)"
            }}>
                <div className="p-6">

                    {/* ── Header ─────────────────────────────────────────────────── */}
                    <div className="flex items-start justify-between mb-8 gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                    style={{ background: "linear-gradient(135deg, #16a34a, #0891b2)" }}>
                                    <Globe size={22} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-display font-bold text-white">Platform Live Feed</h1>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <PulseDot color="#22c55e" />
                                        <span className="text-xs text-emerald-400 font-medium">
                                            {totalOnline.toLocaleString()} users online right now
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Live clock */}
                        <div className="rounded-2xl border border-white/8 px-4 py-2 text-right shrink-0"
                            style={{ background: "rgba(22,163,74,0.06)" }}>
                            <p className="text-white font-mono font-bold text-lg leading-tight">{nowLabel}</p>
                            <p className="text-[10px] text-slate-500">Session uptime: <span className="text-emerald-400 font-mono">{uptimeStr}</span></p>
                        </div>
                    </div>

                    {/* ── Big 3 Gauges ──────────────────────────────────────────── */}
                    <div className="rounded-3xl border border-white/8 p-6 mb-5 flex flex-col sm:flex-row items-center justify-around gap-6"
                        style={{ background: "linear-gradient(135deg, rgba(22,163,74,0.07), rgba(8,145,178,0.05))" }}>
                        <Gauge value={stats.onlineStudents} max={350} label="Students Online" color="#22c55e" size={100} />
                        <div className="hidden sm:block w-px h-20 bg-white/6" />
                        <Gauge value={stats.onlineTutors} max={130} label="Tutors Online" color="#a78bfa" size={100} />
                        <div className="hidden sm:block w-px h-20 bg-white/6" />
                        <Gauge value={stats.activeSessions} max={80} label="Live Sessions" color="#38bdf8" size={100} />
                    </div>

                    {/* ── 6 KPI tiles ────────────────────────────────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                        {[
                            { icon: Users, label: "Total Online", value: totalOnline, color: "#22c55e" },
                            { icon: MessageSquare, label: "Messages / hr", value: stats.messagesLastHour, color: "#38bdf8" },
                            { icon: BookOpen, label: "Questions Answered", value: stats.questionsAnswered, color: "#a78bfa" },
                            { icon: Zap, label: "Flashcards Done", value: stats.flashcardsCompleted, color: "#f59e0b" },
                            { icon: Video, label: "Active Sessions", value: stats.activeSessions, color: "#f472b6" },
                            { icon: TrendingUp, label: "Student : Tutor Ratio", value: `${Math.round(stats.onlineStudents / Math.max(stats.onlineTutors, 1))}:1`, color: "#34d399", raw: true },
                        ].map(k => (
                            <div key={k.label}
                                className="rounded-2xl border border-white/8 p-4 transition-all hover:border-white/15"
                                style={{ background: `${k.color}08` }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <k.icon size={15} style={{ color: k.color }} />
                                    <p className="text-[11px] text-slate-400">{k.label}</p>
                                </div>
                                <p className="text-2xl font-bold font-display text-white">
                                    {(k as { raw?: boolean }).raw
                                        ? k.value
                                        : <AnimCount value={k.value as number} />}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* ── Main Grid: Activity Chart + Live Feed ─────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

                        {/* Activity Chart — 2/3 width */}
                        <div className="lg:col-span-2 rounded-3xl border border-white/8 p-5"
                            style={{ background: "linear-gradient(135deg, rgba(22,163,74,0.05), rgba(8,145,178,0.04))" }}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="font-display font-semibold text-white">24-Hour Activity Pattern</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Updates every 5s · Green = students · Purple = tutors</p>
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Students</span>
                                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />Tutors</span>
                                </div>
                            </div>
                            <ActivityChart bars={bars24h} currentHour={nowHour} />

                            {/* Peak hour + insight */}
                            <div className="mt-4 flex flex-wrap gap-3">
                                <div className="flex-1 rounded-xl border border-white/6 p-3 min-w-[140px]"
                                    style={{ background: "rgba(251,191,36,0.05)" }}>
                                    <p className="text-[10px] text-amber-400 font-semibold mb-0.5 flex items-center gap-1">
                                        <Flame size={10} /> Peak Activity Window
                                    </p>
                                    <p className="text-sm text-white font-medium">{peakHour}</p>
                                </div>
                                <div className="flex-1 rounded-xl border border-white/6 p-3 min-w-[140px]"
                                    style={{ background: "rgba(34,197,94,0.05)" }}>
                                    <p className="text-[10px] text-emerald-400 font-semibold mb-0.5 flex items-center gap-1">
                                        <Clock size={10} /> Current Load
                                    </p>
                                    <p className="text-sm text-white font-medium">
                                        {nowHour >= 17 && nowHour <= 22 ? "🔥 Peak hours" :
                                            nowHour >= 9 && nowHour < 17 ? "📈 Busy" :
                                                nowHour >= 6 && nowHour < 9 ? "⬆️ Rising" : "🌙 Low traffic"}
                                    </p>
                                </div>
                                <div className="flex-1 rounded-xl border border-white/6 p-3 min-w-[140px]"
                                    style={{ background: "rgba(167,139,250,0.05)" }}>
                                    <p className="text-[10px] text-violet-400 font-semibold mb-0.5 flex items-center gap-1">
                                        <Star size={10} /> Tutor Availability
                                    </p>
                                    <p className="text-sm text-white font-medium">
                                        {stats.onlineTutors} / {Math.round(stats.onlineTutors * 1.6)} available
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Live Pulse Feed — 1/3 width */}
                        <div className="rounded-3xl border border-white/8 p-5 flex flex-col"
                            style={{ background: "linear-gradient(135deg, rgba(8,145,178,0.05), rgba(22,163,74,0.04))" }}>
                            <div className="flex items-center gap-2 mb-4">
                                <Activity size={16} className="text-emerald-400" />
                                <p className="font-display font-semibold text-white">Live Feed</p>
                                <PulseDot color="#22c55e" size={6} />
                            </div>
                            <div className="flex-1 space-y-2 overflow-y-auto max-h-80 pr-1">
                                {pulseEvents.map((ev, i) => {
                                    const age = Date.now() - ev.time;
                                    const isNew = age < 6000;
                                    return (
                                        <div key={ev.id}
                                            className={cn("flex items-start gap-2 p-2.5 rounded-xl border transition-all duration-500",
                                                isNew ? "border-emerald-500/20 bg-emerald-500/4" : "border-white/5 bg-white/2")}
                                            style={{ opacity: Math.max(0.4, 1 - i * 0.05) }}>
                                            <span className="text-base shrink-0 leading-none mt-0.5">{ev.emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] text-slate-300 leading-tight">{ev.text}</p>
                                                <p className="text-[9px] mt-0.5" style={{ color: typeColor[ev.type] }}>
                                                    {age < 10000 ? "Just now" : age < 60000 ? `${Math.floor(age / 1000)}s ago` : `${Math.floor(age / 60000)}m ago`}
                                                </p>
                                            </div>
                                            {isNew && <PulseDot color={typeColor[ev.type]} size={5} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom Grid: Subject Heat + Real Activity ──────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                        {/* Subject Activity Heatmap */}
                        <div className="rounded-3xl border border-white/8 p-5"
                            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.05), rgba(22,163,74,0.04))" }}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="font-display font-semibold text-white">Subject Activity</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Active learners per topic right now</p>
                                </div>
                                <PulseDot color="#a78bfa" size={6} />
                            </div>
                            <SubjectHeat data={subjectData} />
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-[10px] text-slate-500">
                                    🔥 Hottest right now:{" "}
                                    <span className="text-white font-medium">
                                        {subjectData.sort((a, b) => b.active - a.active)[0]?.subject}
                                    </span>
                                    {" "}· {subjectData[0]?.active} active learners
                                </p>
                            </div>
                        </div>

                        {/* Your recent activity + global compare */}
                        <div className="rounded-3xl border border-white/8 p-5"
                            style={{ background: "linear-gradient(135deg, rgba(8,145,178,0.05), rgba(124,58,237,0.04))" }}>
                            <div className="flex items-center gap-2 mb-4">
                                <GraduationCap size={16} className="text-sky-400" />
                                <p className="font-display font-semibold text-white">Your Activity vs Platform</p>
                            </div>

                            {/* Compare rows */}
                            {[
                                {
                                    label: "Sessions done",
                                    you: useLearningStore.getState().totalSessions,
                                    platform: stats.activeSessions,
                                    unit: "sessions",
                                    color: "#38bdf8",
                                },
                                {
                                    label: "Topics practiced",
                                    you: useLearningStore.getState().topics.filter(t => t.flashcardSessions > 0).length,
                                    platform: Math.round(stats.flashcardsCompleted / 10),
                                    unit: "topics",
                                    color: "#a78bfa",
                                },
                                {
                                    label: "Avg topic accuracy",
                                    you: Math.round(useLearningStore.getState().topics.reduce((a, t) => a + t.accuracy, 0) / useLearningStore.getState().topics.length),
                                    platform: 67,
                                    unit: "%",
                                    color: "#22c55e",
                                },
                            ].map(row => {
                                const youPct = Math.min(100, (row.you / Math.max(row.platform, row.you, 1)) * 100);
                                const platPct = Math.min(100, (row.platform / Math.max(row.platform, row.you, 1)) * 100);
                                return (
                                    <div key={row.label} className="mb-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs text-slate-400">{row.label}</p>
                                            <p className="text-[10px] text-slate-500">
                                                You: <span className="font-semibold text-white">{row.you}{row.unit === "%" ? "%" : ""}</span>
                                                {" · "}Platform avg: <span className="text-slate-300">{row.platform}{row.unit === "%" ? "%" : ""}</span>
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-slate-500 w-12 shrink-0">You</span>
                                                <div className="flex-1 h-2 bg-white/4 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-700"
                                                        style={{ width: `${youPct}%`, background: row.color }} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-slate-500 w-12 shrink-0">Platform</span>
                                                <div className="flex-1 h-2 bg-white/4 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full transition-all duration-700 bg-white/20"
                                                        style={{ width: `${platPct}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Your recent activity from store */}
                            <div className="pt-3 border-t border-white/5">
                                <p className="text-[10px] text-slate-500 mb-2">↑ Your last action on platform</p>
                                {activity[0] ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{activity[0].emoji}</span>
                                        <p className="text-xs text-slate-300">{activity[0].action}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600">No activity yet — complete a session!</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Footer note ───────────────────────────────────────────── */}
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <PulseDot color="#22c55e" size={5} />
                        <p className="text-[10px] text-slate-600">
                            All metrics refresh every 5 seconds · New activity events appear in real time · Data simulated from platform usage patterns
                        </p>
                    </div>

                </div>
            </div>
        </StudentLayout>
    );
}
