import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/shared/StudentLayout";
import {
  Brain, AlertTriangle, TrendingDown, Users, GitBranch,
  ChevronRight, Zap, Clock, Target, ArrowRight, BookOpen, Search, Calendar,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useLearningStore, type TopicState } from "../../store/learning.store";

// ─── Concept graph ─────────────────────────────────────────────────────────────

const graphLayout: Record<string, { x: number; y: number; label: string; deps: string[] }> = {
  "sets": { x: 80, y: 40, label: "Set Theory", deps: [] },
  "counting": { x: 260, y: 40, label: "Counting Principles", deps: ["sets"] },
  "permutations-combinations": { x: 180, y: 140, label: "Permutations", deps: ["counting"] },
  "probability": { x: 380, y: 140, label: "Combinations", deps: ["counting"] },
  "probability-applied": { x: 280, y: 240, label: "Probability", deps: ["permutations-combinations", "probability"] },
  "statistics": { x: 440, y: 240, label: "Statistics", deps: ["probability-applied"] },
};

type Prediction = {
  topic: string; slug: string; subject: string;
  probability: number; severity: "high" | "medium" | "low";
  examIn: string; score: number; accuracy: number; mistakes: number; reason: string;
};

// Map topic slug → whether stable (score ≥ 70)
function useGraphNodes(topics: TopicState[]) {
  const scoreMap: Record<string, number> = {};
  topics.forEach((t) => { scoreMap[t.slug] = t.score; });
  return Object.entries(graphLayout).map(([id, meta]) => ({
    id,
    ...meta,
    score: scoreMap[id] ?? 80, // if not in topics, assume stable
    stable: (scoreMap[id] ?? 80) >= 70,
  }));
}

// ─── Prediction builder — dynamically from topic data ─────────────────────────

function buildPredictions(topics: TopicState[]): Prediction[] {
  return topics
    .filter((t: TopicState) => t.stability !== "stable") // hide if stable
    .sort((a: TopicState, b: TopicState) => a.score - b.score)
    .slice(0, 6)
    .map((t) => {
      const prob = Math.max(15, Math.min(95, 100 - t.score));
      const severity: "high" | "medium" | "low" = prob >= 65 ? "high" : prob >= 40 ? "medium" : "low";
      const examIn = severity === "high" ? `${6 + Math.floor(t.mistakes)}d` : severity === "medium" ? `${18 + Math.floor(t.score / 10)}d` : "30d";
      return {
        topic: t.name, slug: t.slug, subject: t.subject,
        probability: prob, severity, examIn,
        score: t.score, accuracy: t.accuracy, mistakes: t.mistakes,
        reason: t.mistakes >= 6
          ? `${t.mistakes} repeated mistakes + last revised ${t.daysSince} days ago`
          : t.flashcardSessions === 0
            ? `No flashcard sessions yet · ${t.daysSince} days without revision`
            : `Accuracy at ${t.accuracy}% below safe threshold of 70%`,
      };
    });
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

const sev = {
  high: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "⚠ High Risk" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", label: "◐ Medium Risk" },
  low: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "○ Low Risk" },
};

function probBarColor(p: number) {
  return p >= 70 ? "bg-red-500" : p >= 45 ? "bg-amber-500" : "bg-emerald-500";
}

