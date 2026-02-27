import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../../components/shared/StudentLayout";
import {
    ArrowLeft,
    RotateCcw,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Zap,
    Trophy,
    RefreshCcw,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useLearningStore } from "../../store/learning.store";

// ─── Flashcard Data ────────────────────────────────────────────────────────────

const flashcardData: Record<string, { q: string; a: string }[]> = {
    "permutations-combinations": [
        { q: "What is the formula for permutations nPr?", a: "nPr = n! / (n - r)!\n\nThis gives the number of ordered arrangements of r items chosen from n distinct items." },
        { q: "What is the formula for combinations nCr?", a: "nCr = n! / (r! × (n - r)!)\n\nThis gives the number of unordered selections of r items from n distinct items.\n\nAlso written as C(n, r) or ⁿCᵣ" },
        { q: "When do we use permutation vs. combination?", a: "Use Permutation when ORDER MATTERS (e.g., arranging books on a shelf).\n\nUse Combination when ORDER DOESN'T MATTER (e.g., selecting a committee)." },
        { q: "How many ways can 5 people stand in a line?", a: "5! = 5 × 4 × 3 × 2 × 1 = 120 ways\n\nThis is a permutation of all 5 items, nPn = n!" },
        { q: "In how many ways can 3 people be chosen from a group of 8?", a: "8C3 = 8! / (3! × 5!) = (8 × 7 × 6) / (3 × 2 × 1) = 56 ways" },
        { q: "What is 0!?", a: "0! = 1\n\nThis is a convention. It ensures formulas like nPn = n! and nCn = 1 work correctly." },
        { q: "How many 3-letter codes can be formed from A, B, C, D (no repetition)?", a: "4P3 = 4! / (4-3)! = 4! / 1! = 24 codes\n\nWith repetition: 4³ = 64 codes" },
        { q: "What is the number of ways to arrange n items where 'k' are identical?", a: "n! / k!\n\nFor multiple identical groups: n! / (k₁! × k₂! × ... × kₘ!)" },
        { q: "How many ways can 2 co-captains be selected from 10 players?", a: "Since co-captains are equal roles (order doesn't matter):\n10C2 = 45 ways\n\nIf roles were different (captain & vice-captain):\n10P2 = 90 ways" },
        { q: "What is the sum of all combinations nC0 + nC1 + ... + nCn?", a: "The sum equals 2ⁿ\n\nThis comes from the binomial theorem: (1+1)ⁿ = Σ nCr = 2ⁿ" },
    ],
    "electrochemistry": [
        { q: "What is the electrochemical series?", a: "A list of elements arranged in order of their standard electrode potentials (E°) from most negative to most positive.\n\nElements higher up are stronger reducing agents." },
        { q: "State the Nernst equation.", a: "E = E° - (RT/nF) × ln(Q)\n\nAt 25°C: E = E° - (0.0592/n) × log(Q)\n\nWhere n = moles of electrons, Q = reaction quotient" },
        { q: "What is the difference between a galvanic and electrolytic cell?", a: "Galvanic Cell: Chemical energy → electrical energy. Spontaneous.\n\nElectrolytic Cell: Electrical energy → chemical energy. Non-spontaneous." },
        { q: "What is the standard hydrogen electrode (SHE)?", a: "Reference electrode with E° = 0.00 V by convention.\n\nConditions: H⁺ at 1M, H₂ gas at 1 atm, 25°C." },
        { q: "How do you calculate ΔG° from E°cell?", a: "ΔG° = -nFE°cell\n\nIf E°cell > 0, the reaction is spontaneous (ΔG° < 0)" },
    ],
    "rotational-motion": [
        { q: "What is moment of inertia (I)?", a: "I = Σ mᵢrᵢ²\n\nThe rotational analog of mass. Unit: kg·m²" },
        { q: "State the parallel axis theorem.", a: "I = I_cm + Md²\n\nMoment of inertia about any axis = I about parallel axis through CM + Md²" },
        { q: "What is torque (τ) and its formula?", a: "τ = r × F = rF sin(θ)\n\nUnit: N·m\n\nτ = Iα (rotational analog of F = ma)" },
        { q: "What is angular momentum (L)?", a: "L = Iω\n\nConservation: If no external torque, L remains constant." },
        { q: "Moment of inertia of a solid sphere about its diameter?", a: "I = (2/5)MR²\n\nHollow sphere: (2/3)MR²\nDisc about axis: (1/2)MR²\nRing about axis: MR²" },
    ],
    "probability": [
        { q: "State the addition theorem of probability.", a: "P(A ∪ B) = P(A) + P(B) - P(A ∩ B)\n\nFor mutually exclusive events: P(A ∪ B) = P(A) + P(B)" },
        { q: "What is Bayes' theorem?", a: "P(A|B) = P(B|A) × P(A) / P(B)\n\nUpdates probability of A given B has occurred." },
        { q: "Define conditional probability.", a: "P(A|B) = P(A ∩ B) / P(B)\n\nProbability of A given B has occurred. Requires P(B) > 0" },
        { q: "What is the multiplication theorem of probability?", a: "P(A ∩ B) = P(A) × P(B|A)\n\nFor independent events: P(A ∩ B) = P(A) × P(B)" },
        { q: "What is the complement rule?", a: "P(A') = 1 - P(A)\n\nThe probability of an event NOT occurring equals 1 minus the probability it does occur." },
    ],
    "integration-by-parts": [
        { q: "State the integration by parts formula.", a: "∫u dv = uv - ∫v du\n\nChoose u using LIATE: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential" },
        { q: "What is the LIATE rule?", a: "Priority order for choosing u:\n\nL: Logarithms (ln x)\nI: Inverse trig\nA: Algebraic (xⁿ)\nT: Trigonometric\nE: Exponential (eˣ)" },
        { q: "Evaluate ∫x·eˣ dx", a: "Let u = x, dv = eˣ dx → v = eˣ\n\n= x·eˣ - ∫eˣ dx = x·eˣ - eˣ + C = eˣ(x - 1) + C" },
        { q: "Evaluate ∫ln(x) dx", a: "Let u = ln x, dv = dx → du = 1/x dx, v = x\n\n= x·ln(x) - ∫x·(1/x) dx = x·ln(x) - x + C" },
        { q: "When should you use the tabular method?", a: "When the same function returns after repeated differentiation (e.g., ∫x³·eˣ dx).\n\nCreate two columns: differentiate u repeatedly, integrate dv repeatedly." },
    ],
};

