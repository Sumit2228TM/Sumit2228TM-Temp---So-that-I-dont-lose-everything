import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../../components/shared/StudentLayout";
import {
  Brain,
  AlertTriangle,
  TrendingDown,
  Users,
  GitBranch,
  ChevronRight,
  Zap,
  Clock,
  Target,
  ArrowRight,
  BookOpen,
  Search,
  Calendar,
} from "lucide-react";
import { cn } from "../../lib/utils";

// ─── Data ─────────────────────────────────────────────────────────────────────

const predictions = [
  {
    topic: "Permutations & Combinations",
    slug: "permutations-combinations",
    subject: "Mathematics",
    probability: 87,
    severity: "high" as const,
    examIn: "6 days",
    reason: "3 consecutive wrong answers + 0 revisions in 14 days",
  },
  {
    topic: "Integration by Parts",
    slug: "integration-by-parts",
    subject: "Calculus",
    probability: 71,
    severity: "high" as const,
    examIn: "11 days",
    reason: "Similar students score 40% lower on this subtopic",
  },
  {
    topic: "Thermodynamics Laws",
    slug: "thermodynamics",
    subject: "Physics",
    probability: 54,
    severity: "medium" as const,
    examIn: "18 days",
    reason: "Dependent on Kinetic Theory — which is unstable",
  },
  {
    topic: "Electrochemistry",
    slug: "electrochemistry",
    subject: "Chemistry",
    probability: 42,
    severity: "medium" as const,
    examIn: "22 days",
    reason: "Repeated mistakes in electrode potential calculations",
  },
  {
    topic: "Organic Reaction Mechanisms",
    slug: "organic-reactions",
    subject: "Chemistry",
    probability: 28,
    severity: "low" as const,
    examIn: "30 days",
    reason: "Minor gaps detected, peer data shows manageable risk",
  },
];

const mistakeTimeline = [
  { date: "Feb 18", topic: "Permutations", type: "Formula error", subject: "Maths", slug: "permutations-combinations" },
  { date: "Feb 20", topic: "Integration", type: "Wrong limits", subject: "Calculus", slug: "integration-by-parts" },
  { date: "Feb 21", topic: "Permutations", type: "Overcounting", subject: "Maths", slug: "permutations-combinations" },
  { date: "Feb 23", topic: "Thermodynamics", type: "Sign error", subject: "Physics", slug: "thermodynamics" },
  { date: "Feb 25", topic: "Permutations", type: "Concept gap", subject: "Maths", slug: "permutations-combinations" },
  { date: "Feb 26", topic: "Electrochemistry", type: "Formula error", subject: "Chemistry", slug: "electrochemistry" },
];

const graphNodes = [
  { id: "sets", label: "Set Theory", x: 80, y: 40, stable: true },
  { id: "counting", label: "Counting Principles", x: 260, y: 40, stable: true },
  { id: "perm", label: "Permutations", x: 180, y: 140, stable: false },
  { id: "comb", label: "Combinations", x: 380, y: 140, stable: false },
  { id: "prob", label: "Probability", x: 280, y: 240, stable: false },
  { id: "stats", label: "Statistics", x: 440, y: 240, stable: true },
];
const graphEdges = [
  { from: "sets", to: "counting" }, { from: "counting", to: "perm" },
  { from: "counting", to: "comb" }, { from: "perm", to: "prob" },
  { from: "comb", to: "prob" }, { from: "prob", to: "stats" },
];

