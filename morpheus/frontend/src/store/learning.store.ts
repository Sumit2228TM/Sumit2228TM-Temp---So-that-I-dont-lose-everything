import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Stability = "stable" | "shaky" | "fragile";

export interface TopicState {
    slug: string;
    name: string;
    subject: string;
    score: number;
    daysSince: number;
    accuracy: number;
    mistakes: number;
    stability: Stability;
    lastPracticed?: string;
    flashcardSessions: number;
    totalCards: number;
    knownCards: number;
}

export interface MistakeEntry {
    id: string;
    date: string;
    timestamp: number;
    topicSlug: string;
    topicName: string;
    type: string;
    subject: string;
    corrected: boolean;
    correctedAt?: string;
}

export interface ActivityEntry {
    id: string;
    timestamp: number;
    emoji: string;
    action: string;
    type: "success" | "warn" | "info";
}

export interface WeeklyRecord {
    weekKey: string;
    label: string;
    mastered: number;
    retention: number;
    improvement: number;
    doubtHours: number;
    sessions: number;
}

// ─── Solver Profile ───────────────────────────────────────────────────────────

export type SolverStyle = "trial-error" | "formula-memorizer" | "concept-builder" | "pattern-recognizer";

export interface SolverProfile {
    trialError: number;           // 0–100: relies on repeated attempts
    formulaMemorizer: number;     // 0–100: recalls formulas but struggles with derivation
    conceptBuilder: number;       // 0–100: builds from first principles
    patternRecognizer: number;    // 0–100: recognizes question patterns and applies templates
    dominantStyle: SolverStyle;
    insight: string;
    sessionsAnalyzed: number;
    lastUpdated: number;
}

// ─── Concept Transfer Score ───────────────────────────────────────────────────

export interface TransferRecord {
    id: string;
    concept: string;
    sourceSubject: string;
    targetSubject: string;
    sourceScore: number;      // mastery in source context (mirrors topic score)
    transferScore: number;    // ability to apply in target context
    gap: number;              // source - transfer
    status: "strong" | "partial" | "weak";
    questionsTried: number;
    questionsCorrect: number;
    topicSlug: string;
    exampleQ: string;         // illustrative transfer question
    exampleA: string;
}

// ─── Derived stability ────────────────────────────────────────────────────────

export function deriveStability(score: number): Stability {
    if (score >= 70) return "stable";
    if (score >= 45) return "shaky";
    return "fragile";
}

export function scoreFromSession(knownCount: number, totalCount: number): number {
    if (totalCount === 0) return 0;
    const ratio = knownCount / totalCount;
    return Math.round((ratio - 0.5) * 40);
}

// ─── Initial seed data ────────────────────────────────────────────────────────

