import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/shared/StudentLayout";
import { Cpu, Zap, ChevronRight, RotateCcw, CheckCircle2, XCircle, TrendingUp, Clock, Star, Brain, Flame } from "lucide-react";
import { cn } from "../../lib/utils";
import { useLearningStore, type SolverStyle } from "../../store/learning.store";

// ─── Style Config ──────────────────────────────────────────────────────────────

type StyleMeta = {
    id: SolverStyle;
    label: string;
    short: string;
    emoji: string;
    gradient: string;
    ring: string;
    glow: string;
    textColor: string;
    bgColor: string;
    description: string;
};

const STYLES: Record<SolverStyle, StyleMeta> = {
    "concept-builder": {
        id: "concept-builder", label: "Concept Builder", short: "Builder",
        emoji: "🧱", gradient: "from-teal-500 to-cyan-400",
        ring: "#14b8a6", glow: "shadow-teal-500/40", textColor: "text-teal-400", bgColor: "bg-teal-500/10",
        description: "Builds from first principles. Strongest at novel problem types.",
    },
    "pattern-recognizer": {
        id: "pattern-recognizer", label: "Pattern Recognizer", short: "Recognizer",
        emoji: "🔍", gradient: "from-violet-500 to-purple-400",
        ring: "#8b5cf6", glow: "shadow-violet-500/40", textColor: "text-violet-400", bgColor: "bg-violet-500/10",
        description: "Maps questions to templates incredibly fast. Ace at standard exams.",
    },
    "formula-memorizer": {
        id: "formula-memorizer", label: "Formula Memorizer", short: "Memorizer",
        emoji: "📝", gradient: "from-blue-500 to-indigo-400",
        ring: "#3b82f6", glow: "shadow-blue-500/40", textColor: "text-blue-400", bgColor: "bg-blue-500/10",
        description: "Relies on formula recall. Fast in familiar territory.",
    },
    "trial-error": {
        id: "trial-error", label: "Trial & Error", short: "Explorer",
        emoji: "🔁", gradient: "from-orange-500 to-amber-400",
        ring: "#f97316", glow: "shadow-orange-500/40", textColor: "text-orange-400", bgColor: "bg-orange-500/10",
        description: "Persistent explorer. Tries multiple paths before settling.",
    },
};

// ─── Live Challenge Questions ──────────────────────────────────────────────────
// Each challenge question maps the chosen approach to a solver style

type Challenge = {
    id: string;
    question: string;
    context: string;
    options: { label: string; style: SolverStyle; explanation: string }[];
    subject: string;
};

