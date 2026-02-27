import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Stability = "stable" | "shaky" | "fragile";

export interface TopicState {
    slug: string;
    name: string;
    subject: string;
    score: number;         // 0–100 dynamic stability score
    daysSince: number;     // days since last revision (decrements on practice)
    accuracy: number;      // % accuracy (updated by flashcard results)
    mistakes: number;      // count of unresolved mistakes
    stability: Stability;  // derived from score
    lastPracticed?: string; // ISO timestamp
    flashcardSessions: number;
    totalCards: number;
    knownCards: number;
}

export interface MistakeEntry {
    id: string;
    date: string;         // display date e.g. "Feb 18"
    timestamp: number;    // Unix ms for sorting
    topicSlug: string;
    topicName: string;
    type: string;
    subject: string;
    corrected: boolean;   // updated when flashcard is answered correctly
    correctedAt?: string; // ISO timestamp
}

export interface ActivityEntry {
    id: string;
    timestamp: number;    // Unix ms
    emoji: string;
    action: string;
    type: "success" | "warn" | "info";
}

export interface WeeklyRecord {
    weekKey: string;       // e.g. "2026-W09"
    label: string;
    mastered: number;
    retention: number;
    improvement: number;
    doubtHours: number;
    sessions: number;
}

// ─── Derived stability ────────────────────────────────────────────────────────

export function deriveStability(score: number): Stability {
    if (score >= 70) return "stable";
    if (score >= 45) return "shaky";
    return "fragile";
}