const initialTopics: TopicState[] = [
    { slug: "differential-equations", name: "Differential Equations", subject: "Calculus", score: 91, daysSince: 2, accuracy: 94, mistakes: 0, stability: "stable", flashcardSessions: 3, totalCards: 12, knownCards: 11 },
    { slug: "limits-continuity", name: "Limits & Continuity", subject: "Calculus", score: 86, daysSince: 3, accuracy: 88, mistakes: 1, stability: "stable", flashcardSessions: 2, totalCards: 10, knownCards: 9 },
    { slug: "vectors-3d-geometry", name: "Vectors & 3D Geometry", subject: "Mathematics", score: 83, daysSince: 4, accuracy: 85, mistakes: 1, stability: "stable", flashcardSessions: 2, totalCards: 10, knownCards: 8 },
    { slug: "waves-oscillations", name: "Waves & Oscillations", subject: "Physics", score: 78, daysSince: 5, accuracy: 80, mistakes: 2, stability: "stable", flashcardSessions: 2, totalCards: 8, knownCards: 6 },
    { slug: "chemical-bonding", name: "Chemical Bonding", subject: "Chemistry", score: 76, daysSince: 6, accuracy: 79, mistakes: 2, stability: "stable", flashcardSessions: 1, totalCards: 8, knownCards: 6 },
    { slug: "probability", name: "Probability", subject: "Mathematics", score: 62, daysSince: 9, accuracy: 65, mistakes: 3, stability: "shaky", flashcardSessions: 1, totalCards: 12, knownCards: 7 },
    { slug: "integration-by-parts", name: "Integration by Parts", subject: "Calculus", score: 58, daysSince: 11, accuracy: 61, mistakes: 4, stability: "shaky", flashcardSessions: 1, totalCards: 14, knownCards: 8 },
    { slug: "thermodynamics", name: "Thermodynamics", subject: "Physics", score: 55, daysSince: 12, accuracy: 57, mistakes: 3, stability: "shaky", flashcardSessions: 0, totalCards: 0, knownCards: 0 },
    { slug: "organic-reactions", name: "Organic Reactions", subject: "Chemistry", score: 51, daysSince: 14, accuracy: 53, mistakes: 5, stability: "shaky", flashcardSessions: 0, totalCards: 0, knownCards: 0 },
    { slug: "binomial-theorem", name: "Binomial Theorem", subject: "Mathematics", score: 47, daysSince: 15, accuracy: 49, mistakes: 4, stability: "shaky", flashcardSessions: 0, totalCards: 0, knownCards: 0 },
    { slug: "permutations-combinations", name: "Permutations & Combinations", subject: "Mathematics", score: 28, daysSince: 22, accuracy: 31, mistakes: 8, stability: "fragile", flashcardSessions: 0, totalCards: 0, knownCards: 0 },
    { slug: "electrochemistry", name: "Electrochemistry", subject: "Chemistry", score: 32, daysSince: 20, accuracy: 35, mistakes: 7, stability: "fragile", flashcardSessions: 0, totalCards: 0, knownCards: 0 },
    { slug: "rotational-motion", name: "Rotational Motion", subject: "Physics", score: 24, daysSince: 25, accuracy: 28, mistakes: 9, stability: "fragile", flashcardSessions: 0, totalCards: 0, knownCards: 0 },
    { slug: "matrices-determinants", name: "Matrices & Determinants", subject: "Mathematics", score: 38, daysSince: 18, accuracy: 40, mistakes: 6, stability: "fragile", flashcardSessions: 0, totalCards: 0, knownCards: 0 },
];

const initialMistakes: MistakeEntry[] = [
    { id: "m1", date: "Feb 18", timestamp: Date.now() - 9 * 86400000, topicSlug: "permutations-combinations", topicName: "Permutations", type: "Formula error", subject: "Maths", corrected: false },
    { id: "m2", date: "Feb 20", timestamp: Date.now() - 7 * 86400000, topicSlug: "integration-by-parts", topicName: "Integration", type: "Wrong limits", subject: "Calculus", corrected: false },
    { id: "m3", date: "Feb 21", timestamp: Date.now() - 6 * 86400000, topicSlug: "permutations-combinations", topicName: "Permutations", type: "Overcounting", subject: "Maths", corrected: false },
    { id: "m4", date: "Feb 23", timestamp: Date.now() - 4 * 86400000, topicSlug: "thermodynamics", topicName: "Thermodynamics", type: "Sign error", subject: "Physics", corrected: false },
    { id: "m5", date: "Feb 25", timestamp: Date.now() - 2 * 86400000, topicSlug: "permutations-combinations", topicName: "Permutations", type: "Concept gap", subject: "Maths", corrected: false },
    { id: "m6", date: "Feb 26", timestamp: Date.now() - 1 * 86400000, topicSlug: "electrochemistry", topicName: "Electrochemistry", type: "Formula error", subject: "Chemistry", corrected: false },
];

const nowTs = Date.now();
const initialActivity: ActivityEntry[] = [
    { id: "a1", timestamp: nowTs - 172800000, emoji: "✅", action: "Mastered 'Differential Equations'", type: "success" },
    { id: "a2", timestamp: nowTs - 86400000, emoji: "🃏", action: "Flashcard session: Probability (12 cards)", type: "info" },
    { id: "a3", timestamp: nowTs - 72000000, emoji: "🎓", action: "Session with Mr. Ravi completed", type: "success" },
    { id: "a4", timestamp: nowTs - 57600000, emoji: "⚠️", action: "Skipped revision: Thermodynamics", type: "warn" },
    { id: "a5", timestamp: nowTs - 43200000, emoji: "✅", action: "Mastered 'Vectors & 3D Geometry'", type: "success" },
];

const seedWeeklyHistory: WeeklyRecord[] = [
    { weekKey: "2026-W05", label: "Jan 26–Feb 1", mastered: 4, retention: 60, improvement: 9, doubtHours: 6.1, sessions: 1 },
    { weekKey: "2026-W06", label: "Feb 2–8", mastered: 6, retention: 68, improvement: 14, doubtHours: 4.8, sessions: 2 },
    { weekKey: "2026-W07", label: "Feb 9–15", mastered: 7, retention: 71, improvement: 17, doubtHours: 4.3, sessions: 3 },
    { weekKey: "2026-W08", label: "Feb 16–22", mastered: 8, retention: 74, improvement: 19, doubtHours: 4.1, sessions: 3 },
];