const peerData = [
  { name: "Students like you", score: 43, color: "bg-red-500" },
  { name: "Students who revised", score: 82, color: "bg-emerald-500" },
  { name: "Top 10% students", score: 94, color: "bg-purple-500" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityColor(s: "high" | "medium" | "low") {
  if (s === "high") return "text-red-400";
  if (s === "medium") return "text-amber-400";
  return "text-emerald-400";
}
function severityBg(s: "high" | "medium" | "low") {
  if (s === "high") return "bg-red-500/10 border-red-500/30";
  if (s === "medium") return "bg-amber-500/10 border-amber-500/30";
  return "bg-emerald-500/10 border-emerald-500/30";
}
function probBarColor(p: number) {
  if (p >= 70) return "bg-red-500";
  if (p >= 45) return "bg-amber-500";
  return "bg-emerald-500";
}

// ─── Components ───────────────────────────────────────────────────────────────

function PredictionCard({ p, onRevise, onFlashcards, onFindTutor }: {
  p: typeof predictions[0];
  onRevise: (slug: string) => void;
  onFlashcards: (slug: string) => void;
  onFindTutor: (subject: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={cn("rounded-2xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-lg", severityBg(p.severity))}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-semibold uppercase tracking-wider", severityColor(p.severity))}>
              {p.severity === "high" ? "⚠ High Risk" : p.severity === "medium" ? "◐ Medium Risk" : "○ Low Risk"}
            </span>
            <span className="text-xs text-morpheus-muted">· {p.subject}</span>
          </div>
          <p className="font-display text-base font-semibold text-morpheus-text mt-1">{p.topic}</p>
          <p className="text-xs text-morpheus-muted mt-0.5">Exam in {p.examIn}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn("text-2xl font-bold font-display", severityColor(p.severity))}>{p.probability}%</p>
          <p className="text-[10px] text-morpheus-muted">struggle prob.</p>
        </div>
      </div>

      <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", probBarColor(p.probability))} style={{ width: `${p.probability}%` }} />
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
          <p className="text-xs text-morpheus-muted mb-3">{p.reason}</p>
          {/* Quick action buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onFlashcards(p.slug)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-morpheus-accent/10 border border-morpheus-accent/20 text-morpheus-accent text-xs font-medium hover:bg-morpheus-accent/20 transition-colors"
            >
              <BookOpen size={12} /> Flashcards
            </button>
            <button
              onClick={() => onFindTutor(p.subject)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
            >
              <Search size={12} /> Find Tutor
            </button>
            <button
              onClick={() => onRevise(p.slug)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-morpheus-surface border border-morpheus-border text-morpheus-muted text-xs font-medium hover:text-morpheus-text transition-colors"
            >
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
  const [activeTab, setActiveTab] = useState<"predictions" | "graph" | "peers" | "timeline">("predictions");

  const topHighRisk = predictions.find((p) => p.severity === "high");

  const handleRevise = (slug: string) => navigate(`/student/revision/${slug}`);
  const handleFlashcards = (slug: string) => navigate(`/student/flashcards/${slug}`);
  const handleFindTutor = (subject: string) => navigate(`/student/discovery?subject=${encodeURIComponent(subject)}`);
  const handleEmergencyRevision = () => {
    if (topHighRisk) navigate(`/student/revision/${topHighRisk.slug}`);
  };

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
            <p className="text-sm text-morpheus-muted">AI-powered risk analysis for your upcoming exams</p>
          </div>
        </div>

        {/* Hero alert */}
        <div className="mt-5 relative rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent p-5 overflow-hidden">
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-400 animate-ping" />
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-400" />
          <div className="flex items-start gap-3">
            <AlertTriangle size={22} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-display font-semibold text-morpheus-text text-base">
                High probability you'll struggle with{" "}
                <span className="text-red-400">{topHighRisk?.topic}</span> in your upcoming exam.
              </p>
              <p className="text-xs text-morpheus-muted mt-1">
                Based on your past {mistakeTimeline.filter(m => m.slug === topHighRisk?.slug).length} mistakes, zero revisions in {topHighRisk ? "14" : "—"} days, and patterns from 1,200+ similar students.
              </p>
              {/* Dynamic action buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={handleEmergencyRevision}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <Zap size={12} /> Schedule emergency revision
                </button>
                <button
                  onClick={() => topHighRisk && handleFlashcards(topHighRisk.slug)}
                  className="flex items-center gap-1.5 text-xs font-medium text-morpheus-accent border border-morpheus-accent/30 bg-morpheus-accent/10 px-3 py-1.5 rounded-lg hover:bg-morpheus-accent/20 transition-colors"
                >
                  <BookOpen size={12} /> Quick flashcards
                </button>
                <button
                  onClick={() => topHighRisk && handleFindTutor(topHighRisk.subject)}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-400 border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
                >
                  <Search size={12} /> Find a tutor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "High Risk Topics", value: String(predictions.filter(p => p.severity === "high").length), icon: AlertTriangle, color: "text-red-400 bg-red-500/10" },
          { label: "Medium Risk", value: String(predictions.filter(p => p.severity === "medium").length), icon: TrendingDown, color: "text-amber-400 bg-amber-500/10" },
          { label: "Similar Students", value: "1.2k", icon: Users, color: "text-blue-400 bg-blue-500/10" },
          { label: "Concepts Analysed", value: "34", icon: Target, color: "text-purple-400 bg-purple-500/10" },
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
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 min-w-[80px] capitalize",
              activeTab === tab ? "bg-morpheus-accent text-white shadow-lg" : "text-morpheus-muted hover:text-morpheus-text"
            )}
          >
            {tab === "graph" ? "Concept Graph" : tab === "peers" ? "Peer Data" : tab === "timeline" ? "Mistake Log" : "Predictions"}
          </button>
        ))}
      </div>

      {/* Tab: Predictions */}
      {activeTab === "predictions" && (
        <div className="space-y-3">
          <p className="text-xs text-morpheus-muted mb-4">Click any card to see detailed reason and quick action buttons.</p>
          {predictions.map((p) => (
            <PredictionCard key={p.topic} p={p} onRevise={handleRevise} onFlashcards={handleFlashcards} onFindTutor={handleFindTutor} />
          ))}
        </div>
      )}

      {/* Tab: Concept Graph */}
      {activeTab === "graph" && (
        <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5">
          <h3 className="font-display font-semibold text-morpheus-text mb-1">Concept Dependency Graph</h3>
          <p className="text-xs text-morpheus-muted mb-4">Red nodes are weak — they may cause cascading failures in dependent topics.</p>
          <div className="overflow-x-auto">
            <svg viewBox="0 0 540 300" className="w-full max-w-[540px] mx-auto">
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#1e1e2e" />
                </marker>
              </defs>
              {graphEdges.map((e) => {
                const from = graphNodes.find((n) => n.id === e.from)!;
                const to = graphNodes.find((n) => n.id === e.to)!;
                return (
                  <line key={`${e.from}-${e.to}`}
                    x1={from.x + 55} y1={from.y + 18} x2={to.x + 55} y2={to.y + 18}
                    stroke="#1e1e2e" strokeWidth="2" markerEnd="url(#arrow)" />
                );
              })}
              {graphNodes.map((n) => (
                <g key={n.id}>
                  <rect x={n.x} y={n.y} width={110} height={36} rx={10}
                    fill={n.stable ? "#0f1a12" : "#1a0f0f"}
                    stroke={n.stable ? "#22c55e" : "#ef4444"} strokeWidth="1.5"
                  />
                  <text x={n.x + 55} y={n.y + 22} textAnchor="middle"
                    fill={n.stable ? "#4ade80" : "#f87171"}
                    fontSize="11" fontFamily="DM Sans, sans-serif" fontWeight="600">
                    {n.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="flex gap-4 mt-4 text-xs text-morpheus-muted flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500" />Stable</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500/30 border border-red-500" />Weak</span>
          </div>
          <div className="mt-4 pt-4 border-t border-morpheus-border">
            <p className="text-xs text-morpheus-muted mb-3">Start revision for a weak concept:</p>
            <div className="flex flex-wrap gap-2">
              {graphNodes.filter(n => !n.stable).map(n => (
                <button
                  key={n.id}
                  onClick={() => handleRevise(n.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                >
                  <GitBranch size={11} /> {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Peer Data */}
      {activeTab === "peers" && (
        <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5">
          <h3 className="font-display font-semibold text-morpheus-text mb-1">Similar Student Data</h3>
          <p className="text-xs text-morpheus-muted mb-5">
            Average score on <span className="text-morpheus-text">Permutations</span> for students with your profile:
          </p>
          <div className="space-y-4">
            {peerData.map((p) => (
              <div key={p.name}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm text-morpheus-text">{p.name}</span>
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
              📊 Students who revised this topic <strong>2+ times</strong> scored 91% higher on average.
            </p>
          </div>
          <button
            onClick={() => handleFindTutor("Mathematics")}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-morpheus-accent hover:bg-morpheus-accent-light text-white font-medium text-sm rounded-xl transition-colors"
          >
            <Search size={16} /> Find a Maths Tutor
          </button>
        </div>
      )}

      {/* Tab: Mistake Timeline */}
      {activeTab === "timeline" && (
        <div className="rounded-2xl border border-morpheus-border bg-morpheus-surface p-5">
          <h3 className="font-display font-semibold text-morpheus-text mb-1">Past Mistake Log</h3>
          <p className="text-xs text-morpheus-muted mb-5">Your recorded errors from the last 10 days. Click any to start revision.</p>
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-px bg-morpheus-border" />
            <div className="space-y-4">
              {mistakeTimeline.map((m, i) => (
                <div key={i} className="flex gap-4 items-start relative">
                  <div className="w-7 h-7 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 z-10">
                    <Clock size={12} className="text-red-400" />
                  </div>
                  <div className="flex-1 bg-morpheus-bg rounded-xl border border-morpheus-border p-3 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-morpheus-text">{m.topic}</p>
                        <p className="text-xs text-morpheus-muted mt-0.5">{m.type}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-morpheus-muted">{m.date}</span>
                        <p className="text-[10px] mt-0.5 text-morpheus-accent">{m.subject}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleFlashcards(m.slug)}
                        className="text-[11px] text-morpheus-accent hover:underline flex items-center gap-1"
                      >
                        <BookOpen size={10} /> Flashcards
                      </button>
                      <span className="text-morpheus-border">·</span>
                      <button
                        onClick={() => handleRevise(m.slug)}
                        className="text-[11px] text-morpheus-muted hover:text-morpheus-text flex items-center gap-1"
                      >
                        Revise <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate("/student/sessions")}
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 border border-morpheus-border text-morpheus-text text-sm font-medium rounded-xl hover:bg-morpheus-surface transition-colors"
          >
            <Calendar size={16} /> Book a revision session
          </button>
        </div>
      )}
    </StudentLayout>
  );
}
