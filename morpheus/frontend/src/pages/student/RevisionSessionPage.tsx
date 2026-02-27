import { useNavigate, useParams } from "react-router-dom";
import StudentLayout from "../../components/shared/StudentLayout";
import {
    ArrowLeft,
    BookOpen,
    Search,
    MessageSquare,
    Calendar,
    Zap,
    Clock,
    Target,
    ChevronRight,
    Layers,
    Star,
} from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Topic Meta Data ────────────────────────────────────────────────────────────

const topicMeta: Record<string, {
    subject: string;
    stability: "stable" | "shaky" | "fragile";
    score: number;
    daysSince: number;
    accuracy: number;
    mistakes: number;
    tips: string[];
    estimatedTime: string;
    flashcardCount: number;
}> = {
    "permutations-combinations": {
        subject: "Mathematics",
        stability: "fragile",
        score: 28,
        daysSince: 22,
        accuracy: 31,
        mistakes: 8,
        tips: [
            "Focus on the distinguishing difference between permutations (ordered) and combinations (unordered)",
            "Practice with the nPr and nCr formulas until they feel automatic",
            "Start with simpler cases before attempting complex word problems",
        ],
        estimatedTime: "2–3 hours",
        flashcardCount: 18,
    },
    "electrochemistry": {
        subject: "Chemistry",
        stability: "fragile",
        score: 32,
        daysSince: 20,
        accuracy: 35,
        mistakes: 7,
        tips: [
            "Revise the electrochemical series and standard electrode potentials",
            "Practice Nernst equation problems with varying concentrations",
            "Create a visual chart comparing galvanic vs electrolytic cells",
        ],
        estimatedTime: "2 hours",
        flashcardCount: 14,
    },
    "rotational-motion": {
        subject: "Physics",
        stability: "fragile",
        score: 24,
        daysSince: 25,
        accuracy: 28,
        mistakes: 9,
        tips: [
            "Master moment of inertia for standard bodies first",
            "Understand the parallel and perpendicular axis theorems",
            "Draw free body diagrams before attempting torque problems",
        ],
        estimatedTime: "3 hours",
        flashcardCount: 20,
    },
    "matrices-determinants": {
        subject: "Mathematics",
        stability: "fragile",
        score: 38,
        daysSince: 18,
        accuracy: 40,
        mistakes: 6,
        tips: [
            "Memorize the 2×2 and 3×3 determinant expansion patterns",
            "Practice row reduction operations systematically",
            "Link determinants to system of equations solving",
        ],
        estimatedTime: "2.5 hours",
        flashcardCount: 16,
    },
    "probability": {
        subject: "Mathematics",
        stability: "shaky",
        score: 62,
        daysSince: 9,
        accuracy: 65,
        mistakes: 3,
        tips: [
            "Review the addition and multiplication theorems of probability",
            "Practice Bayes' theorem with real-world examples",
            "Use Venn diagrams to visualize overlapping events",
        ],
        estimatedTime: "1.5 hours",
        flashcardCount: 12,
    },
    "integration-by-parts": {
        subject: "Calculus",
        stability: "shaky",
        score: 58,
        daysSince: 11,
        accuracy: 61,
        mistakes: 4,
        tips: [
            "Remember LIATE rule for choosing u and dv",
            "Practice the tabular method for repeated integration by parts",
            "Verify your answers by differentiating the result",
        ],
        estimatedTime: "2 hours",
        flashcardCount: 14,
    },
};

