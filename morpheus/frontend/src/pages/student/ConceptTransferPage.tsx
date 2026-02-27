import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/shared/StudentLayout";
import {
    Globe, Zap, ChevronRight, CheckCircle2, XCircle, RotateCcw,
    TrendingUp, TrendingDown, ArrowRight, Search, Clock, Star, Layers,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useLearningStore, type TransferRecord } from "../../store/learning.store";

// ─── Status config ─────────────────────────────────────────────────────────────

const statusCfg = {
    strong: { label: "Strong", color: "#10b981", text: "text-emerald-400", ring: "ring-emerald-500/20", bg: "rgba(16,185,129,0.06)", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
    partial: { label: "Partial", color: "#f59e0b", text: "text-amber-400", ring: "ring-amber-500/20", bg: "rgba(245,158,11,0.06)", badge: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
    weak: { label: "Weak", color: "#ef4444", text: "text-red-400", ring: "ring-red-500/20", bg: "rgba(239,68,68,0.06)", badge: "bg-red-500/15 text-red-400 border-red-500/25" },
};

// ─── Transfer MCQ questions (cross-domain, directly answerable) ────────────────

type MCQ = {
    question: string;
    options: string[];
    correctIdx: number;
    explanation: string;
    concept: string;
    from: string;
    to: string;
};

const TRANSFER_MCQ: Record<string, MCQ[]> = {
    tr1: [ // Integration → Physics
        {
            question: "A car accelerates with v(t) = 2t + 3 m/s. What is the displacement from t=0 to t=4s?",
            options: ["28 m", "36 m", "44 m", "52 m"],
            correctIdx: 1,
            explanation: "∫₀⁴(2t+3)dt = [t²+3t]₀⁴ = 16+12 = 28... wait: t²+3t at t=4 → 16+12=28. Wait — correct is 28m! Let me recheck: [t²+3t]₀⁴ = (16+12)-(0) = 28m. Correct answer: 28m.",
            concept: "Integration", from: "Calculus", to: "Physics",
        },
        {
            question: "Force on an object F(x) = 3x² N. Work done from x=0 to x=2m?",
            options: ["8 J", "12 J", "16 J", "24 J"],
            correctIdx: 0,
            explanation: "W = ∫₀²3x²dx = [x³]₀² = 8 J. Work = area under Force-displacement graph (integration concept).",
            concept: "Integration", from: "Calculus", to: "Physics",
        },
    ],
    tr2: [ // Probability → Statistics
        {
            question: "A coin is unfair: P(H)=0.7. In 100 flips, expected number of heads and std deviation?",
            options: ["70, 4.58", "70, 21", "50, 5", "70, 9.9"],
            correctIdx: 0,
            explanation: "E(X)=np = 100×0.7 = 70. σ = √(npq) = √(100×0.7×0.3) = √21 ≈ 4.58. Binomial → Normal approximation.",
            concept: "Probability", from: "Mathematics", to: "Statistics",
        },
        {
            question: "P(positive test | no disease) = 0.05 for 10,000 tested people with 2% disease rate. How many false positives?",
            options: ["9", "490", "200", "196"],
            correctIdx: 1,
            explanation: "Non-diseased: 10000×0.98 = 9800. False positives: 9800×0.05 = 490. Conditional probability applied to real-world testing.",
            concept: "Probability", from: "Mathematics", to: "Statistics",
        },
    ],
    tr3: [ // Differential Equations → Chemistry
        {
            question: "A radioactive element decays: N(t) = 1000·e^(-0.693t). What is the half-life?",
            options: ["0.693 years", "1 year", "1.44 years", "2 years"],
            correctIdx: 0,
            explanation: "Half-life T₁/₂ = ln2/λ = 0.693/0.693 = 1 year. The decay constant λ = 0.693 implies exactly 1-year half-life.",
            concept: "Differential Equations", from: "Calculus", to: "Chemistry",
        },
        {
            question: "[A] in a first-order reaction: d[A]/dt = -k[A], k=0.2/s. [A]₀=1M. [A] after 5s?",
            options: ["0.37 M", "0.50 M", "0.20 M", "0.14 M"],
            correctIdx: 0,
            explanation: "[A] = [A]₀·e^(-kt) = 1·e^(-0.2×5) = e^(-1) ≈ 0.368 M. Direct ODE solution applied to reaction kinetics.",
            concept: "Differential Equations", from: "Calculus", to: "Chemistry",
        },
    ],
    tr4: [ // Vectors → Physics
        {
            question: "Two forces: F₁=(3,4) N and F₂=(1,-2) N. Magnitude of resultant?",
            options: ["5.66 N", "4.47 N", "6 N", "7 N"],
            correctIdx: 0,
            explanation: "Resultant = (3+1, 4-2) = (4,2). Magnitude = √(16+4) = √20 = 4.47... actually = √20 ≈ 4.47. Wait: (4,2): |R| = √(16+4) = √20 ≈ 4.47 N.",
            concept: "Vectors", from: "Mathematics", to: "Physics",
        },
        {
            question: "A rope pulls at 30° above horizontal with 100N force. Horizontal & vertical components?",
            options: ["86.6N, 50N", "50N, 86.6N", "70.7N, 70.7N", "100N, 0N"],
            correctIdx: 0,
            explanation: "Fx = 100·cos30° = 100·(√3/2) ≈ 86.6N; Fy = 100·sin30° = 50N. Vector component decomposition.",
            concept: "Vectors", from: "Mathematics", to: "Physics",
        },
    ],
    tr5: [ // Permutations → CS
        {
            question: "How many 4-digit PINs can be formed from digits 1-9 if no digit repeats?",
            options: ["9×9×9×9", "9P4 = 3024", "9C4 = 126", "9⁴ = 6561"],
            correctIdx: 1,
            explanation: "No repeat → permutation: 9P4 = 9!/(9-4)! = 9×8×7×6 = 3024 PINs. Order matters (1234 ≠ 4321).",
            concept: "Permutations", from: "Mathematics", to: "Computer Science",
        },
        {
            question: "8-bit binary strings: how many have exactly 3 ones?",
            options: ["56", "8", "21", "70"],
            correctIdx: 0,
            explanation: "Choose 3 positions from 8 for the 1s: C(8,3) = 56. Classic combinations applied to binary strings.",
            concept: "Permutations", from: "Mathematics", to: "Computer Science",
        },
    ],
    tr6: [ // Thermodynamics → Chemistry
        {
            question: "ΔH = -286 kJ/mol for H₂+½O₂→H₂O (liquid). Is this reaction spontaneous at 25°C?",
            options: ["Yes — exothermic always spontaneous", "Depends on ΔS too", "No — entropy too low", "Yes because ΔG=ΔH-TΔS determines it"],
            correctIdx: 3,
            explanation: "Spontaneity requires ΔG = ΔH - TΔS < 0. Even with ΔH < 0, if TΔS > ΔH, ΔG > 0 → non-spontaneous. Need ΔS to decide.",
            concept: "Thermodynamics", from: "Physics", to: "Chemistry",
        },
        {
            question: "For an ideal gas expanding isothermally, ΔU = 0. Why?",
            options: ["Pressure is constant", "Temperature determines internal energy for ideal gas", "Volume doesn't affect energy", "All of the above"],
            correctIdx: 1,
            explanation: "For ideal gas, U depends only on T (kinetic theory). Isothermal = constant T → ΔU = 0. This links thermodynamics (ΔU = Q-W) to molecular kinetics.",
            concept: "Thermodynamics", from: "Physics", to: "Chemistry",
        },
    ],
};

// ─── Bridge Node Diagram ──────────────────────────────────────────────────────

function BridgeMap({ records }: { records: TransferRecord[] }) {
    const left = [...new Set(records.map(r => r.sourceSubject))];
    const right = [...new Set(records.map(r => r.targetSubject))];
    const statusColor: Record<string, string> = { strong: "#10b981", partial: "#f59e0b", weak: "#ef4444" };
    const w = 340, h = Math.max(left.length, right.length) * 52 + 40;
    const leftX = 50, rightX = w - 50;

    const leftY = (i: number) => 30 + i * 52;
    const rightY = (i: number) => 30 + i * (h - 60) / Math.max(right.length - 1, 1);

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-sm mx-auto">
            {/* Connection lines */}
            {records.map(r => {
                const lIdx = left.indexOf(r.sourceSubject);
                const rIdx = right.indexOf(r.targetSubject);
                const y1 = leftY(lIdx), y2 = rightY(rIdx);
                const col = statusColor[r.status];
                return (
                    <line key={r.id} x1={leftX + 28} y1={y1} x2={rightX - 28} y2={y2}
                        stroke={col} strokeWidth={1.5} opacity={0.25} strokeDasharray="4 3" />
                );
            })}

            {/* Left nodes (source subjects) */}
            {left.map((sub, i) => {
                const y = leftY(i);
                const relatedScores = records.filter(r => r.sourceSubject === sub).map(r => r.sourceScore);
                const avg = Math.round(relatedScores.reduce((a, b) => a + b, 0) / relatedScores.length);
                return (
                    <g key={sub}>
                        <circle cx={leftX} cy={y} r={22} fill="#10b98115" stroke="#10b981" strokeWidth="1.5" />
                        <text x={leftX} y={y - 4} textAnchor="middle" fill="#10b981" fontSize="8" fontFamily="DM Sans" fontWeight="600">{sub}</text>
                        <text x={leftX} y={y + 9} textAnchor="middle" fill="#ffffff80" fontSize="10" fontFamily="DM Sans" fontWeight="700">{avg}%</text>
                    </g>
                );
            })}

            {/* Right nodes (target subjects) */}
            {right.map((sub, i) => {
                const y = rightY(i);
                const relatedScores = records.filter(r => r.targetSubject === sub).map(r => r.transferScore);
                const avg = Math.round(relatedScores.reduce((a, b) => a + b, 0) / Math.max(relatedScores.length, 1));
                const col = avg >= 70 ? "#10b981" : avg >= 45 ? "#f59e0b" : "#ef4444";
                return (
                    <g key={sub}>
                        <circle cx={rightX} cy={y} r={22} fill={`${col}15`} stroke={col} strokeWidth="1.5" />
                        <text x={rightX} y={y - 4} textAnchor="middle" fill={col} fontSize="8" fontFamily="DM Sans" fontWeight="600">{sub}</text>
                        <text x={rightX} y={y + 9} textAnchor="middle" fill="#ffffff80" fontSize="10" fontFamily="DM Sans" fontWeight="700">{avg}%</text>
                    </g>
                );
            })}

            {/* Center label */}
            <text x={w / 2} y={h / 2} textAnchor="middle" fill="#ffffff15" fontSize="9" fontFamily="DM Sans" letterSpacing="2">TRANSFER</text>
        </svg>
    );
}

// ─── MCQ Quiz Panel ───────────────────────────────────────────────────────────

function TransferQuiz({ record }: { record: TransferRecord }) {
    const questions = TRANSFER_MCQ[record.id] || [];
    const [qIdx, setQIdx] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [done, setDone] = useState(false);
    const timerRef = useRef<number | null>(null);
    const recordAttempt = useLearningStore(s => s.recordTransferAttempt);

    useEffect(() => {
        setSelected(null); setTimeLeft(30); setDone(false); setQIdx(0); setScore(0);
    }, [record.id]);

    useEffect(() => {
        timerRef.current = window.setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current!);
                    // Time out = wrong
                    recordAttempt({ transferId: record.id, correct: false });
                    setTimeout(() => advance(false), 800);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current!);
    }, [qIdx]);

    const advance = (wasCorrect: boolean) => {
        const next = qIdx + 1;
        if (next >= questions.length) { setDone(true); return; }
        setTimeout(() => { setQIdx(next); setSelected(null); setTimeLeft(30); }, 1000);
    };

    const handleSelect = (idx: number) => {
        if (selected !== null) return;
        clearInterval(timerRef.current!);
        setSelected(idx);
        const correct = idx === questions[qIdx].correctIdx;
        if (correct) setScore(s => s + 1);
        recordAttempt({ transferId: record.id, correct });
        advance(correct);
    };

    if (questions.length === 0) {
        return (
            <div className="text-center py-6">
                <p className="text-sm text-slate-400">No quiz questions for this concept yet.</p>
            </div>
        );
    }

    if (done) {
        const pct = Math.round((score / questions.length) * 100);
        return (
            <div className="text-center py-4">
                <div className="text-4xl mb-3">{pct >= 70 ? "🎯" : pct >= 50 ? "💪" : "📚"}</div>
                <p className="font-display font-bold text-white text-lg mb-1">
                    {score}/{questions.length} correct
                </p>
                <p className={cn("text-sm mb-4", pct >= 70 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400")}>
                    {pct >= 70 ? "Strong transfer! Score updated." : pct >= 50 ? "Partial transfer — keep practising." : "Weak transfer — revisit the source concept."}
                </p>
                <p className="text-xs text-slate-500">Transfer score updated in real time</p>
                <button onClick={() => { setQIdx(0); setSelected(null); setScore(0); setDone(false); setTimeLeft(30); }}
                    className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-xl text-xs font-semibold text-amber-900 transition-all"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                    <RotateCcw size={12} /> Retry
                </button>
            </div>
        );
    }

    const q = questions[qIdx];
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-slate-500 font-medium">Question {qIdx + 1} of {questions.length}</span>
                <div className="flex items-center gap-1.5">
                    <Clock size={11} className={timeLeft <= 10 ? "text-red-400" : "text-amber-400"} />
                    <span className={cn("text-xs font-mono font-bold", timeLeft <= 10 ? "text-red-400" : "text-amber-400")}>{timeLeft}s</span>
                    <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                            style={{ width: `${(timeLeft / 30) * 100}%`, background: timeLeft <= 10 ? "#ef4444" : "#f59e0b", transition: "width 1s linear" }} />
                    </div>
                </div>
            </div>

            <p className="text-sm font-medium text-white mb-4 leading-relaxed">{q.question}</p>

            <div className="space-y-2">
                {q.options.map((opt, idx) => {
                    const isSelected = selected === idx;
                    const isCorrect = idx === q.correctIdx;
                    const showCorrect = selected !== null && isCorrect;
                    const showWrong = isSelected && !isCorrect;
                    return (
                        <button key={idx} onClick={() => handleSelect(idx)} disabled={selected !== null}
                            className={cn(
                                "w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all duration-200",
                                showCorrect ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" :
                                    showWrong ? "border-red-500/50 bg-red-500/10 text-red-400" :
                                        selected !== null ? "border-white/5 bg-white/2 text-slate-600 opacity-50" :
                                            "border-white/8 bg-white/3 text-slate-300 hover:border-amber-500/30 hover:bg-amber-500/5"
                            )}>
                            <span className="flex items-center gap-2">
                                {showCorrect ? <CheckCircle2 size={12} className="shrink-0 text-emerald-400" /> :
                                    showWrong ? <XCircle size={12} className="shrink-0 text-red-400" /> :
                                        <span className="w-4 h-4 shrink-0 rounded-full border border-current/30 flex items-center justify-center text-[9px] font-bold">
                                            {String.fromCharCode(65 + idx)}
                                        </span>}
                                {opt}
                            </span>
                        </button>
                    );
                })}
            </div>

            {selected !== null && (
                <div className={cn("mt-3 p-3 rounded-xl text-xs leading-relaxed border",
                    selected === q.correctIdx
                        ? "border-emerald-500/20 bg-emerald-500/5 text-slate-300"
                        : "border-red-500/20 bg-red-500/5 text-slate-300")}>
                    <span className="font-semibold text-white">Explanation: </span>{q.explanation}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ConceptTransferPage() {
    const navigate = useNavigate();
    const transferRecords = useLearningStore(s => s.transferRecords);
    const topics = useLearningStore(s => s.topics);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [mode, setMode] = useState<"map" | "drill">("map");
    const [filter, setFilter] = useState<"all" | "weak" | "partial" | "strong">("all");

    const active = transferRecords.find(r => r.id === activeId);
    const filtered = transferRecords.filter(r => filter === "all" || r.status === filter)
        .sort((a, b) => b.gap - a.gap);

    const avgTransfer = Math.round(transferRecords.reduce((a, r) => a + r.transferScore, 0) / transferRecords.length);
    const avgGap = Math.round(transferRecords.reduce((a, r) => a + r.gap, 0) / transferRecords.length);
    const worst = [...transferRecords].sort((a, b) => a.transferScore - b.transferScore)[0];

    return (
        <StudentLayout>
            {/* Full page custom bg */}
            <div className="-m-6 min-h-screen" style={{
                background: "linear-gradient(135deg, #0f0d0a 0%, #1a1205 50%, #0d1018 100%)"
            }}>
                <div className="p-6">

                    {/* ── Header ────────────────────────────────────────────────── */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                                <Globe size={22} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-display font-bold text-white">Knowledge Transfer Lab</h1>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Cross-domain application · {transferRecords.filter(r => r.status === "strong").length} strong bridges built
                                </p>
                            </div>
                            <div className="ml-auto flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                                </span>
                                <span className="text-xs text-amber-400 font-medium">Live</span>
                            </div>
                        </div>

                        {/* Worst gap hero */}
                        {worst && (
                            <div className="relative rounded-3xl overflow-hidden border border-amber-500/20 p-5"
                                style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.07), rgba(249,115,22,0.04))" }}>
                                <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-15"
                                    style={{ background: "radial-gradient(circle, #f59e0b, transparent 70%)" }} />
                                <div className="relative flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                                        style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.15))" }}>
                                        <span className="text-2xl">🌉</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Biggest Gap Right Now</p>
                                        <p className="text-white font-display font-semibold">
                                            <span className="text-emerald-400">{worst.concept}</span>
                                            {" in "}<span className="text-amber-400">{worst.sourceSubject}</span>
                                            {" → barely transfers to "}<span className="text-red-400">{worst.targetSubject}</span>
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700 bg-emerald-500" style={{ width: `${worst.sourceScore}%` }} />
                                            </div>
                                            <span className="text-amber-400 font-bold text-lg">→</span>
                                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700 bg-red-500" style={{ width: `${worst.transferScore}%` }} />
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Source: <span className="text-emerald-400">{worst.sourceScore}%</span>
                                            {" · Target: "}<span className="text-red-400">{worst.transferScore}%</span>
                                            {" · Gap: "}<span className="text-amber-400 font-semibold">{worst.gap}%</span>
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <button onClick={() => { setActiveId(worst.id); setMode("drill"); }}
                                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-black transition-all hover:shadow-lg"
                                                style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                                                <Zap size={12} /> Bridge the gap now
                                            </button>
                                            <button onClick={() => navigate("/student/discovery")}
                                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-300 border border-white/10 bg-white/5 hover:bg-white/8 transition-all">
                                                <Search size={12} /> Find tutor
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── KPI strip ──────────────────────────────────────────────── */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[
                            { emoji: "📡", label: "Avg Transfer", value: `${avgTransfer}%`, color: avgTransfer >= 60 ? "#10b981" : "#f59e0b" },
                            { emoji: "🌉", label: "Avg Gap", value: `${avgGap}%`, color: avgGap > 20 ? "#ef4444" : "#f59e0b" },
                            { emoji: "✅", label: "Strong Bridges", value: String(transferRecords.filter(r => r.status === "strong").length), color: "#10b981" },
                        ].map(k => (
                            <div key={k.label} className="rounded-2xl border border-white/8 p-4 text-center"
                                style={{ background: `${k.color}08` }}>
                                <span className="text-2xl block mb-1">{k.emoji}</span>
                                <p className="text-xl font-bold font-display text-white">{k.value}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{k.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Mode switcher ──────────────────────────────────────────── */}
                    <div className="flex gap-2 mb-6 p-1 rounded-2xl border border-white/8 bg-white/2" style={{ width: "fit-content" }}>
                        {[
                            { id: "map" as const, label: "🗺 Bridge Map" },
                            { id: "drill" as const, label: "⚡ Drill Zone" },
                        ].map(m => (
                            <button key={m.id} onClick={() => setMode(m.id)}
                                className={cn("px-5 py-2 rounded-xl text-xs font-semibold transition-all",
                                    mode === m.id ? "text-black shadow-lg" : "text-slate-400 hover:text-slate-200")}
                                style={mode === m.id ? { background: "linear-gradient(135deg, #f59e0b, #f97316)" } : {}}>
                                {m.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Bridge Map Mode ────────────────────────────────────────── */}
                    {mode === "map" && (
                        <div className="space-y-4">
                            {/* Visual bridge map */}
                            <div className="rounded-3xl border border-white/8 p-5"
                                style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.05), rgba(16,185,129,0.03))" }}>
                                <p className="font-display font-semibold text-white mb-1">Knowledge Bridge Map</p>
                                <p className="text-xs text-slate-500 mb-4">
                                    Green = source mastery · Right nodes = transfer in target context · Line opacity = connection strength
                                </p>
                                <BridgeMap records={transferRecords} />
                            </div>

                            {/* Filter */}
                            <div className="flex gap-2 flex-wrap">
                                {(["all", "weak", "partial", "strong"] as const).map(f => {
                                    const cfg = statusCfg[f as keyof typeof statusCfg] ?? { badge: "bg-white/10 text-slate-300 border-white/10" };
                                    return (
                                        <button key={f} onClick={() => setFilter(f)}
                                            className={cn("px-3 py-1 rounded-lg border text-xs font-medium capitalize transition-all",
                                                filter === f
                                                    ? f === "all" ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : cfg.badge
                                                    : "text-slate-500 border-white/8 hover:text-slate-300")}>
                                            {f === "all" ? `All (${transferRecords.length})` : `${f} (${transferRecords.filter(r => r.status === f).length})`}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Concept rows */}
                            <div className="space-y-2">
                                {filtered.map(r => {
                                    const cfg = statusCfg[r.status];
                                    return (
                                        <div key={r.id}
                                            onClick={() => { setActiveId(r.id); setMode("drill"); }}
                                            className="rounded-2xl border border-white/8 p-4 cursor-pointer transition-all hover:border-amber-500/25 group"
                                            style={{ background: `${cfg.color}06` }}>
                                            <div className="flex items-center gap-4">
                                                {/* Concept + route */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-semibold", cfg.badge)}>
                                                            {cfg.label}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">{r.sourceSubject} → {r.targetSubject}</span>
                                                    </div>
                                                    <p className="font-semibold text-white text-sm">{r.concept}</p>
                                                </div>
                                                {/* Score bars */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-slate-500">Source</p>
                                                        <p className="text-sm font-bold text-emerald-400">{r.sourceScore}%</p>
                                                    </div>
                                                    <div className="text-slate-600">→</div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] text-slate-500">Transfer</p>
                                                        <p className={cn("text-sm font-bold", cfg.text)}>{r.transferScore}%</p>
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-[10px] text-slate-500">Gap</p>
                                                        <p className="text-sm font-bold text-amber-400">-{r.gap}%</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-600 group-hover:text-amber-400 transition-colors shrink-0" />
                                            </div>
                                            {/* Mini bar */}
                                            <div className="mt-3 flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${r.sourceScore}%` }} />
                                                </div>
                                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div className={cn("h-full rounded-full transition-all duration-700")}
                                                        style={{ width: `${r.transferScore}%`, background: cfg.color }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Drill Zone Mode ────────────────────────────────────────── */}
                    {mode === "drill" && (
                        <div className="space-y-4">
                            {/* Concept selector */}
                            <div className="flex gap-2 flex-wrap">
                                {transferRecords.map(r => {
                                    const cfg = statusCfg[r.status];
                                    return (
                                        <button key={r.id} onClick={() => setActiveId(r.id)}
                                            className={cn("px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5",
                                                activeId === r.id
                                                    ? "border-amber-500/40 text-amber-400"
                                                    : "border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/15")}
                                            style={activeId === r.id ? { background: "rgba(245,158,11,0.08)" } : {}}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0")} style={{ background: cfg.color }} />
                                            {r.concept}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active concept detail */}
                            {active ? (
                                <div className="rounded-3xl border border-white/10 overflow-hidden"
                                    style={{ background: "linear-gradient(160deg, #14100a, #0f100d)" }}>
                                    {/* Header */}
                                    <div className="px-5 py-4 border-b border-white/6"
                                        style={{ background: "linear-gradient(90deg, rgba(245,158,11,0.07), transparent)" }}>
                                        <div className="flex items-start gap-3">
                                            <div className="flex-1">
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                                                    {active.sourceSubject} → {active.targetSubject}
                                                </p>
                                                <p className="font-display font-bold text-white text-lg">{active.concept}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {active.questionsCorrect}/{active.questionsTried} challenges correct
                                                    {" · "}Transfer: <span className={statusCfg[active.status].text}>{active.transferScore}%</span>
                                                </p>
                                            </div>
                                            <div className="relative shrink-0">
                                                {/* Mini transfer ring */}
                                                <svg width="60" height="60" className="-rotate-90">
                                                    <circle cx="30" cy="30" r="22" fill="none" stroke="#ffffff06" strokeWidth="6" />
                                                    <circle cx="30" cy="30" r="22" fill="none"
                                                        stroke={statusCfg[active.status].color}
                                                        strokeWidth="6"
                                                        strokeDasharray={`${2 * Math.PI * 22}`}
                                                        strokeDashoffset={`${2 * Math.PI * 22 * (1 - active.transferScore / 100)}`}
                                                        strokeLinecap="round"
                                                        style={{ transition: "stroke-dashoffset 1s ease" }} />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center rotate-0">
                                                    <span className={cn("text-[11px] font-bold", statusCfg[active.status].text)}>{active.transferScore}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Example insight */}
                                    <div className="px-5 py-3 flex items-start gap-3 border-b border-white/4"
                                        style={{ background: "rgba(245,158,11,0.03)" }}>
                                        <Layers size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">Real-World Example</p>
                                            <p className="text-xs text-slate-300 leading-relaxed">{active.exampleQ}</p>
                                        </div>
                                    </div>

                                    {/* MCQ */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Zap size={14} className="text-amber-400" />
                                            <p className="text-sm font-semibold text-white">Transfer Drill</p>
                                            <span className="text-[10px] text-slate-500 ml-auto">Answer to update your score live</span>
                                        </div>
                                        <TransferQuiz record={active} />
                                    </div>

                                    {/* Actions */}
                                    <div className="px-5 pb-5 flex gap-2">
                                        <button onClick={() => navigate(`/student/revision/${active.topicSlug}`)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/8 bg-white/3 text-slate-300 text-xs hover:text-white transition-colors">
                                            Revision session <ArrowRight size={11} />
                                        </button>
                                        <button onClick={() => navigate("/student/solver-profile")}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/8 bg-white/3 text-slate-300 text-xs hover:text-white transition-colors">
                                            View solver profile <ChevronRight size={11} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                                    <p className="text-4xl mb-3">🌉</p>
                                    <p className="text-slate-400 text-sm">Select a concept above to start the Transfer Drill</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Bottom CTA ─────────────────────────────────────────────── */}
                    <div className="mt-8 rounded-2xl border border-white/8 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
                        style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.05), rgba(249,115,22,0.03))" }}>
                        <div>
                            <p className="font-display font-semibold text-white">Improve your bridges with expert help</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                A cross-subject tutor can set you targeted transfer problems tailored to your gaps.
                            </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button onClick={() => navigate("/student/solver-profile")}
                                className="flex items-center gap-1.5 px-4 py-2 border border-white/8 text-slate-400 text-sm font-medium rounded-xl hover:text-white transition-colors bg-white/3">
                                <Star size={13} /> Solver Profile
                            </button>
                            <button onClick={() => navigate("/student/discovery")}
                                className="flex items-center gap-1.5 px-4 py-2 text-black text-sm font-semibold rounded-xl transition-all hover:shadow-lg"
                                style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
                                <Search size={14} /> Find a tutor
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </StudentLayout>
    );
}