const CHALLENGES: Challenge[] = [
    {
        id: "c1",
        question: "You see: ∫x·eˣ dx. What do you do first?",
        context: "Integration by Parts",
        subject: "Calculus",
        options: [
            { label: "Recall the formula ∫u·dv = uv - ∫v·du immediately", style: "formula-memorizer", explanation: "Formula-first approach — strong recall." },
            { label: "Think: this is a product of two functions — try the product rule concept", style: "concept-builder", explanation: "First principles — asking WHY the method works." },
            { label: "Recognize this as the classic 'IBP pattern' — set u=x, dv=eˣdx", style: "pattern-recognizer", explanation: "Pattern match — seen this before, template applies." },
            { label: "Try splitting differently, sub u=eˣ first, see if it simplifies", style: "trial-error", explanation: "Exploratory — test multiple approaches." },
        ],
    },
    {
        id: "c2",
        question: "P(A) = 0.6, P(B) = 0.5, and they're independent. Find P(A∩B).",
        context: "Probability",
        subject: "Mathematics",
        options: [
            { label: "Multiply directly: P(A∩B) = 0.6 × 0.5 = 0.3", style: "pattern-recognizer", explanation: "Instant pattern match for independence." },
            { label: "Recall the independent events formula: P(A∩B) = P(A)·P(B)", style: "formula-memorizer", explanation: "Formula lookup." },
            { label: "Think: independent means A gives no info about B, so P(A|B) = P(A)", style: "concept-builder", explanation: "Conceptual grounding first." },
            { label: "Draw a Venn diagram first, then try different splits", style: "trial-error", explanation: "Visual exploration." },
        ],
    },
    {
        id: "c3",
        question: "A ball is thrown upward at 20 m/s. Max height?",
        context: "Kinematics",
        subject: "Physics",
        options: [
            { label: "Use v²=u²−2gh → h = u²/2g = 400/20 = 20m", style: "formula-memorizer", explanation: "Formula recall, direct substitution." },
            { label: "Recognize 'max height' → v=0 at top, apply standard kinematics pattern", style: "pattern-recognizer", explanation: "Classic kinematics pattern." },
            { label: "USE energy conservation: ½mv² = mgh → h = v²/2g. Same result, different angle.", style: "concept-builder", explanation: "Cross-concept approach." },
            { label: "Start with SUVAT, try v=u+at, then s=ut+½at², combine them", style: "trial-error", explanation: "Multi-attempt exploration." },
        ],
    },
    {
        id: "c4",
        question: "12 students must form a committee of 4. How many ways if 2 specific students must both be included?",
        context: "Combinations",
        subject: "Mathematics",
        options: [
            { label: "Fix 2 required students, choose 2 more from 10: C(10,2) = 45", style: "pattern-recognizer", explanation: "Recognized the 'fix & choose rest' pattern." },
            { label: "Recall C(n,r) = n!/r!(n-r)! and set up C(12,4) minus exclusions", style: "formula-memorizer", explanation: "Formula-based approach." },
            { label: "Think: 2 slots are pre-filled → reduce problem to C(10,2)", style: "concept-builder", explanation: "Conceptual reduction." },
            { label: "Try total C(12,4) first, subtract cases without both required students", style: "trial-error", explanation: "Complementary counting exploration." },
        ],
    },
    {
        id: "c5",
        question: "Why does a satellite in circular orbit not fall despite gravity?",
        context: "Orbital Mechanics",
        subject: "Physics",
        options: [
            { label: "Gravity provides centripetal force: F=mv²/r → it keeps falling but misses Earth", style: "concept-builder", explanation: "Deep conceptual reasoning." },
            { label: "Recall: orbital velocity formula v = √(GM/r)", style: "formula-memorizer", explanation: "Formula-based answer." },
            { label: "Recognize this as the 'ISS / satellite orbit' standard question — it falls but Earth curves", style: "pattern-recognizer", explanation: "Pattern match to common question type." },
            { label: "Try drawing forces, then think about what balances what step by step", style: "trial-error", explanation: "Diagram-first exploration." },
        ],
    },
];

// ─── Animated Ring SVG ────────────────────────────────────────────────────────

function StyleRing({ value, color, size = 80, strokeWidth = 8 }: {
    value: number; color: string; size?: number; strokeWidth?: number;
}) {
    const radius = (size - strokeWidth * 2) / 2;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (value / 100) * circ;
    return (
        <svg width={size} height={size} className="rotate-[-90deg]">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ffffff0a" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
                strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
    );
}

// ─── DNA Strand Visualization ─────────────────────────────────────────────────

function DNAStrand({ scores }: { scores: { style: SolverStyle; val: number }[] }) {
    const colors: Record<SolverStyle, string> = {
        "concept-builder": "#14b8a6",
        "pattern-recognizer": "#8b5cf6",
        "formula-memorizer": "#3b82f6",
        "trial-error": "#f97316",
    };
    const w = 320, h = 140, segments = 20;
    const points1: string[] = [], points2: string[] = [];
    for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * w;
        const amp = 28;
        const y1 = 70 + amp * Math.sin((i / segments) * Math.PI * 3);
        const y2 = 70 - amp * Math.sin((i / segments) * Math.PI * 3);
        points1.push(`${x},${y1}`);
        points2.push(`${x},${y2}`);
    }
    // Rungs
    const rungs: JSX.Element[] = [];
    for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * w;
        const y1 = 70 + 28 * Math.sin((i / segments) * Math.PI * 3);
        const y2 = 70 - 28 * Math.sin((i / segments) * Math.PI * 3);
        const styleIdx = i % 4;
        const s = scores[styleIdx];
        const opacity = 0.15 + (s.val / 100) * 0.85;
        rungs.push(
            <line key={i} x1={x} y1={y1} x2={x} y2={y2}
                stroke={colors[s.style]} strokeWidth={2.5 + (s.val / 100) * 3}
                strokeLinecap="round" opacity={opacity} />
        );
    }
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-sm mx-auto">
            <polyline points={points1.join(" ")} fill="none" stroke="#14b8a6" strokeWidth="2.5" opacity="0.7" />
            <polyline points={points2.join(" ")} fill="none" stroke="#8b5cf6" strokeWidth="2.5" opacity="0.7" />
            {rungs}
        </svg>
    );
}

