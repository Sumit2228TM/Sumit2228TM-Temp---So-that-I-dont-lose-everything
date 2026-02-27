import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Users,
  MessageSquare,
  Video,
  LogOut,
  Menu,
  X,
  Brain,
  TrendingUp,
  Activity,
  Cpu,
  Globe,
  Radio,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";  //  ../store/auth.store
import { authApi } from "../../../src/api/auth.api";  //  ../api/auth.api
import { cn } from "../../../src/lib/utils";         //   ../lib/utils

const navItems = [
  { to: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/student/discovery", icon: Search, label: "Find Tutors" },
  { to: "/student/connections", icon: Users, label: "Connections" },
  { to: "/student/chat", icon: MessageSquare, label: "Messages" },
  { to: "/student/sessions", icon: Video, label: "Sessions" },
];

const aiNavItems = [
  { to: "/student/weakness-prediction", icon: Brain, label: "Weakness Predictor" },
  { to: "/student/learning-velocity", icon: TrendingUp, label: "Learning Velocity" },
  { to: "/student/concept-stability", icon: Activity, label: "Concept Stability" },
  { to: "/student/solver-profile", icon: Cpu, label: "Solver Profile" },
  { to: "/student/concept-transfer", icon: Globe, label: "Transfer Score" },
  { to: "/student/live-users", icon: Radio, label: "Live Platform" },
];

function NavItem({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-morpheus-accent text-white shadow-lg shadow-morpheus-accent/20"
            : "text-morpheus-muted hover:text-morpheus-text hover:bg-morpheus-surface"
        )
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function StudentLayout({ children }: { children: ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch { }
    clearAuth();
    navigate("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-morpheus-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-morpheus-accent flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L19.5 7V15L11 20L2.5 15V7L11 2Z" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="11" cy="11" r="2" fill="white" />
            </svg>
          </div>
          <span className="font-display text-lg font-semibold text-morpheus-text">
            Morpheus
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>
        {/* AI Features */}
        <div className="mt-4 pt-4 border-t border-morpheus-border">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-morpheus-muted">AI Insights</p>
          <div className="space-y-1">
            {aiNavItems.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-morpheus-border space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-morpheus-accent/20 border border-morpheus-accent/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-morpheus-accent">
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-morpheus-text truncate">
              {user?.name}
            </p>
            <p className="text-xs text-morpheus-muted truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-morpheus-muted hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut size={18} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-morpheus-bg flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-morpheus-border bg-morpheus-bg fixed inset-y-0 left-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 w-60 bg-morpheus-bg border-r border-morpheus-border flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-morpheus-muted hover:text-morpheus-text"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-morpheus-border bg-morpheus-bg sticky top-0 z-10">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-morpheus-muted hover:text-morpheus-text"
          >
            <Menu size={22} />
          </button>
          <span className="font-display font-semibold text-morpheus-text">
            Morpheus
          </span>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