// Score delta from flashcard session: known/total
export function scoreFromSession(knownCount: number, totalCount: number): number {
    if (totalCount === 0) return 0;
    const ratio = knownCount / totalCount;
    // +20 for perfect, -10 for 0%, scaled linearly
    return Math.round((ratio - 0.5) * 40); // range: -20 to +20
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

const now = Date.now();
const initialActivity: ActivityEntry[] = [
    { id: "a1", timestamp: now - 172800000, emoji: "✅", action: "Mastered 'Differential Equations'", type: "success" },
    { id: "a2", timestamp: now - 86400000, emoji: "🃏", action: "Flashcard session: Probability (12 cards)", type: "info" },
    { id: "a3", timestamp: now - 72000000, emoji: "🎓", action: "Session with Mr. Ravi completed", type: "success" },
    { id: "a4", timestamp: now - 57600000, emoji: "⚠️", action: "Skipped revision: Thermodynamics", type: "warn" },
    { id: "a5", timestamp: now - 43200000, emoji: "✅", action: "Mastered 'Vectors & 3D Geometry'", type: "success" },
];

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

const seedWeeklyHistory: WeeklyRecord[] = [
    { weekKey: "2026-W05", label: "Jan 26–Feb 1", mastered: 4, retention: 60, improvement: 9, doubtHours: 6.1, sessions: 1 },
    { weekKey: "2026-W06", label: "Feb 2–8", mastered: 6, retention: 68, improvement: 14, doubtHours: 4.8, sessions: 2 },
    { weekKey: "2026-W07", label: "Feb 9–15", mastered: 7, retention: 71, improvement: 17, doubtHours: 4.3, sessions: 3 },
    { weekKey: "2026-W08", label: "Feb 16–22", mastered: 8, retention: 74, improvement: 19, doubtHours: 4.1, sessions: 3 },
];

// ─── Store Interface ──────────────────────────────────────────────────────────

interface LearningState {
    topics: TopicState[];
    mistakes: MistakeEntry[];
    activity: ActivityEntry[];
    weeklyHistory: WeeklyRecord[];
    currentWeekMastered: number;
    totalSessions: number;

    // Actions
    recordFlashcardSession: (params: {
        topicSlug: string;
        knownCount: number;
        totalCount: number;
        cardResults: { question: string; knew: boolean }[];
    }) => void;

    recordSessionBooked: (subject: string, tutorName: string) => void;
    recordRevisionVisit: (topicSlug: string) => void;

    // Peer simulation (re-randomizes on call)
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

function uid() {
    return Math.random().toString(36).slice(2, 10);
}

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

            recordFlashcardSession: ({ topicSlug, knownCount, totalCount, cardResults }) => {
                const state = get();
                const ratio = totalCount > 0 ? knownCount / totalCount : 0;
                const scoreDelta = scoreFromSession(knownCount, totalCount);
                const newAccuracy = Math.round(ratio * 100);
                const now = Date.now();

                // ── 1. Update topic ──────────────────────────────────────────────────
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

                // ── 2. Correct mistakes for this topic if did well ───────────────────
                const updatedMistakes = state.mistakes.map((m) => {
                    if (m.topicSlug !== topicSlug || m.corrected) return m;
                    // Correct if ratio good — staggered: each 20% above 60% corrects one mistake
                    const shouldCorrect = ratio >= 0.6 && !m.corrected;
                    return shouldCorrect
                        ? { ...m, corrected: true, correctedAt: new Date(now).toISOString() }
                        : m;
                });

                // ── 3. Add to activity feed ──────────────────────────────────────────
                const topic = state.topics.find((t) => t.slug === topicSlug);
                const topicName = topic?.name ?? topicSlug;
                const scoreLabel = ratio >= 0.8 ? "Great job" : ratio >= 0.6 ? "Good effort" : "Needs more practice";
                const newActivity: ActivityEntry = {
                    id: uid(),
                    timestamp: now,
                    emoji: ratio >= 0.8 ? "✅" : ratio >= 0.5 ? "🃏" : "⚠️",
                    action: `Flashcard session: ${topicName} — ${knownCount}/${totalCount} cards correct (${scoreLabel})`,
                    type: ratio >= 0.7 ? "success" : ratio >= 0.5 ? "info" : "warn",
                };

                // ── 4. If mastered (score crosses 70 for first time) → add to week ───
                const wasBelowStable = (topic?.score ?? 100) < 70;
                const nowStable = (updatedTopics.find(t => t.slug === topicSlug)?.score ?? 0) >= 70;
                const masteredDelta = (wasBelowStable && nowStable) ? 1 : 0;

                // ── 5. Update weekly history ─────────────────────────────────────────
                const key = weekKey(now);
                const existingWeek = state.weeklyHistory.find((w) => w.weekKey === key);
                const avgAccuracy = Math.round(updatedTopics.reduce((a, t) => a + t.accuracy, 0) / updatedTopics.length);
                const updatedHistory = existingWeek
                    ? state.weeklyHistory.map((w) =>
                        w.weekKey === key
                            ? { ...w, mastered: w.mastered + masteredDelta, retention: avgAccuracy }
                            : w
                    )
                    : [
                        ...state.weeklyHistory,
                        {
                            weekKey: key,
                            label: weekLabel(now),
                            mastered: state.currentWeekMastered + masteredDelta,
                            retention: avgAccuracy,
                            improvement: 22 + masteredDelta * 2,
                            doubtHours: 4.2,
                            sessions: state.totalSessions,
                        },
                    ];

                set({
                    topics: updatedTopics,
                    mistakes: updatedMistakes,
                    activity: [newActivity, ...state.activity].slice(0, 50),
                    weeklyHistory: updatedHistory,
                    currentWeekMastered: state.currentWeekMastered + masteredDelta,
                });
            },

            recordSessionBooked: (subject, tutorName) => {
                const state = get();
                const now = Date.now();
                const newActivity: ActivityEntry = {
                    id: uid(),
                    timestamp: now,
                    emoji: "📅",
                    action: `Booked revision session with ${tutorName} for ${subject}`,
                    type: "success",
                };
                const key = weekKey(now);
                const updatedHistory = state.weeklyHistory.map((w) =>
                    w.weekKey === key ? { ...w, sessions: w.sessions + 1 } : w
                );
                set({
                    activity: [newActivity, ...state.activity].slice(0, 50),
                    weeklyHistory: updatedHistory,
                    totalSessions: state.totalSessions + 1,
                });
            },

            recordRevisionVisit: (topicSlug) => {
                const state = get();
                const now = Date.now();
                // Don't spam the feed with visits — only log if last activity wasn't same topic recently
                const lastForTopic = state.activity.find((a) =>
                    a.action.includes(state.topics.find((t) => t.slug === topicSlug)?.name ?? "~") && now - a.timestamp < 3600000
                );
                if (lastForTopic) return; // already logged in the last hour

                const topic = state.topics.find((t) => t.slug === topicSlug);
                if (!topic) return;
                const newActivity: ActivityEntry = {
                    id: uid(),
                    timestamp: now,
                    emoji: "📖",
                    action: `Started revision: ${topic.name}`,
                    type: "info",
                };
                set({ activity: [newActivity, ...state.activity].slice(0, 50) });
            },

            getPeerScores: (topicSlug) => {
                const topic = get().topics.find((t) => t.slug === topicSlug);
                const myScore = topic?.accuracy ?? 40;
                // Simulate peer data with a spread around known baselines + small random variation
                const seed = topicSlug.length; // deterministic but per-topic
                const variance = () => (Math.floor(Math.random() * 10) - 5);
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

// ─── Time-ago helper (exported for use in components) ────────────────────────
export { timeAgo };