const DEFAULT_CARDS = [
    { q: "What is the core concept of this topic?", a: "Review your textbook or ask your tutor for a detailed breakdown." },
    { q: "How does this relate to other subjects?", a: "Look for patterns and connect to what you already know." },
    { q: "What are the most common exam mistakes?", a: "Students often rush. Write out every step clearly during practice." },
];

function getCards(slug: string) {
    return flashcardData[slug] ?? DEFAULT_CARDS;
}

// ─── Flashcard component ───────────────────────────────────────────────────────

function Flashcard({ front, back, flipped, onFlip }: { front: string; back: string; flipped: boolean; onFlip: () => void }) {
    return (
        <div className="relative w-full cursor-pointer" style={{ perspective: 1200 }} onClick={onFlip}>
            <div className="relative w-full transition-transform duration-500"
                style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", minHeight: 260 }}>
                {/* Front */}
                <div className="absolute inset-0 rounded-2xl border border-morpheus-border bg-gradient-to-br from-morpheus-surface to-morpheus-bg p-7 flex flex-col items-center justify-center"
                    style={{ backfaceVisibility: "hidden" }}>
                    <span className="text-xs text-morpheus-muted uppercase tracking-widest mb-5 font-semibold">Question</span>
                    <p className="font-display text-lg sm:text-xl font-semibold text-morpheus-text text-center leading-relaxed">{front}</p>
                    <p className="mt-6 text-xs text-morpheus-muted flex items-center gap-1.5"><RotateCcw size={12} /> Tap to reveal answer</p>
                </div>
                {/* Back */}
                <div className="absolute inset-0 rounded-2xl border border-morpheus-accent/30 bg-gradient-to-br from-morpheus-accent/10 via-morpheus-surface to-morpheus-bg p-7 flex flex-col items-start justify-center"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <span className="text-xs text-morpheus-accent uppercase tracking-widest mb-4 font-semibold">Answer</span>
                    <p className="text-sm sm:text-base text-morpheus-text leading-relaxed whitespace-pre-line">{back}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
    const { topicSlug } = useParams<{ topicSlug: string }>();
    const navigate = useNavigate();
    const recordFlashcardSession = useLearningStore((s) => s.recordFlashcardSession);
    const topicState = useLearningStore((s) => s.topics.find((t) => t.slug === topicSlug));

    const cards = getCards(topicSlug ?? "");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [known, setKnown] = useState<Set<number>>(new Set());
    const [unknown, setUnknown] = useState<Set<number>>(new Set());
    const [sessionDone, setSessionDone] = useState(false);
    const [sessionSaved, setSessionSaved] = useState(false);

    const topicName = topicState?.name ?? (topicSlug ?? "").split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

    const handleNext = useCallback(() => {
        setFlipped(false);
        setTimeout(() => {
            if (currentIndex + 1 >= cards.length) {
                setSessionDone(true);
            } else {
                setCurrentIndex((i) => i + 1);
            }
        }, 150);
    }, [currentIndex, cards.length]);

    const handlePrev = useCallback(() => {
        if (currentIndex === 0) return;
        setFlipped(false);
        setTimeout(() => setCurrentIndex((i) => i - 1), 150);
    }, [currentIndex]);

    const markKnown = () => {
        setKnown((prev) => new Set([...prev, currentIndex]));
        setUnknown((prev) => { const s = new Set(prev); s.delete(currentIndex); return s; });
        handleNext();
    };

    const markUnknown = () => {
        setUnknown((prev) => new Set([...prev, currentIndex]));
        setKnown((prev) => { const s = new Set(prev); s.delete(currentIndex); return s; });
        handleNext();
    };

    // Save results to global store when session ends
    const saveSession = (knownSet: Set<number>, unknownSet: Set<number>) => {
        if (sessionSaved || !topicSlug) return;
        setSessionSaved(true);
        recordFlashcardSession({
            topicSlug,
            knownCount: knownSet.size,
            totalCount: cards.length,
            cardResults: cards.map((c, i) => ({ question: c.q, knew: knownSet.has(i) })),
        });
    };

    const knownCount = known.size;
    const unknownCount = unknown.size;
    const progress = ((currentIndex + (sessionDone ? 1 : 0)) / cards.length) * 100;
    const score = Math.round((knownCount / cards.length) * 100);
    const previousScore = topicState?.accuracy ?? 0;
    const scoreDelta = score - previousScore;

    // ── Results Screen ──────────────────────────────────────────────────────────
    if (sessionDone) {
        if (!sessionSaved) saveSession(known, unknown);

        return (
            <StudentLayout>
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-morpheus-muted hover:text-morpheus-text mb-6">
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="max-w-md mx-auto text-center">
                    <div className="w-20 h-20 rounded-full bg-morpheus-accent/10 border border-morpheus-accent/30 flex items-center justify-center mx-auto mb-6">
                        <Trophy size={36} className="text-morpheus-accent" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-morpheus-text mb-2">Session Complete! 🎉</h2>
                    <p className="text-morpheus-muted text-sm mb-6">
                        You've reviewed all {cards.length} cards for <span className="text-morpheus-text font-medium">{topicName}</span>
                    </p>

                    {/* Score ring */}
                    <div className="relative w-32 h-32 mx-auto mb-4">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#1e1e2e" strokeWidth="8" />
                            <circle cx="50" cy="50" r="40" fill="none"
                                stroke={score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444"}
                                strokeWidth="8" strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (score / 100) * 251.2}
                                strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold font-display text-morpheus-text">{score}%</span>
                            <span className="text-xs text-morpheus-muted">Score</span>
                        </div>
                    </div>

                    {/* Delta from previous score */}
                    <div className={cn("flex items-center justify-center gap-1.5 mb-6 text-sm font-medium",
                        scoreDelta >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {scoreDelta >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{scoreDelta >= 0 ? "+" : ""}{scoreDelta}% vs previous accuracy</span>
                    </div>

                    {/* Impact on topic */}
                    {topicState && (
                        <div className={cn("rounded-2xl border p-4 mb-5 text-left",
                            topicState.stability === "stable" ? "border-emerald-500/30 bg-emerald-500/5"
                                : topicState.stability === "shaky" ? "border-amber-500/30 bg-amber-500/5"
                                    : "border-red-500/30 bg-red-500/5")}>
                            <p className="text-xs font-semibold text-morpheus-muted uppercase tracking-wider mb-1">Topic Updated</p>
                            <p className="text-sm text-morpheus-text font-medium">{topicName}</p>
                            <p className="text-xs text-morpheus-muted mt-0.5">
                                Stability score: <span className="font-semibold text-morpheus-text">{topicState.score}/100</span>
                                {" · "}
                                Status: <span className={cn("font-semibold capitalize",
                                    topicState.stability === "stable" ? "text-emerald-400"
                                        : topicState.stability === "shaky" ? "text-amber-400" : "text-red-400"
                                )}>{topicState.stability}</span>
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                            <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-emerald-400">{knownCount}</p>
                            <p className="text-xs text-morpheus-muted">I knew this</p>
                        </div>
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                            <XCircle size={20} className="text-red-400 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-red-400">{unknownCount}</p>
                            <p className="text-xs text-morpheus-muted">Needs work</p>
                        </div>
                    </div>

                    {unknownCount > 0 && (
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 mb-5 text-left">
                            <p className="text-sm text-amber-400 font-medium mb-1">💡 AI Insight</p>
                            <p className="text-xs text-morpheus-muted">
                                {unknownCount} card{unknownCount > 1 ? "s" : ""} still uncertain. {score >= 60
                                    ? "Your mistakes in the log have been marked as corrected for this topic."
                                    : "Keep practicing — topic stability will improve as you master more cards."}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => { setCurrentIndex(0); setFlipped(false); setKnown(new Set()); setUnknown(new Set()); setSessionDone(false); setSessionSaved(false); }}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-morpheus-accent hover:bg-morpheus-accent-light text-white font-medium rounded-xl transition-colors"
                        >
                            <RefreshCcw size={16} /> Practice Again
                        </button>
                        <button
                            onClick={() => navigate(`/student/weakness-prediction`)}
                            className="flex items-center justify-center gap-2 w-full py-3 border border-morpheus-border text-morpheus-text text-sm font-medium rounded-xl hover:bg-morpheus-surface transition-colors"
                        >
                            <Zap size={14} /> View updated predictions
                        </button>
                        <button
                            onClick={() => navigate(`/student/revision/${topicSlug}`)}
                            className="text-xs text-morpheus-muted hover:text-morpheus-text transition-colors"
                        >
                            More revision options →
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    // ── Main flashcard UI ───────────────────────────────────────────────────────
    return (
        <StudentLayout>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-morpheus-muted hover:text-morpheus-text mb-6">
                <ArrowLeft size={16} /> Back
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="font-display text-xl font-semibold text-morpheus-text">{topicName}</h1>
                    <p className="text-xs text-morpheus-muted mt-0.5">
                        {cards.length} flashcards · Tap card to flip
                        {topicState && <span className="ml-2 text-morpheus-accent">· Current score: {topicState.score}/100</span>}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-morpheus-muted font-medium">{currentIndex + 1} / {cards.length}</span>
                    {known.has(currentIndex) && <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> Known</span>}
                    {unknown.has(currentIndex) && <span className="text-xs text-red-400 flex items-center gap-1"><XCircle size={12} /> Review</span>}
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-morpheus-surface rounded-full mb-6 overflow-hidden">
                <div className="h-full bg-morpheus-accent rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            <div className="flex gap-3 mb-6">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 size={13} /><span>{knownCount} known</span></div>
                <div className="flex items-center gap-1.5 text-xs text-red-400"><XCircle size={13} /><span>{unknownCount} to review</span></div>
                <div className="flex items-center gap-1.5 text-xs text-morpheus-muted ml-auto"><Zap size={13} /><span>{cards.length - currentIndex - 1} left</span></div>
            </div>

            <div className="max-w-2xl mx-auto">
                <Flashcard front={cards[currentIndex].q} back={cards[currentIndex].a} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

                <div className="flex items-center gap-3 mt-5">
                    <button onClick={handlePrev} disabled={currentIndex === 0}
                        className="w-10 h-10 rounded-xl border border-morpheus-border bg-morpheus-surface flex items-center justify-center text-morpheus-muted hover:text-morpheus-text disabled:opacity-30 transition-all">
                        <ChevronLeft size={18} />
                    </button>
                    <button onClick={markUnknown}
                        className="flex-1 py-2.5 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm font-medium hover:bg-red-500/15 transition-colors flex items-center justify-center gap-2">
                        <XCircle size={15} /> Still learning
                    </button>
                    <button onClick={markKnown}
                        className="flex-1 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-sm font-medium hover:bg-emerald-500/15 transition-colors flex items-center justify-center gap-2">
                        <CheckCircle2 size={15} /> I know this
                    </button>
                    <button onClick={handleNext}
                        className="w-10 h-10 rounded-xl border border-morpheus-border bg-morpheus-surface flex items-center justify-center text-morpheus-muted hover:text-morpheus-text transition-all">
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="text-center mt-4">
                    <button onClick={handleNext} className="text-xs text-morpheus-muted hover:text-morpheus-text transition-colors">
                        Skip this card →
                    </button>
                </div>
            </div>
        </StudentLayout>
    );
}