function PredictionCard({ p, onRevise, onFlashcards, onFindTutor }: {
  p: Prediction;
  onRevise: (slug: string) => void;
  onFlashcards: (slug: string) => void;
  onFindTutor: (subject: string) => void;
}): React.ReactElement {
  const [expanded, setExpanded] = useState(false);
  const cfg = sev[p.severity];
  return (
    <div className={cn("rounded-2xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-lg", cfg.bg)}
      onClick={() => setExpanded((v) => !v)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-semibold uppercase tracking-wider", cfg.color)}>{cfg.label}</span>
            <span className="text-xs text-morpheus-muted">· {p.subject}</span>
          </div>
          <p className="font-display text-base font-semibold text-morpheus-text mt-1">{p.topic}</p>
          <p className="text-xs text-morpheus-muted mt-0.5">Exam in {p.examIn}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn("text-2xl font-bold font-display", cfg.color)}>{p.probability}%</p>
          <p className="text-[10px] text-morpheus-muted">struggle prob.</p>
        </div>
      </div>

      <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", probBarColor(p.probability))} style={{ width: `${p.probability}%` }} />
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs text-morpheus-muted mb-1">Why?</p>
          <p className="text-xs text-morpheus-text mb-3">{p.reason}</p>
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div><p className="text-xs font-bold text-morpheus-text">{p.score}</p><p className="text-[10px] text-morpheus-muted">stability</p></div>
            <div><p className="text-xs font-bold text-morpheus-text">{p.accuracy}%</p><p className="text-[10px] text-morpheus-muted">accuracy</p></div>
            <div><p className={cn("text-xs font-bold", p.mistakes >= 6 ? "text-red-400" : "text-morpheus-text")}>{p.mistakes}x</p><p className="text-[10px] text-morpheus-muted">mistakes</p></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => onFlashcards(p.slug)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-morpheus-accent/10 border border-morpheus-accent/20 text-morpheus-accent text-xs font-medium hover:bg-morpheus-accent/20 transition-colors">
              <BookOpen size={12} /> Flashcards
            </button>
            <button onClick={() => onFindTutor(p.subject)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors">
              <Search size={12} /> Find Tutor
            </button>
            <button onClick={() => onRevise(p.slug)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-morpheus-surface border border-morpheus-border text-morpheus-muted text-xs font-medium hover:text-morpheus-text transition-colors">
              All options <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <ChevronRight size={14} className={cn("text-morpheus-muted transition-transform duration-200", expanded && "rotate-90")} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WeaknessPredictionPage() {
  const navigate = useNavigate();
  const topics = useLearningStore((s) => s.topics);
  const mistakes = useLearningStore((s) => s.mistakes);
  const getPeerScores = useLearningStore((s) => s.getPeerScores);

  const [activeTab, setActiveTab] = useState<"predictions" | "graph" | "peers" | "timeline">("predictions");
  const [peerTopicSlug, setPeerTopicSlug] = useState("permutations-combinations");

  const predictions = buildPredictions(topics);
  const topHighRisk = predictions.find((p) => p.severity === "high") ?? predictions[0];
  const graphNodes = useGraphNodes(topics);

  const handleRevise = (slug: string) => navigate(`/student/revision/${slug}`);
  const handleFlashcards = (slug: string) => navigate(`/student/flashcards/${slug}`);
  const handleFindTutor = (subject: string) => navigate(`/student/discovery?subject=${encodeURIComponent(subject)}`);
  const handleEmergencyRevision = () => { if (topHighRisk) navigate(`/student/revision/${topHighRisk.slug}`); };

  const peerScores = getPeerScores(peerTopicSlug);

  const fragileTopics = topics.filter((t) => t.stability === "fragile");
  const correctableMistakes = mistakes.filter((m) => !m.corrected);
  const correctedMistakes = mistakes.filter((m) => m.corrected);

  return (
    <StudentLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Brain size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-morpheus-text">Weakness Prediction Engine</h1>
            <p className="text-sm text-morpheus-muted">AI risk analysis · updates live after every flashcard session</p>
          </div>
        </div>

        {/* Hero alert */}
        {topHighRisk ? (
          <div className="mt-5 relative rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent p-5 overflow-hidden">
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-400 animate-ping" />
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-400" />
            <div className="flex items-start gap-3">
              <AlertTriangle size={22} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-display font-semibold text-morpheus-text text-base">
                  High probability you'll struggle with{" "}
                  <span className="text-red-400">{topHighRisk.topic}</span> in your upcoming exam.
                </p>
                <p className="text-xs text-morpheus-muted mt-1">
                  {topHighRisk.reason} · {topHighRisk.probability}% predicted difficulty.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={handleEmergencyRevision}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
                    <Zap size={12} /> Schedule emergency revision
                  </button>
                  <button onClick={() => handleFlashcards(topHighRisk.slug)}
                    className="flex items-center gap-1.5 text-xs font-medium text-morpheus-accent border border-morpheus-accent/30 bg-morpheus-accent/10 px-3 py-1.5 rounded-lg hover:bg-morpheus-accent/20 transition-colors">
                    <BookOpen size={12} /> Quick flashcards
                  </button>
                  <button onClick={() => handleFindTutor(topHighRisk.subject)}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-400 border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors">
                    <Search size={12} /> Find a tutor
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
            <p className="font-display font-semibold text-emerald-400">🎉 No high-risk topics detected!</p>
            <p className="text-xs text-morpheus-muted mt-1">Keep up your flashcard sessions to maintain this momentum.</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "High Risk Topics", value: String(predictions.filter(p => p.severity === "high").length), icon: AlertTriangle, color: "text-red-400 bg-red-500/10" },
          { label: "Medium Risk", value: String(predictions.filter(p => p.severity === "medium").length), icon: TrendingDown, color: "text-amber-400 bg-amber-500/10" },
          { label: "Uncorrected Mistakes", value: String(correctableMistakes.length), icon: Users, color: "text-blue-400 bg-blue-500/10" },
          { label: "Resolved by Practice", value: String(correctedMistakes.length), icon: Target, color: "text-emerald-400 bg-emerald-500/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-4">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", s.color)}>
              <s.icon size={18} />
            </div>
            <p className="text-xl font-bold font-display text-morpheus-text">{s.value}</p>
            <p className="text-xs text-morpheus-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-morpheus-surface border border-morpheus-border rounded-xl p-1 flex-wrap">
        {(["predictions", "graph", "peers", "timeline"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 min-w-[80px]",
              activeTab === tab ? "bg-morpheus-accent text-white shadow-lg" : "text-morpheus-muted hover:text-morpheus-text")}>
            {tab === "graph" ? "Concept Graph" : tab === "peers" ? "Peer Data" : tab === "timeline" ? "Mistake Log" : "Predictions"}
          </button>
        ))}
      </div>

      {/* Predictions tab */}
      {activeTab === "predictions" && (
        <div className="space-y-3">
          {predictions.length === 0 ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
              <p className="text-emerald-400 font-semibold font-display text-lg">🎉 No weak topics remaining!</p>
              <p className="text-xs text-morpheus-muted mt-2">You've practiced enough to push all topics to stable. Keep it up!</p>
            </div>
          ) : (
            predictions.map((p) => (
              <PredictionCard key={p.topic} p={p} onRevise={handleRevise} onFlashcards={handleFlashcards} onFindTutor={handleFindTutor} />
            ))
          )}
        </div>
      )}

      {/* Concept Graph tab */}
      {activeTab === "graph" && (
        <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5">
          <h3 className="font-display font-semibold text-morpheus-text mb-1">Concept Dependency Graph</h3>
          <p className="text-xs text-morpheus-muted mb-4">
            Node color updates in real time as you practice flashcards. Red = weak (score &lt; 70), Green = stable.
          </p>
          <div className="overflow-x-auto">
            <svg viewBox="0 0 540 300" className="w-full max-w-[540px] mx-auto">
              {graphNodes.map((n) =>
                n.deps.map((depId) => {
                  const dep = graphNodes.find((d) => d.id === depId);
                  if (!dep) return null;
                  return (
                    <line key={`${n.id}-${depId}`}
                      x1={dep.x + 55} y1={dep.y + 18}
                      x2={n.x + 55} y2={n.y + 18}
                      stroke="#1e1e2e" strokeWidth="2" />
                  );
                })
              )}
              {graphNodes.map((n) => (
                <g key={n.id} className="cursor-pointer" onClick={() => handleRevise(n.id)}>
                  <rect x={n.x} y={n.y} width={110} height={36} rx={10}
                    fill={n.stable ? "#0f1a12" : "#1a0f0f"}
                    stroke={n.stable ? "#22c55e" : "#ef4444"} strokeWidth="1.5">
                    <animate attributeName="opacity" values="1;0.85;1" dur="2s" repeatCount="indefinite"
                      begin={n.stable ? "indefinite" : "0s"} />
                  </rect>
                  <text x={n.x + 55} y={n.y + 22} textAnchor="middle"
                    fill={n.stable ? "#4ade80" : "#f87171"}
                    fontSize="11" fontFamily="DM Sans, sans-serif" fontWeight="600">
                    {n.label}
                  </text>
                  {!n.stable && (
                    <text x={n.x + 100} y={n.y + 10} fill="#f87171" fontSize="10">●</text>
                  )}
                </g>
              ))}
            </svg>
          </div>
          <div className="flex gap-4 mt-4 text-xs text-morpheus-muted flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500" />Stable (score ≥ 70)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/30 border border-red-500" />Weak — click to revise</span>
          </div>
          {graphNodes.filter(n => !n.stable).length > 0 && (
            <div className="mt-4 pt-4 border-t border-morpheus-border">
              <p className="text-xs text-morpheus-muted mb-3">Start revision for weak nodes:</p>
              <div className="flex flex-wrap gap-2">
                {graphNodes.filter(n => !n.stable).map(n => (
                  <button key={n.id} onClick={() => handleRevise(n.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">
                    <GitBranch size={11} /> {n.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Peer Data tab */}
      {activeTab === "peers" && (
        <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5">
          <h3 className="font-display font-semibold text-morpheus-text mb-1">Similar Student Data</h3>
          <div className="flex gap-2 flex-wrap mb-5 mt-2">
            {fragileTopics.concat(topics.filter(t => t.stability === "shaky").slice(0, 3)).slice(0, 5).map(t => (
              <button key={t.slug} onClick={() => setPeerTopicSlug(t.slug)}
                className={cn("px-3 py-1 rounded-lg border text-xs font-medium transition-all",
                  peerTopicSlug === t.slug
                    ? "bg-morpheus-accent/20 border-morpheus-accent/40 text-morpheus-accent"
                    : "border-morpheus-border text-morpheus-muted hover:text-morpheus-text")}>
                {t.name.split(" ")[0]}
              </button>
            ))}
          </div>
          <p className="text-xs text-morpheus-muted mb-4">
            Average score on <span className="text-morpheus-text">{topics.find(t => t.slug === peerTopicSlug)?.name}</span> for students with your profile:
          </p>
          <div className="space-y-4">
            {peerScores.map((p) => (
              <div key={p.label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-morpheus-text">{p.label}</span>
                  <span className="text-sm font-semibold text-morpheus-text">{p.score}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-700", p.color)} style={{ width: `${p.score}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 rounded-xl bg-morpheus-accent/10 border border-morpheus-accent/20">
            <p className="text-sm text-morpheus-text font-medium">
              📊 Students who revised 2+ times scored{" "}
              {Math.max(5, peerScores[1]?.score - peerScores[0]?.score ?? 30)}% higher on average.
            </p>
          </div>
          <button onClick={() => handleFindTutor(topics.find(t => t.slug === peerTopicSlug)?.subject ?? "Mathematics")}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-morpheus-accent hover:bg-morpheus-accent-light text-white font-medium text-sm rounded-xl transition-colors">
            <Search size={16} /> Find a Tutor for this Topic
          </button>
        </div>
      )}

      {/* Mistake Log tab */}
      {activeTab === "timeline" && (
        <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5">
          <h3 className="font-display font-semibold text-morpheus-text mb-1">Mistake Log</h3>
          <p className="text-xs text-morpheus-muted mb-5">
            Mistakes update automatically when you score well in flashcard sessions. Log is permanent — corrections are marked.
          </p>
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-morpheus-border" />
            <div className="space-y-4">
              {[...mistakes].sort((a, b) => b.timestamp - a.timestamp).map((m) => {
                const timeAgo = (() => {
                  const diff = Date.now() - m.timestamp;
                  const mins = Math.floor(diff / 60000);
                  if (mins < 60) return `${mins}m ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  return m.date;
                })();
                return (
                  <div key={m.id} className="flex gap-4 items-start relative">
                    <div className={cn("w-7 h-7 rounded-full border flex items-center justify-center shrink-0 z-10",
                      m.corrected
                        ? "bg-emerald-500/20 border-emerald-500/40"
                        : "bg-red-500/20 border-red-500/40")}>
                      <Clock size={12} className={m.corrected ? "text-emerald-400" : "text-red-400"} />
                    </div>
                    <div className={cn("flex-1 bg-morpheus-bg rounded-xl border p-3 transition-colors",
                      m.corrected ? "border-emerald-500/20" : "border-morpheus-border hover:border-white/10")}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-morpheus-text">{m.topicName}</p>
                          <p className="text-xs text-morpheus-muted mt-0.5">{m.type}</p>
                          {m.corrected && (
                            <p className="text-xs text-emerald-400 mt-1 font-medium">
                              ✅ Mistake corrected via flashcard practice
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <span className="text-xs text-morpheus-muted">{timeAgo}</span>
                          <p className="text-[10px] mt-0.5 text-morpheus-accent">{m.subject}</p>
                        </div>
                      </div>
                      {!m.corrected && (
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => handleFlashcards(m.topicSlug)}
                            className="text-[11px] text-morpheus-accent hover:underline flex items-center gap-1">
                            <BookOpen size={10} /> Flashcards
                          </button>
                          <span className="text-morpheus-border">·</span>
                          <button onClick={() => handleRevise(m.topicSlug)}
                            className="text-[11px] text-morpheus-muted hover:text-morpheus-text flex items-center gap-1">
                            Revise <ArrowRight size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={() => navigate("/student/sessions")}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 border border-morpheus-border text-morpheus-text text-sm font-medium rounded-xl hover:bg-morpheus-surface transition-colors">
            <Calendar size={16} /> Book a revision session
          </button>
        </div>
      )}
    </StudentLayout>
  );
}