// ─── Solver Profile initial seed ──────────────────────────────────────────────

const initialSolverProfile: SolverProfile = {
    trialError: 42,
    formulaMemorizer: 68,
    conceptBuilder: 31,
    patternRecognizer: 55,
    dominantStyle: "formula-memorizer",
    insight: "You over-rely on formula recall. Conceptual derivation strength is low — practice deriving formulas from scratch.",
    sessionsAnalyzed: 5,
    lastUpdated: nowTs - 86400000,
};

// ─── Transfer Records initial seed ───────────────────────────────────────────

const initialTransferRecords: TransferRecord[] = [
    {
        id: "tr1",
        concept: "Integration",
        sourceSubject: "Calculus",
        targetSubject: "Physics",
        sourceScore: 58,
        transferScore: 28,
        gap: 30,
        status: "weak",
        questionsTried: 8,
        questionsCorrect: 2,
        topicSlug: "integration-by-parts",
        exampleQ: "A particle moves with velocity v(t) = 3t² - 2t. Find displacement from t=1 to t=3.",
        exampleA: "Integrate v(t): s = ∫(3t² - 2t)dt = [t³ - t²] from 1 to 3 = (27-9) - (1-1) = 18 units",
    },
    {
        id: "tr2",
        concept: "Probability",
        sourceSubject: "Mathematics",
        targetSubject: "Statistics",
        sourceScore: 62,
        transferScore: 44,
        gap: 18,
        status: "partial",
        questionsTried: 10,
        questionsCorrect: 4,
        topicSlug: "probability",
        exampleQ: "A drug test is 99% sensitive & 98% specific. Prevalence is 0.1%. What is P(disease | positive test)?",
        exampleA: "Using Bayes: P(D|+) = (0.99×0.001) / (0.99×0.001 + 0.02×0.999) ≈ 4.7% — the base rate dominates.",
    },
    {
        id: "tr3",
        concept: "Differential Equations",
        sourceSubject: "Calculus",
        targetSubject: "Chemistry",
        sourceScore: 91,
        transferScore: 74,
        gap: 17,
        status: "strong",
        questionsTried: 12,
        questionsCorrect: 9,
        topicSlug: "differential-equations",
        exampleQ: "Radioactive decay: dN/dt = -λN. If N₀ = 1000 and λ = 0.1/yr, find N after 5 years.",
        exampleA: "Solve: N(t) = N₀·e^(-λt) = 1000·e^(-0.5) ≈ 607 atoms",
    },
    {
        id: "tr4",
        concept: "Vectors",
        sourceSubject: "Mathematics",
        targetSubject: "Physics",
        sourceScore: 83,
        transferScore: 61,
        gap: 22,
        status: "partial",
        questionsTried: 9,
        questionsCorrect: 5,
        topicSlug: "vectors-3d-geometry",
        exampleQ: "A force F = (3î + 4ĵ) N acts on a body moving with displacement d = (2î - ĵ) m. Find work done.",
        exampleA: "W = F·d = (3×2) + (4×(-1)) = 6 - 4 = 2 J",
    },
    {
        id: "tr5",
        concept: "Permutations",
        sourceSubject: "Mathematics",
        targetSubject: "Computer Science",
        sourceScore: 28,
        transferScore: 12,
        gap: 16,
        status: "weak",
        questionsTried: 6,
        questionsCorrect: 1,
        topicSlug: "permutations-combinations",
        exampleQ: "How many distinct passwords of length 6 can be made from {A-Z, 0-9} if no character repeats?",
        exampleA: "36P6 = 36! / (36-6)! = 36 × 35 × 34 × 33 × 32 × 31 = 1,402,410,240 passwords",
    },
    {
        id: "tr6",
        concept: "Thermodynamics",
        sourceSubject: "Physics",
        targetSubject: "Chemistry",
        sourceScore: 55,
        transferScore: 36,
        gap: 19,
        status: "weak",
        questionsTried: 7,
        questionsCorrect: 3,
        topicSlug: "thermodynamics",
        exampleQ: "For an ideal gas, calculate ΔH - ΔU for a reaction where Δn(gas) = 2 at T = 300K.",
        exampleA: "ΔH - ΔU = Δn·RT = 2 × 8.314 × 300 = 4988.4 J ≈ 4.99 kJ",
    },
];

