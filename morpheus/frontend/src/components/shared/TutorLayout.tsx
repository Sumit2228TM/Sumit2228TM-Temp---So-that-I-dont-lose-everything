import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Video,
  Star,
  LogOut,
  Menu,
  X,
  Clock,
  BookOpen,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";//  ../store/auth.store
import { authApi } from "../../api/auth.api"; // ../api/auth.api
import { cn } from "../../lib/utils";//   ../lib/utils

const navItems = [
  { to: "/tutor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tutor/requests", icon: Clock, label: "Requests" },
  { to: "/tutor/students", icon: Users, label: "My Students" },
  { to: "/tutor/chat", icon: MessageSquare, label: "Messages" },
  { to: "/tutor/sessions", icon: Video, label: "Sessions" },
  { to: "/tutor/doubts", icon: BookOpen, label: "Live Doubts ✨" },
];

function NavItem({
  to,
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/tutor/dashboard"}
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
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

interface TutorLayoutProps {
  children: ReactNode;
  pendingCount?: number;
}

export default function TutorLayout({ children, pendingCount }: TutorLayoutProps) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { }
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
          <span className="font-display text-lg font-semibold text-morpheus-text">Morpheus</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            badge={item.to === "/tutor/requests" ? pendingCount : undefined}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-morpheus-border space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-violet-400">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-morpheus-text truncate">{user?.name}</p>
            <p className="text-xs text-morpheus-muted">Tutor</p>
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

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 w-60 bg-morpheus-bg border-r border-morpheus-border flex flex-col">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-morpheus-muted hover:text-morpheus-text">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-morpheus-border bg-morpheus-bg sticky top-0 z-10">
          <button onClick={() => setMobileOpen(true)} className="text-morpheus-muted hover:text-morpheus-text">
            <Menu size={22} />
          </button>
          <span className="font-display font-semibold text-morpheus-text">Morpheus</span>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