function slugify(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getTopicData(slug: string) {
    const meta = topicMeta[slug];
    if (!meta) {
        // Fallback for unknown topics
        return {
            name: slug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
            subject: "General",
            stability: "shaky" as const,
            score: 55,
            daysSince: 10,
            accuracy: 58,
            mistakes: 3,
            tips: ["Review core concepts", "Practice with examples", "Ask your tutor for guidance"],
            estimatedTime: "1–2 hours",
            flashcardCount: 10,
        };
    }
    const name = slug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")
        .replace("Combinations", "& Combinations")
        .replace("Determinants", "& Determinants");
    return { name, ...meta };
}

const stabilityColors = {
    stable: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Stable" },
    shaky: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Shaky" },
    fragile: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", label: "Fragile — Urgent" },
};

function ActionCard({
    icon: Icon,
    title,
    description,
    caption,
    onClick,
    accent,
    highlight,
}: {
    icon: typeof BookOpen;
    title: string;
    description: string;
    caption: string;
    onClick: () => void;
    accent: string;
    highlight?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl group",
                highlight
                    ? "bg-morpheus-accent/10 border-morpheus-accent/40 hover:bg-morpheus-accent/15"
                    : "bg-morpheus-surface border-morpheus-border hover:border-white/10"
            )}
        >
            <div className="flex items-start gap-4">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", accent)}>
                    <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-morpheus-text">{title}</p>
                    <p className="text-sm text-morpheus-muted mt-0.5">{description}</p>
                    <span className="inline-block mt-2 text-[11px] text-morpheus-muted border border-morpheus-border rounded-full px-2 py-0.5">
                        {caption}
                    </span>
                </div>
                <ChevronRight size={18} className="text-morpheus-muted group-hover:text-morpheus-text group-hover:translate-x-0.5 transition-all mt-0.5 shrink-0" />
            </div>
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RevisionSessionPage() {
    const { topicSlug } = useParams<{ topicSlug: string }>();
    const navigate = useNavigate();
    const topic = getTopicData(topicSlug ?? "");

    const cfg = stabilityColors[topic.stability];

    return (
        <StudentLayout>
            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm text-morpheus-muted hover:text-morpheus-text mb-6 transition-colors"
            >
                <ArrowLeft size={16} />
                Back
            </button>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", cfg.text, cfg.bg, cfg.border)}>
                        {cfg.label}
                    </span>
                    <span className="text-xs text-morpheus-muted">{topic.subject}</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-morpheus-text mb-1">
                    {topic.name}
                </h1>
                <p className="text-sm text-morpheus-muted">
                    Choose how you'd like to strengthen this topic
                </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {[
                    { label: "Stability Score", value: `${topic.score}%`, icon: Target, color: topic.score < 40 ? "text-red-400" : topic.score < 65 ? "text-amber-400" : "text-emerald-400" },
                    { label: "Last Revised", value: `${topic.daysSince}d ago`, icon: Clock, color: "text-morpheus-muted" },
                    { label: "Accuracy", value: `${topic.accuracy}%`, icon: Star, color: "text-amber-400" },
                    { label: "Mistakes Made", value: `${topic.mistakes}x`, icon: Layers, color: topic.mistakes >= 6 ? "text-red-400" : "text-morpheus-muted" },
                ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-4">
                        <s.icon size={16} className={cn("mb-2", s.color)} />
                        <p className={cn("text-xl font-bold font-display", s.color)}>{s.value}</p>
                        <p className="text-xs text-morpheus-muted mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Action routes */}
            <div className="mb-8">
                <h2 className="font-display text-base font-semibold text-morpheus-text mb-4">
                    How do you want to revise?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ActionCard
                        icon={BookOpen}
                        title="Study with Flashcards"
                        description={`${topic.flashcardCount} AI-generated cards for this topic. Flip, test, and mark your confidence.`}
                        caption={`~${topic.estimatedTime} estimated`}
                        onClick={() => navigate(`/student/flashcards/${topicSlug}`)}
                        accent="bg-purple-500/10 text-purple-400"
                        highlight
                    />
                    <ActionCard
                        icon={Search}
                        title="Find a Tutor for this Topic"
                        description={`Browse tutors who specialise in ${topic.subject}. Book a session instantly.`}
                        caption="Live 1-on-1 session"
                        onClick={() => navigate(`/student/discovery?subject=${encodeURIComponent(topic.subject)}`)}
                        accent="bg-blue-500/10 text-blue-400"
                    />
                    <ActionCard
                        icon={MessageSquare}
                        title="Message Your Tutor"
                        description="Already connected? Send a message and ask them to cover this topic in your next session."
                        caption="Instant messaging"
                        onClick={() => navigate("/student/chat")}
                        accent="bg-emerald-500/10 text-emerald-400"
                    />
                    <ActionCard
                        icon={Calendar}
                        title="Schedule a Revision Session"
                        description="Book a dedicated revision session with your tutor focused on this topic."
                        caption="Calendar booking"
                        onClick={() => navigate("/student/sessions")}
                        accent="bg-amber-500/10 text-amber-400"
                    />
                </div>
            </div>

            {/* Quick tips */}
            <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Zap size={16} className="text-morpheus-accent" />
                    <h3 className="font-display font-semibold text-morpheus-text">Quick Revision Tips</h3>
                </div>
                <div className="space-y-3">
                    {topic.tips.map((tip, i) => (
                        <div key={i} className="flex gap-3 items-start">
                            <span className="w-6 h-6 rounded-full bg-morpheus-accent/10 border border-morpheus-accent/20 text-morpheus-accent text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                            </span>
                            <p className="text-sm text-morpheus-muted leading-relaxed">{tip}</p>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => navigate(`/student/flashcards/${topicSlug}`)}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-morpheus-accent hover:bg-morpheus-accent-light text-white font-medium text-sm rounded-xl transition-colors"
                >
                    <BookOpen size={16} />
                    Start Flashcard Session Now
                </button>
            </div>
        </StudentLayout>
    );
}