// ─── Week helpers ─────────────────────────────────────────────────────────────

function weekKey(ts = Date.now()) {
    const d = new Date(ts);
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function weekLabel(ts = Date.now()) {
    const d = new Date(ts);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Style insights lookup ────────────────────────────────────────────────────

const styleInsights: Record<SolverStyle, string> = {
    "trial-error": "You over-rely on trial & error. Try to understand why an approach works before applying it — build a decision framework.",
    "formula-memorizer": "You over-rely on formula recall. Conceptual derivation strength is low — practice deriving key formulas from scratch.",
    "concept-builder": "Strong conceptual understanding! You build solutions from first principles. Reinforce speed by drilling applied problem-solving.",
    "pattern-recognizer": "Excellent pattern recognition! You quickly map questions to templates. Work on edge cases where standard patterns break down.",
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface LearningState {
    topics: TopicState[];
    mistakes: MistakeEntry[];
    activity: ActivityEntry[];
    weeklyHistory: WeeklyRecord[];
    currentWeekMastered: number;
    totalSessions: number;
    solverProfile: SolverProfile;
    transferRecords: TransferRecord[];

    recordFlashcardSession: (params: {
        topicSlug: string;
        knownCount: number;
        totalCount: number;
        cardResults: { question: string; knew: boolean }[];
    }) => void;

    recordTransferAttempt: (params: { transferId: string; correct: boolean }) => void;
    recordSessionBooked: (subject: string, tutorName: string) => void;
    recordRevisionVisit: (topicSlug: string) => void;
    getPeerScores: (topicSlug: string) => { label: string; score: number; color: string }[];
    resetLearningData: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

function clamp(v: number, lo = 5, hi = 95) { return Math.min(hi, Math.max(lo, v)); }

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLearningStore = create<LearningState>()(
    persist(
        (set, get) => ({
            topics: initialTopics,
            mistakes: initialMistakes,
            activity: initialActivity,
            weeklyHistory: seedWeeklyHistory,
            currentWeekMastered: 9,
            totalSessions: 3,
            solverProfile: initialSolverProfile,
            transferRecords: initialTransferRecords,

            recordFlashcardSession: ({ topicSlug, knownCount, totalCount }) => {
                const state = get();
                const ratio = totalCount > 0 ? knownCount / totalCount : 0;
                const scoreDelta = scoreFromSession(knownCount, totalCount);
                const newAccuracy = Math.round(ratio * 100);
                const now = Date.now();

                // ── 1. Update topic ──────────────────────────────────────────────────
                const topic = state.topics.find((t) => t.slug === topicSlug);
                const updatedTopics = state.topics.map((t) => {
                    if (t.slug !== topicSlug) return t;
                    const rawScore = Math.min(100, Math.max(0, t.score + scoreDelta));
                    const newMistakes = ratio >= 0.8
                        ? Math.max(0, t.mistakes - Math.floor(knownCount / 3))
                        : t.mistakes;
                    return {
                        ...t,
                        score: rawScore,
                        stability: deriveStability(rawScore),
                        accuracy: Math.round((t.accuracy * t.flashcardSessions + newAccuracy) / (t.flashcardSessions + 1)),
                        mistakes: newMistakes,
                        daysSince: 0,
                        lastPracticed: new Date(now).toISOString(),
                        flashcardSessions: t.flashcardSessions + 1,
                        totalCards: t.totalCards + totalCount,
                        knownCards: t.knownCards + knownCount,
                    };
                });

                // ── 2. Correct mistakes ──────────────────────────────────────────────
                const updatedMistakes = state.mistakes.map((m) => {
                    if (m.topicSlug !== topicSlug || m.corrected) return m;
                    return ratio >= 0.6
                        ? { ...m, corrected: true, correctedAt: new Date(now).toISOString() }
                        : m;
                });

                // ── 3. Activity entry ────────────────────────────────────────────────
                const topicName = topic?.name ?? topicSlug;
                const scoreLabel = ratio >= 0.8 ? "Great job" : ratio >= 0.6 ? "Good effort" : "Needs more practice";
                const newActivity: ActivityEntry = {
                    id: uid(), timestamp: now,
                    emoji: ratio >= 0.8 ? "✅" : ratio >= 0.5 ? "🃏" : "⚠️",
                    action: `Flashcard session: ${topicName} — ${knownCount}/${totalCount} cards correct (${scoreLabel})`,
                    type: ratio >= 0.7 ? "success" : ratio >= 0.5 ? "info" : "warn",
                };

                // ── 4. Mastery delta ─────────────────────────────────────────────────
                const wasBelowStable = (topic?.score ?? 100) < 70;
                const nowStable = (updatedTopics.find(t => t.slug === topicSlug)?.score ?? 0) >= 70;
                const masteredDelta = (wasBelowStable && nowStable) ? 1 : 0;

                // ── 5. Weekly history ────────────────────────────────────────────────
                const key = weekKey(now);
                const existingWeek = state.weeklyHistory.find((w) => w.weekKey === key);
                const avgAccuracy = Math.round(updatedTopics.reduce((a, t) => a + t.accuracy, 0) / updatedTopics.length);
                const updatedHistory = existingWeek
                    ? state.weeklyHistory.map((w) =>
                        w.weekKey === key ? { ...w, mastered: w.mastered + masteredDelta, retention: avgAccuracy } : w)
                    : [...state.weeklyHistory, {
                        weekKey: key, label: weekLabel(now),
                        mastered: state.currentWeekMastered + masteredDelta,
                        retention: avgAccuracy, improvement: 22 + masteredDelta * 2,
                        doubtHours: 4.2, sessions: state.totalSessions,
                    }];

                // ── 6. Update SolverProfile ──────────────────────────────────────────
                const cp = state.solverProfile;
                const isFirstSession = (topic?.flashcardSessions ?? 0) === 0;
                const isFormulaHeavy = ["permutations-combinations", "integration-by-parts", "electrochemistry", "binomial-theorem"].includes(topicSlug);
                const isConceptHeavy = ["differential-equations", "thermodynamics", "rotational-motion", "probability"].includes(topicSlug);

                const newTE = clamp(cp.trialError + (ratio < 0.5 ? 3 : ratio < 0.7 ? 1 : -1));
                const newFM = clamp(cp.formulaMemorizer + (isFormulaHeavy && ratio >= 0.7 ? 3 : isFormulaHeavy && ratio < 0.5 ? -2 : 0));
                const newCB = clamp(cp.conceptBuilder + (isConceptHeavy && ratio >= 0.8 ? 4 : isFirstSession && ratio >= 0.75 ? 3 : 0));
                const newPR = clamp(cp.patternRecognizer + (!isFirstSession && ratio >= 0.75 ? 3 : 0));

                const dominant: SolverStyle = (
                    newTE >= newFM && newTE >= newCB && newTE >= newPR ? "trial-error" :
                        newFM >= newCB && newFM >= newPR ? "formula-memorizer" :
                            newCB >= newPR ? "concept-builder" : "pattern-recognizer"
                );

                const updatedProfile: SolverProfile = {
                    trialError: newTE, formulaMemorizer: newFM,
                    conceptBuilder: newCB, patternRecognizer: newPR,
                    dominantStyle: dominant, insight: styleInsights[dominant],
                    sessionsAnalyzed: cp.sessionsAnalyzed + 1, lastUpdated: now,
                };

                // ── 7. Update TransferRecords for this topic ──────────────────────────
                const updatedTransfer = state.transferRecords.map((tr) => {
                    if (tr.topicSlug !== topicSlug) return tr;
                    const newCorrect = tr.questionsCorrect + Math.round(knownCount / 2);
                    const newTried = tr.questionsTried + Math.round(totalCount / 2);
                    const newTransfer = Math.min(95, Math.round((newCorrect / Math.max(1, newTried)) * 100));
                    const updatedSource = updatedTopics.find(t => t.slug === topicSlug)?.score ?? tr.sourceScore;
                    const gap = Math.max(0, updatedSource - newTransfer);
                    const status: "strong" | "partial" | "weak" = newTransfer >= 70 ? "strong" : newTransfer >= 45 ? "partial" : "weak";
                    return { ...tr, sourceScore: updatedSource, transferScore: newTransfer, gap, status, questionsCorrect: newCorrect, questionsTried: newTried };
                });

                set({
                    topics: updatedTopics,
                    mistakes: updatedMistakes,
                    activity: [newActivity, ...state.activity].slice(0, 50),
                    weeklyHistory: updatedHistory,
                    currentWeekMastered: state.currentWeekMastered + masteredDelta,
                    solverProfile: updatedProfile,
                    transferRecords: updatedTransfer,
                });
            },

            recordTransferAttempt: ({ transferId, correct }) => {
                const state = get();
                const updatedTransfer = state.transferRecords.map((tr) => {
                    if (tr.id !== transferId) return tr;
                    const newCorrect = tr.questionsCorrect + (correct ? 1 : 0);
                    const newTried = tr.questionsTried + 1;
                    const newTransfer = Math.min(95, Math.round((newCorrect / newTried) * 100));
                    const sourceTopic = state.topics.find(t => t.slug === tr.topicSlug);
                    const gap = Math.max(0, (sourceTopic?.score ?? 50) - newTransfer);
                    const status: "strong" | "partial" | "weak" = newTransfer >= 70 ? "strong" : newTransfer >= 45 ? "partial" : "weak";
                    return { ...tr, questionsCorrect: newCorrect, questionsTried: newTried, transferScore: newTransfer, gap, status };
                });
                const newActivity: ActivityEntry = {
                    id: uid(), timestamp: Date.now(),
                    emoji: correct ? "✅" : "❌",
                    action: `Transfer challenge ${correct ? "answered correctly!" : "incorrect — keep practising"}`,
                    type: correct ? "success" : "warn",
                };
                set({ transferRecords: updatedTransfer, activity: [newActivity, ...state.activity].slice(0, 50) });
            },

            recordSessionBooked: (subject, tutorName) => {
                const state = get();
                const now = Date.now();
                const newActivity: ActivityEntry = {
                    id: uid(), timestamp: now, emoji: "📅",
                    action: `Booked revision session with ${tutorName} for ${subject}`,
                    type: "success",
                };
                const key = weekKey(now);
                const updatedHistory = state.weeklyHistory.map((w) =>
                    w.weekKey === key ? { ...w, sessions: w.sessions + 1 } : w
                );
                set({ activity: [newActivity, ...state.activity].slice(0, 50), weeklyHistory: updatedHistory, totalSessions: state.totalSessions + 1 });
            },

            recordRevisionVisit: (topicSlug) => {
                const state = get();
                const now = Date.now();
                const topic = state.topics.find((t) => t.slug === topicSlug);
                if (!topic) return;
                const lastForTopic = state.activity.find((a) =>
                    a.action.includes(topic.name) && now - a.timestamp < 3600000
                );
                if (lastForTopic) return;
                const newActivity: ActivityEntry = {
                    id: uid(), timestamp: now, emoji: "📖",
                    action: `Started revision: ${topic.name}`, type: "info",
                };
                set({ activity: [newActivity, ...state.activity].slice(0, 50) });
            },

            getPeerScores: (topicSlug) => {
                const topic = get().topics.find((t) => t.slug === topicSlug);
                const myScore = topic?.accuracy ?? 40;
                const seed = topicSlug.length;
                const variance = () => Math.floor(Math.random() * 10) - 5;
                return [
                    { label: "Students like you", score: Math.max(10, Math.min(95, myScore - 10 + variance())), color: "bg-red-500" },
                    { label: "Students who revised", score: Math.max(40, Math.min(98, myScore + 25 + variance())), color: "bg-emerald-500" },
                    { label: "Top 10% students", score: Math.max(70, Math.min(99, 90 + (seed % 8) + variance())), color: "bg-purple-500" },
                ];
            },

            resetLearningData: () => {
                set({
                    topics: initialTopics,
                    mistakes: initialMistakes,
                    activity: initialActivity,
                    weeklyHistory: seedWeeklyHistory,
                    currentWeekMastered: 9,
                    totalSessions: 3,
                    solverProfile: initialSolverProfile,
                    transferRecords: initialTransferRecords,
                });
            },
        }),
        {
            name: "morpheus-learning",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                topics: state.topics,
                mistakes: state.mistakes,
                activity: state.activity,
                weeklyHistory: state.weeklyHistory,
                currentWeekMastered: state.currentWeekMastered,
                totalSessions: state.totalSessions,
                solverProfile: state.solverProfile,
                transferRecords: state.transferRecords,
            }),
        }
    )
);

// ─── Selectors ────────────────────────────────────────────────────────────────

export function useTopicBySlug(slug: string) {
    return useLearningStore((s) => s.topics.find((t) => t.slug === slug));
}
export function useStableTopics() {
    return useLearningStore((s) => s.topics.filter((t) => t.stability === "stable"));
}
export function useShakyTopics() {
    return useLearningStore((s) => s.topics.filter((t) => t.stability === "shaky"));
}
export function useFragileTopics() {
    return useLearningStore((s) => s.topics.filter((t) => t.stability === "fragile"));
}

export { timeAgo };