// ─── Challenge Card ───────────────────────────────────────────────────────────

function ChallengeCard({
    challenge, index, total,
    onAnswer,
}: {
    challenge: Challenge;
    index: number; total: number;
    onAnswer: (style: SolverStyle, explanation: string) => void;
}) {
    const [selected, setSelected] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [timeLeft, setTimeLeft] = useState(45);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        timerRef.current = window.setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { clearInterval(timerRef.current!); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current!);
    }, []);

    const handleSelect = (idx: number) => {
        if (revealed) return;
        setSelected(idx);
        clearInterval(timerRef.current!);
        setRevealed(true);
        onAnswer(challenge.options[idx].style, challenge.options[idx].explanation);
    };

    const timerColor = timeLeft > 20 ? "text-teal-400" : timeLeft > 10 ? "text-amber-400" : "text-red-400";
    const timerBg = timeLeft > 20 ? "bg-teal-500" : timeLeft > 10 ? "bg-amber-500" : "bg-red-500";

    return (
        <div className="relative">
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-400 font-medium">Challenge {index + 1} of {total}</span>
                <div className="flex items-center gap-2">
                    <Clock size={12} className={timerColor} />
                    <span className={cn("text-sm font-bold font-mono", timerColor)}>{timeLeft}s</span>
                    <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all", timerBg)}
                            style={{ width: `${(timeLeft / 45) * 100}%`, transition: "width 1s linear" }} />
                    </div>
                </div>
            </div>

            {/* Question */}
            <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 font-semibold">{challenge.subject}</span>
                <span className="text-[10px] text-slate-500">{challenge.context}</span>
            </div>
            <p className="text-lg font-display font-semibold text-white mb-5 leading-relaxed">{challenge.question}</p>

            {/* Options */}
            <div className="space-y-2">
                {challenge.options.map((opt, idx) => {
                    const sm = STYLES[opt.style];
                    const isSelected = selected === idx;
                    const showResult = revealed && isSelected;
                    return (
                        <button key={idx} onClick={() => handleSelect(idx)}
                            disabled={revealed}
                            className={cn(
                                "w-full text-left p-3.5 rounded-xl border text-sm transition-all duration-300 flex items-start gap-3",
                                revealed && !isSelected ? "opacity-40" : "",
                                showResult
                                    ? `border-current ${sm.bgColor} ${sm.textColor}`
                                    : !revealed ? "border-white/8 bg-white/3 text-slate-300 hover:border-white/20 hover:bg-white/6" : "border-white/8 bg-white/3 text-slate-400"
                            )}>
                            <span className={cn("w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold",
                                showResult ? `border-current ${sm.bgColor}` : "border-white/20")}>
                                {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="flex-1">{opt.label}</span>
                            {showResult && (
                                <span className="text-xl shrink-0">{sm.emoji}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Reveal */}
            {revealed && selected !== null && (
                <div className={cn("mt-4 rounded-xl p-4 border", STYLES[challenge.options[selected].style].bgColor,
                    `border-${STYLES[challenge.options[selected].style].ring || "teal"}/30`)}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{STYLES[challenge.options[selected].style].emoji}</span>
                        <p className={cn("text-sm font-semibold", STYLES[challenge.options[selected].style].textColor)}>
                            {STYLES[challenge.options[selected].style].label} approach
                        </p>
                    </div>
                    <p className="text-xs text-slate-400">{challenge.options[selected].explanation}</p>
                </div>
            )}
        </div>
    );
}

// ─── Pulse dot ────────────────────────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
    return (
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SolverProfilePage() {
    const navigate = useNavigate();
    const profile = useLearningStore((s) => s.solverProfile);
    const topics = useLearningStore((s) => s.topics);
    const recordFlashcardSession = useLearningStore((s) => s.recordFlashcardSession);

    const [section, setSection] = useState<"profile" | "challenge" | "insights">("profile");
    const [challengeIdx, setChallengeIdx] = useState(0);
    const [challengeComplete, setChallengeComplete] = useState(false);
    const [answers, setAnswers] = useState<{ style: SolverStyle; challenge: string }[]>([]);
    const [sessionStyle, setSessionStyle] = useState<SolverStyle | null>(null);

    const dominant = STYLES[profile.dominantStyle];
    const dnaScores = [
        { style: "concept-builder" as SolverStyle, val: profile.conceptBuilder },
        { style: "pattern-recognizer" as SolverStyle, val: profile.patternRecognizer },
        { style: "formula-memorizer" as SolverStyle, val: profile.formulaMemorizer },
        { style: "trial-error" as SolverStyle, val: profile.trialError },
    ];

    const handleAnswer = (style: SolverStyle, explanation: string) => {
        const newAnswers = [...answers, { style, challenge: explanation }];
        setAnswers(newAnswers);

        // Simulate a flashcard session for a matching topic to update the solver profile
        const styleToSlug: Record<SolverStyle, string> = {
            "concept-builder": "differential-equations",
            "pattern-recognizer": "probability",
            "formula-memorizer": "integration-by-parts",
            "trial-error": "permutations-combinations",
        };
        recordFlashcardSession({
            topicSlug: styleToSlug[style],
            knownCount: style === "concept-builder" || style === "pattern-recognizer" ? 4 : 2,
            totalCount: 5,
            cardResults: [],
        });

        if (challengeIdx < CHALLENGES.length - 1) {
            setTimeout(() => setChallengeIdx(i => i + 1), 1400);
        } else {
            // Tally the session's dominant style
            const tally: Record<SolverStyle, number> = { "trial-error": 0, "formula-memorizer": 0, "concept-builder": 0, "pattern-recognizer": 0 };
            newAnswers.forEach(a => tally[a.style]++);
            const top = (Object.entries(tally) as [SolverStyle, number][]).sort((a, b) => b[1] - a[1])[0][0];
            setSessionStyle(top);
            setTimeout(() => setChallengeComplete(true), 1400);
        }
    };

    const avgAccuracy = Math.round(topics.reduce((a, t) => a + t.accuracy, 0) / topics.length);
    const fragileCount = topics.filter(t => t.stability === "fragile").length;

    return (
        <StudentLayout>
            {/* Page chrome — different dark gradient bg for this page only */}
            <div className="-m-6 min-h-screen" style={{
                background: "linear-gradient(135deg, #0a0f1a 0%, #0c1220 40%, #091218 100%)"
            }}>
                <div className="p-6">

                    {/* ── Header ─────────────────────────────────────────────── */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                    style={{ background: "linear-gradient(135deg, #14b8a6, #8b5cf6)" }}>
                                    <Cpu size={22} className="text-white" />
                                </div>
                                <PulseDot color="#14b8a6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-display font-bold text-white">Cognitive Strategy DNA</h1>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    AI-mapped from {profile.sessionsAnalyzed} sessions · Live-updating
                                </p>
                            </div>
                            <div className="ml-auto hidden sm:flex items-center gap-1.5">
                                <PulseDot color="#14b8a6" />
                                <span className="text-xs text-teal-400 font-medium">Real-time</span>
                            </div>
                        </div>

                        {/* Dominant style hero — glassmorphism panel */}
                        <div className="relative rounded-3xl overflow-hidden border border-white/8 p-6"
                            style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.08), rgba(139,92,246,0.06))" }}>
                            {/* Background glow */}
                            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20"
                                style={{ background: `radial-gradient(circle, ${dominant.ring}, transparent 70%)` }} />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-10"
                                style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }} />

                            <div className="relative flex items-start gap-5">
                                {/* Ring + emoji */}
                                <div className="relative shrink-0">
                                    <StyleRing value={Math.max(dnaScores.map(s => s.val))} color={dominant.ring} size={88} strokeWidth={7} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl">{dominant.emoji}</span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Your dominant cognitive style</p>
                                    <p className={cn("text-xl font-display font-bold", dominant.textColor)}>{dominant.label}</p>
                                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">{profile.insight}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button onClick={() => setSection("challenge")}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white border border-teal-500/30 transition-all hover:shadow-lg"
                                            style={{ background: "linear-gradient(135deg, #14b8a6, #0891b2)" }}>
                                            <Zap size={13} /> Take Cognitive Challenge
                                        </button>
                                        <button onClick={() => navigate("/student/concept-transfer")}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 border border-white/10 bg-white/5 hover:bg-white/8 transition-all">
                                            View Transfer Scores <ChevronRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Section Nav — pill switcher ─────────────────────────── */}
                    <div className="flex gap-2 mb-6 p-1 rounded-2xl border border-white/8 bg-white/2" style={{ width: "fit-content" }}>
                        {(["profile", "challenge", "insights"] as const).map(s => (
                            <button key={s} onClick={() => setSection(s)}
                                className={cn("px-5 py-2 rounded-xl text-xs font-semibold transition-all capitalize",
                                    section === s
                                        ? "text-white shadow-lg"
                                        : "text-slate-400 hover:text-slate-200")}
                                style={section === s ? { background: "linear-gradient(135deg, #14b8a6, #8b5cf6)" } : {}}>
                                {s === "profile" ? "🧬 DNA Profile" : s === "challenge" ? "⚡ Live Challenge" : "💡 Insights"}
                            </button>
                        ))}
                    </div>

                    {/* ── Profile Section ─────────────────────────────────────── */}
                    {section === "profile" && (
                        <div className="space-y-6">
                            {/* DNA Strand */}
                            <div className="rounded-3xl border border-white/8 p-6"
                                style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.05), rgba(139,92,246,0.05))" }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="font-display font-semibold text-white">Cognitive DNA Strand</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Rung thickness = style strength · Reshapes after each challenge</p>
                                    </div>
                                    <PulseDot color="#14b8a6" />
                                </div>
                                <DNAStrand scores={dnaScores} />
                            </div>

                            {/* 4 style rings */}
                            <div className="grid grid-cols-2 gap-3">
                                {dnaScores.map(({ style, val }) => {
                                    const sm = STYLES[style];
                                    const isDominant = style === profile.dominantStyle;
                                    return (
                                        <div key={style}
                                            className={cn("rounded-2xl border p-4 transition-all", sm.bgColor,
                                                isDominant ? "border-white/20 ring-1 ring-white/10" : "border-white/6")}
                                            style={isDominant ? { boxShadow: `0 0 24px ${sm.ring}22` } : {}}>
                                            <div className="flex items-center gap-3">
                                                <div className="relative shrink-0">
                                                    <StyleRing value={val} color={sm.ring} size={52} strokeWidth={5} />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-lg">{sm.emoji}</span>
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className={cn("text-sm font-semibold", sm.textColor)}>{sm.short}</p>
                                                        {isDominant && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-white font-bold">MAIN</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xl font-bold font-display text-white">{val}%</p>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-2 leading-tight">{sm.description}</p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Strengths vs Gaps table */}
                            <div className="rounded-2xl border border-white/8 overflow-hidden">
                                <div className="p-4 border-b border-white/5 flex items-center gap-2"
                                    style={{ background: "linear-gradient(90deg, rgba(20,184,166,0.06), transparent)" }}>
                                    <Brain size={16} className="text-teal-400" />
                                    <p className="font-semibold text-white text-sm">Your Cognitive Fingerprint</p>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-teal-400 font-semibold mb-2 flex items-center gap-1.5">
                                            <CheckCircle2 size={11} /> Cognitive Strengths
                                        </p>
                                        <ul className="space-y-1.5">
                                            {[
                                                profile.patternRecognizer >= 60 && "Fast standard problem solving",
                                                profile.conceptBuilder >= 60 && "Deep understanding of novel problems",
                                                profile.formulaMemorizer >= 60 && "Reliable formula recall under pressure",
                                                profile.trialError >= 60 && "Never gives up on hard problems",
                                            ].filter(Boolean).map((s, i) => (
                                                <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                                                    <span className="text-teal-400 mt-0.5 shrink-0">◆</span>{s as string}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="text-xs text-red-400 font-semibold mb-2 flex items-center gap-1.5">
                                            <XCircle size={11} /> Areas to Develop
                                        </p>
                                        <ul className="space-y-1.5">
                                            {[
                                                profile.conceptBuilder < 50 && "First-principles derivation",
                                                profile.patternRecognizer < 50 && "Pattern recognition speed",
                                                profile.formulaMemorizer < 50 && "Formula-based problem solving",
                                                profile.trialError > 60 && "Structured approach (reduce trial-error)",
                                            ].filter(Boolean).map((s, i) => (
                                                <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                                                    <span className="text-red-400 mt-0.5 shrink-0">◆</span>{s as string}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Live Challenge Section ───────────────────────────────── */}
                    {section === "challenge" && (
                        <div>
                            {!challengeComplete ? (
                                <div className="rounded-3xl border border-white/10 overflow-hidden"
                                    style={{ background: "linear-gradient(160deg, #0c1628, #0a101e)" }}>
                                    {/* Challenge header */}
                                    <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between"
                                        style={{ background: "linear-gradient(90deg, rgba(20,184,166,0.08), rgba(139,92,246,0.05))" }}>
                                        <div>
                                            <p className="font-display font-semibold text-white">Cognitive Style Challenge</p>
                                            <p className="text-xs text-slate-400">Pick HOW you'd approach each problem — no right/wrong answer</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {CHALLENGES.map((_, i) => (
                                                <div key={i} className={cn("w-2 h-2 rounded-full transition-all",
                                                    i < challengeIdx ? "bg-teal-400" : i === challengeIdx ? "bg-violet-400 ring-2 ring-violet-400/30" : "bg-white/10")} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <ChallengeCard
                                            key={challengeIdx}
                                            challenge={CHALLENGES[challengeIdx]}
                                            index={challengeIdx}
                                            total={CHALLENGES.length}
                                            onAnswer={handleAnswer}
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* Results */
                                <div className="rounded-3xl border border-white/10 p-6 text-center"
                                    style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.08), rgba(139,92,246,0.08))" }}>
                                    <div className="text-5xl mb-4">{sessionStyle ? STYLES[sessionStyle].emoji : "🧠"}</div>
                                    <p className="font-display text-2xl font-bold text-white mb-2">Session Complete!</p>
                                    <p className="text-slate-300 mb-1">
                                        This session: mostly <span className={STYLES[sessionStyle ?? "concept-builder"].textColor}>{STYLES[sessionStyle ?? "concept-builder"].label}</span> approach
                                    </p>
                                    <p className="text-xs text-slate-400 mb-6">Your DNA profile has been updated in real time</p>
                                    <div className="flex flex-wrap justify-center gap-3 mb-6">
                                        {answers.map((a, i) => {
                                            const sm = STYLES[a.style];
                                            return (
                                                <div key={i} className={cn("px-3 py-2 rounded-xl border text-xs font-medium", sm.bgColor, "border-white/10", sm.textColor)}>
                                                    Q{i + 1}: {sm.emoji} {sm.short}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button onClick={() => {
                                        setChallengeIdx(0); setChallengeComplete(false);
                                        setAnswers([]); setSessionStyle(null);
                                    }}
                                        className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-white border border-teal-500/30 hover:shadow-lg transition-all"
                                        style={{ background: "linear-gradient(135deg, #14b8a6, #8b5cf6)" }}>
                                        <RotateCcw size={14} /> Retry with new questions
                                    </button>
                                </div>
                            )}

                            {/* Style legend below */}
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {dnaScores.map(({ style, val }) => {
                                    const sm = STYLES[style];
                                    return (
                                        <div key={style} className={cn("rounded-xl border p-3 flex items-center gap-2", sm.bgColor, "border-white/6")}>
                                            <span className="text-base">{sm.emoji}</span>
                                            <div>
                                                <p className={cn("text-[10px] font-semibold", sm.textColor)}>{sm.short}</p>
                                                <p className="text-sm font-bold text-white">{val}%</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Insights Section ─────────────────────────────────────── */}
                    {section === "insights" && (
                        <div className="space-y-4">
                            {/* Score-based insight cards with gradient borders */}
                            {[
                                {
                                    condition: profile.formulaMemorizer > profile.conceptBuilder + 20,
                                    icon: "📝",
                                    title: "Formula Dependence Detected",
                                    body: `Your formula recall (${profile.formulaMemorizer}%) significantly outpaces conceptual building (${profile.conceptBuilder}%). In novel exam problems, formulas won't be enough.`,
                                    action: "Work on concept derivation",
                                    color: "#3b82f6",
                                    route: "/student/weakness-prediction",
                                },
                                {
                                    condition: profile.trialError > 55,
                                    icon: "🔁",
                                    title: "Trial & Error Overuse",
                                    body: `${profile.trialError}% trial-error tendency is high. You're spending extra time exploring rather than applying a structured decision framework.`,
                                    action: "Build structured problem maps",
                                    color: "#f97316",
                                    route: "/student/concept-stability",
                                },
                                {
                                    condition: profile.conceptBuilder >= 60,
                                    icon: "🧱",
                                    title: "Strong Conceptual Foundation",
                                    body: `Concept-building at ${profile.conceptBuilder}% is excellent. Now focus on speed — timed drills will push your exam performance to the next level.`,
                                    action: "Take transfer challenges",
                                    color: "#14b8a6",
                                    route: "/student/concept-transfer",
                                },
                                {
                                    condition: profile.patternRecognizer >= 65,
                                    icon: "🔍",
                                    title: "Elite Pattern Recognition",
                                    body: `${profile.patternRecognizer}% pattern recognition puts you in the top tier for standard exam questions. Edge-case preparation is your next frontier.`,
                                    action: "View weakness predictions",
                                    color: "#8b5cf6",
                                    route: "/student/weakness-prediction",
                                },
                                {
                                    condition: avgAccuracy < 65,
                                    icon: "📊",
                                    title: "Accuracy Needs Attention",
                                    body: `Your overall accuracy is ${avgAccuracy}%. As a ${STYLES[profile.dominantStyle].label}, this usually means your current style needs refinement — targeted practice will help.`,
                                    action: "See concept stability",
                                    color: "#f59e0b",
                                    route: "/student/concept-stability",
                                },
                            ].filter(c => c.condition).map((card, i) => (
                                <div key={i} className="rounded-2xl border border-white/8 p-5 relative overflow-hidden"
                                    style={{ background: `linear-gradient(135deg, ${card.color}09, transparent)` }}>
                                    <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: card.color }} />
                                    <div className="flex items-start gap-3 pl-2">
                                        <span className="text-2xl shrink-0">{card.icon}</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-white mb-1">{card.title}</p>
                                            <p className="text-sm text-slate-400 leading-relaxed">{card.body}</p>
                                            <button onClick={() => navigate(card.route)}
                                                className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
                                                style={{ color: card.color }}>
                                                {card.action} <ChevronRight size={11} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Live data callout */}
                            <div className="rounded-2xl border border-white/8 p-4 flex items-center gap-4"
                                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(20,184,166,0.04))" }}>
                                <Flame size={20} className="text-amber-400 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-white font-medium">
                                        {fragileCount > 0
                                            ? `${fragileCount} fragile topics detected. Your ${STYLES[profile.dominantStyle].short} style means you should tackle them with a ${profile.dominantStyle === "formula-memorizer" ? "derivation-first" : "pattern-mapping"} approach.`
                                            : "All topics are in stable or shaky range. Take the cognitive challenge to keep refining your profile."
                                        }
                                    </p>
                                </div>
                                <Star size={16} className="text-amber-400/50 shrink-0" />
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </StudentLayout>
    );
}
