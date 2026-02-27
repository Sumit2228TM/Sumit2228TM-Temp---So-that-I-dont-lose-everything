/*import { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

// Auth pages
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage";

// ─── Route Guards ─────────────────────────────────────────────────────────────

import { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

// Auth pages
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage";

// Onboarding pages
import StudentOnboardingPage from "../pages/onboarding/StudentOnboardingPage";
import TutorOnboardingPage from "../pages/onboarding/TutorOnboardingPage";

// ─── Route Guards ─────────────────────────────────────────────────────────────

/** Redirects to /login if not authenticated */








/**The below code is updated while building the Onboarding page */
/*import { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage";
import StudentOnboardingPage from "../pages/onboarding/StudentOnboardingPage";
import TutorOnboardingPage from "../pages/onboarding/TutorOnboardingPage";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** Redirects authenticated users away from auth pages */
/*function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "tutor") return <Navigate to="/tutor/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return <>{children}</>;
}*/

/** Only allows specific roles through */
/*function RoleRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: string[];
}) {
  const user = useAuthStore((s) => s.user);
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}

// ─── Router ───────────────────────────────────────────────────────────────────

/*export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public auth routes ─────────────────────────────────────── */
/*  <Route
    path="/signup"
    element={
      <PublicRoute>
        <SignupPage />
      </PublicRoute>
    }
  />
  <Route
    path="/login"
    element={
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    }
  />
  <Route path="/verify-email" element={<VerifyOtpPage />} />

  {/* ── Onboarding routes ──────────────────────────────────────── */
/*    <Route
      path="/student/onboarding"
      element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={["student"]}>
            <StudentOnboardingPage />
          </RoleRoute>
        </ProtectedRoute>
      }
    />
    <Route
      path="/tutor/onboarding"
      element={
        <ProtectedRoute>
          <RoleRoute allowedRoles={["tutor"]}>
            <TutorOnboardingPage />
          </RoleRoute>
        </ProtectedRoute>
      }
    />

    {/* ── Dashboard placeholders (will be replaced next) ─────────── */
/*  <Route
    path="/student/dashboard"
    element={
      <ProtectedRoute>
        <RoleRoute allowedRoles={["student"]}>
          <div className="p-8 text-morpheus-text font-display">
            Student Dashboard (coming soon)
          </div>
        </RoleRoute>
      </ProtectedRoute>
    }
  />
  <Route
    path="/tutor/dashboard"
    element={
      <ProtectedRoute>
        <RoleRoute allowedRoles={["tutor"]}>
          <div className="p-8 text-morpheus-text font-display">
            Tutor Dashboard (coming soon)
          </div>
        </RoleRoute>
      </ProtectedRoute>
    }
  />
  <Route
    path="/admin/dashboard"
    element={
      <ProtectedRoute>
        <RoleRoute allowedRoles={["admin"]}>
          <div className="p-8 text-morpheus-text font-display">
            Admin Dashboard (coming soon)
          </div>
        </RoleRoute>
      </ProtectedRoute>
    }
  />

 /* {/* ── Fallbacks ───────────────────────────────────────────────── */
/*  <Route path="/" element={<Navigate to="/login" replace />} />
  <Route
    path="/unauthorized"
    element={
      <div className="p-8 text-red-400 font-display">Access Denied</div>
    }
  />
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
</BrowserRouter>
);
/*}*/








/*This below code is updated code while building student dashboard*/
/*import { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

// Auth pages
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage";

// Onboarding pages
import StudentOnboardingPage from "../pages/onboarding/StudentOnboardingPage";
import TutorOnboardingPage from "../pages/onboarding/TutorOnboardingPage";

// Student pages
import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import DiscoveryPage from "../pages/student/DiscoveryPage";
import TutorProfilePage from "../pages/student/TutorProfilePage";

// ─── Route Guards ─────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "tutor") return <Navigate to="/tutor/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return <>{children}</>;
}

function RoleRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: string[];
}) {
  const user = useAuthStore((s) => s.user);
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public auth routes ─────────────────────────────────────── */
/* <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
 <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
 <Route path="/verify-email" element={<VerifyOtpPage />} />

 {/* ── Onboarding ─────────────────────────────────────────────── */
/*   <Route
     path="/student/onboarding"
     element={
       <ProtectedRoute>
         <RoleRoute allowedRoles={["student"]}>
           <StudentOnboardingPage />
         </RoleRoute>
       </ProtectedRoute>
     }
   />
   <Route
     path="/tutor/onboarding"
     element={
       <ProtectedRoute>
         <RoleRoute allowedRoles={["tutor"]}>
           <TutorOnboardingPage />
         </RoleRoute>
       </ProtectedRoute>
     }
   />

   {/* ── Student routes ─────────────────────────────────────────── */
/*      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["student"]}>
              <StudentDashboardPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/discovery"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["student"]}>
              <DiscoveryPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/tutors/:tutorId"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["student"]}>
              <TutorProfilePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* ── Tutor + Admin placeholders ─────────────────────────────── */
/*   <Route
     path="/tutor/dashboard"
     element={
       <ProtectedRoute>
         <RoleRoute allowedRoles={["tutor"]}>
           <div className="p-8 text-morpheus-text font-display">
             Tutor Dashboard (coming soon)
           </div>
         </RoleRoute>
       </ProtectedRoute>
     }
   />
   <Route
     path="/admin/dashboard"
     element={
       <ProtectedRoute>
         <RoleRoute allowedRoles={["admin"]}>
           <div className="p-8 text-morpheus-text font-display">
             Admin Dashboard (coming soon)
           </div>
         </RoleRoute>
       </ProtectedRoute>
     }
   />

   {/* ── Fallbacks ───────────────────────────────────────────────── */
/*    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/unauthorized" element={<div className="p-8 text-red-400">Access Denied</div>} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
</BrowserRouter>
);
}*///







/**The below code is written While building the Tutor side dashboard */

/*import { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

// Auth pages
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage";

// Onboarding pages
import StudentOnboardingPage from "../pages/onboarding/StudentOnboardingPage";
import TutorOnboardingPage from "../pages/onboarding/TutorOnboardingPage";

// Student pages
import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import DiscoveryPage from "../pages/student/DiscoveryPage";
import TutorProfilePage from "../pages/student/TutorProfilePage";

// Tutor pages
import TutorDashboardPage from "../pages/tutor/TutorDashboardPage";
import ConnectionRequestsPage from "../pages/tutor/ConnectionRequestsPage";
import MyStudentsPage from "../pages/tutor/MyStudentsPage";

// ─── Route Guards ─────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "tutor") return <Navigate to="/tutor/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return <>{children}</>;
}

function RoleRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: string[];
}) {
  const user = useAuthStore((s) => s.user);
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public auth routes ─────────────────────────────────────── */
/*   <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
   <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
   <Route path="/verify-email" element={<VerifyOtpPage />} />

   {/* ── Onboarding ─────────────────────────────────────────────── */
/*      <Route path="/student/onboarding" element={
        <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentOnboardingPage /></RoleRoute></ProtectedRoute>
      } />
      <Route path="/tutor/onboarding" element={
        <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorOnboardingPage /></RoleRoute></ProtectedRoute>
      } />

      {/* ── Student routes ─────────────────────────────────────────── */
/*       <Route path="/student/dashboard" element={
         <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentDashboardPage /></RoleRoute></ProtectedRoute>
       } />
       <Route path="/student/discovery" element={
         <ProtectedRoute><RoleRoute allowedRoles={["student"]}><DiscoveryPage /></RoleRoute></ProtectedRoute>
       } />
       <Route path="/student/tutors/:tutorId" element={
         <ProtectedRoute><RoleRoute allowedRoles={["student"]}><TutorProfilePage /></RoleRoute></ProtectedRoute>
       } />

       {/* ── Tutor routes ───────────────────────────────────────────── */
/*      <Route path="/tutor/dashboard" element={
        <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorDashboardPage /></RoleRoute></ProtectedRoute>
      } />
      <Route path="/tutor/requests" element={
        <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><ConnectionRequestsPage /></RoleRoute></ProtectedRoute>
      } />
      <Route path="/tutor/students" element={
        <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><MyStudentsPage /></RoleRoute></ProtectedRoute>
      } />

      {/* ── Placeholder routes ─────────────────────────────────────── */
/*      <Route path="/student/connections" element={
        <ProtectedRoute><RoleRoute allowedRoles={["student"]}>
          <div className="p-8 text-morpheus-text font-display">Connections (coming soon)</div>
        </RoleRoute></ProtectedRoute>
      } />
      <Route path="/student/chat" element={
        <ProtectedRoute><RoleRoute allowedRoles={["student"]}>
          <div className="p-8 text-morpheus-text font-display">Chat (coming soon)</div>
        </RoleRoute></ProtectedRoute>
      } />
      <Route path="/student/sessions" element={
        <ProtectedRoute><RoleRoute allowedRoles={["student"]}>
          <div className="p-8 text-morpheus-text font-display">Sessions (coming soon)</div>
        </RoleRoute></ProtectedRoute>
      } />
      <Route path="/tutor/chat" element={
        <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}>
          <div className="p-8 text-morpheus-text font-display">Chat (coming soon)</div>
        </RoleRoute></ProtectedRoute>
      } />
      <Route path="/tutor/sessions" element={
        <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}>
          <div className="p-8 text-morpheus-text font-display">Sessions (coming soon)</div>
        </RoleRoute></ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute><RoleRoute allowedRoles={["admin"]}>
          <div className="p-8 text-morpheus-text font-display">Admin Dashboard (coming soon)</div>
        </RoleRoute></ProtectedRoute>
      } />

      {/* ── Fallbacks ───────────────────────────────────────────────── */
/*     <Route path="/" element={<Navigate to="/login" replace />} />
     <Route path="/unauthorized" element={<div className="p-8 text-red-400">Access Denied</div>} />
     <Route path="*" element={<Navigate to="/login" replace />} />
   </Routes>
 </BrowserRouter>
);
}*/






/**Below code is updated while building admin panel] */

/*import { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

// Auth
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage";

// Onboarding
import StudentOnboardingPage from "../pages/onboarding/StudentOnboardingPage";
import TutorOnboardingPage from "../pages/onboarding/TutorOnboardingPage";

// Student
import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import DiscoveryPage from "../pages/student/DiscoveryPage";
import TutorProfilePage from "../pages/student/TutorProfilePage";

// Tutor
import TutorDashboardPage from "../pages/tutor/TutorDashboardPage";
import ConnectionRequestsPage from "../pages/tutor/ConnectionRequestsPage";
import MyStudentsPage from "../pages/tutor/MyStudentsPage";

// Admin
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import TutorManagementPage from "../pages/admin/TutorManagementPage";
import AdminStudentsPage from "../pages/admin/AdminStudentsPage";

// ─── Guards ───────────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "tutor") return <Navigate to="/tutor/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return <>{children}</>;
}

function RoleRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-morpheus-bg flex items-center justify-center">
      <p className="font-display text-morpheus-muted">{label} — coming soon</p>
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */
/*  <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
  <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
  <Route path="/verify-email" element={<VerifyOtpPage />} />

  {/* Onboarding */
/*  <Route path="/student/onboarding" element={
    <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentOnboardingPage /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/tutor/onboarding" element={
    <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorOnboardingPage /></RoleRoute></ProtectedRoute>
  } />

/*  {/* Student */
/*    <Route path="/student/dashboard" element={
      <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentDashboardPage /></RoleRoute></ProtectedRoute>
    } />
    <Route path="/student/discovery" element={
      <ProtectedRoute><RoleRoute allowedRoles={["student"]}><DiscoveryPage /></RoleRoute></ProtectedRoute>
    } />
    <Route path="/student/tutors/:tutorId" element={
      <ProtectedRoute><RoleRoute allowedRoles={["student"]}><TutorProfilePage /></RoleRoute></ProtectedRoute>
    } />
    <Route path="/student/connections" element={
      <ProtectedRoute><RoleRoute allowedRoles={["student"]}><Placeholder label="Connections" /></RoleRoute></ProtectedRoute>
    } />
    <Route path="/student/chat" element={
      <ProtectedRoute><RoleRoute allowedRoles={["student"]}><Placeholder label="Messages" /></RoleRoute></ProtectedRoute>
    } />
    <Route path="/student/sessions" element={
      <ProtectedRoute><RoleRoute allowedRoles={["student"]}><Placeholder label="Sessions" /></RoleRoute></ProtectedRoute>
    } />

  /*  {/* Tutor */
/*  <Route path="/tutor/dashboard" element={
    <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorDashboardPage /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/tutor/requests" element={
    <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><ConnectionRequestsPage /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/tutor/students" element={
    <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><MyStudentsPage /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/tutor/chat" element={
    <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><Placeholder label="Messages" /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/tutor/sessions" element={
    <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><Placeholder label="Sessions" /></RoleRoute></ProtectedRoute>
  } />

/*   {/* Admin */
/* <Route path="/admin/dashboard" element={
   <ProtectedRoute><RoleRoute allowedRoles={["admin"]}><AdminDashboardPage /></RoleRoute></ProtectedRoute>
 } />
 <Route path="/admin/tutors" element={
   <ProtectedRoute><RoleRoute allowedRoles={["admin"]}><TutorManagementPage /></RoleRoute></ProtectedRoute>
 } />
 <Route path="/admin/students" element={
   <ProtectedRoute><RoleRoute allowedRoles={["admin"]}><AdminStudentsPage /></RoleRoute></ProtectedRoute>
 } />

/*   {/* Fallbacks */
/*  <Route path="/" element={<Navigate to="/login" replace />} />
  <Route path="/unauthorized" element={<div className="p-8 text-red-400">Access Denied</div>} />
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
</BrowserRouter>
);
}*/









///The below code is written for solving issue of tutors not found on admin panel and also the students features are completely removed

/*import { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

// Auth
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage";

// Onboarding
import StudentOnboardingPage from "../pages/onboarding/StudentOnboardingPage";
import TutorOnboardingPage from "../pages/onboarding/TutorOnboardingPage";

// Student
import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import DiscoveryPage from "../pages/student/DiscoveryPage";
import TutorProfilePage from "../pages/student/TutorProfilePage";

// Tutor
import TutorDashboardPage from "../pages/tutor/TutorDashboardPage";
import ConnectionRequestsPage from "../pages/tutor/ConnectionRequestsPage";
import MyStudentsPage from "../pages/tutor/MyStudentsPage";

// Admin
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import TutorManagementPage from "../pages/admin/TutorManagementPage";

// ─── Guards ───────────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "tutor") return <Navigate to="/tutor/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return <>{children}</>;
}

function RoleRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-morpheus-bg flex items-center justify-center">
      <p className="font-display text-morpheus-muted">{label} — coming soon</p>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */
/*  <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
  <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
  <Route path="/verify-email" element={<VerifyOtpPage />} />

  {/* Onboarding */
/* <Route path="/student/onboarding" element={
   <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentOnboardingPage /></RoleRoute></ProtectedRoute>
 } />
/*  <Route path="/tutor/onboarding" element={
   <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorOnboardingPage /></RoleRoute></ProtectedRoute>
 } />

 {/* Student */
/*  <Route path="/student/dashboard" element={
    <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentDashboardPage /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/student/discovery" element={
    <ProtectedRoute><RoleRoute allowedRoles={["student"]}><DiscoveryPage /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/student/tutors/:tutorId" element={
    <ProtectedRoute><RoleRoute allowedRoles={["student"]}><TutorProfilePage /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/student/connections" element={
    <ProtectedRoute><RoleRoute allowedRoles={["student"]}><Placeholder label="Connections" /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/student/chat" element={
    <ProtectedRoute><RoleRoute allowedRoles={["student"]}><Placeholder label="Messages" /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/student/sessions" element={
    <ProtectedRoute><RoleRoute allowedRoles={["student"]}><Placeholder label="Sessions" /></RoleRoute></ProtectedRoute>
  } />

/*  {/* Tutor */
/*  <Route path="/tutor/dashboard" element={
    <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorDashboardPage /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/tutor/requests" element={
    <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><ConnectionRequestsPage /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/tutor/students" element={
    <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><MyStudentsPage /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/tutor/chat" element={
    <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><Placeholder label="Messages" /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/tutor/sessions" element={
    <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><Placeholder label="Sessions" /></RoleRoute></ProtectedRoute>
  } />

  {/* Admin */
/*  <Route path="/admin/dashboard" element={
    <ProtectedRoute><RoleRoute allowedRoles={["admin"]}><AdminDashboardPage /></RoleRoute></ProtectedRoute>
  } />
  <Route path="/admin/tutors" element={
    <ProtectedRoute><RoleRoute allowedRoles={["admin"]}><TutorManagementPage /></RoleRoute></ProtectedRoute>
  } />

/*   {/* Fallbacks */
/*  <Route path="/" element={<Navigate to="/login" replace />} />
  <Route path="/unauthorized" element={<div className="p-8 text-red-400">Access Denied</div>} />
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
</BrowserRouter>
);
}*/



//This code is fixed while building chat feature

/*import { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

// Auth
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage";

// Onboarding
import StudentOnboardingPage from "../pages/onboarding/StudentOnboardingPage";
import TutorOnboardingPage from "../pages/onboarding/TutorOnboardingPage";

// Student
import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import DiscoveryPage from "../pages/student/DiscoveryPage";
import TutorProfilePage from "../pages/student/TutorProfilePage";
import StudentChatPage from "../pages/student/StudentChatPage";

// Tutor
import TutorDashboardPage from "../pages/tutor/TutorDashboardPage";
import ConnectionRequestsPage from "../pages/tutor/ConnectionRequestsPage";
import MyStudentsPage from "../pages/tutor/MyStudentsPage";
import TutorChatPage from "../pages/tutor/TutorChatPage";

// Admin
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import TutorManagementPage from "../pages/admin/TutorManagementPage";

// ─── Guards ───────────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "tutor") return <Navigate to="/tutor/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return <>{children}</>;
}

function RoleRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-morpheus-bg flex items-center justify-center">
      <p className="font-display text-morpheus-muted">{label} — coming soon</p>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */
/*       <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
       <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
       <Route path="/verify-email" element={<VerifyOtpPage />} />

       {/* Onboarding */
/*       <Route path="/student/onboarding" element={
         <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentOnboardingPage /></RoleRoute></ProtectedRoute>
       } />
       <Route path="/tutor/onboarding" element={
         <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorOnboardingPage /></RoleRoute></ProtectedRoute>
       } />

       {/* Student */
/*     <Route path="/student/dashboard" element={
       <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentDashboardPage /></RoleRoute></ProtectedRoute>
     } />
     <Route path="/student/discovery" element={
       <ProtectedRoute><RoleRoute allowedRoles={["student"]}><DiscoveryPage /></RoleRoute></ProtectedRoute>
     } />
     <Route path="/student/tutors/:tutorId" element={
       <ProtectedRoute><RoleRoute allowedRoles={["student"]}><TutorProfilePage /></RoleRoute></ProtectedRoute>
     } />
     <Route path="/student/chat" element={
       <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentChatPage /></RoleRoute></ProtectedRoute>
     } />
     <Route path="/student/connections" element={
       <ProtectedRoute><RoleRoute allowedRoles={["student"]}><Placeholder label="Connections" /></RoleRoute></ProtectedRoute>
     } />
     <Route path="/student/sessions" element={
       <ProtectedRoute><RoleRoute allowedRoles={["student"]}><Placeholder label="Sessions" /></RoleRoute></ProtectedRoute>
     } />

     {/* Tutor */
/*       <Route path="/tutor/dashboard" element={
         <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorDashboardPage /></RoleRoute></ProtectedRoute>
       } />
       <Route path="/tutor/requests" element={
         <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><ConnectionRequestsPage /></RoleRoute></ProtectedRoute>
       } />
       <Route path="/tutor/students" element={
         <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><MyStudentsPage /></RoleRoute></ProtectedRoute>
       } />
       <Route path="/tutor/chat" element={
         <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorChatPage /></RoleRoute></ProtectedRoute>
       } />
       <Route path="/tutor/sessions" element={
         <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><Placeholder label="Sessions" /></RoleRoute></ProtectedRoute>
       } />

       {/* Admin */
/*       <Route path="/admin/dashboard" element={
         <ProtectedRoute><RoleRoute allowedRoles={["admin"]}><AdminDashboardPage /></RoleRoute></ProtectedRoute>
       } />
       <Route path="/admin/tutors" element={
         <ProtectedRoute><RoleRoute allowedRoles={["admin"]}><TutorManagementPage /></RoleRoute></ProtectedRoute>
       } />

       {/* Fallbacks */
/*       <Route path="/" element={<Navigate to="/login" replace />} />
       <Route path="/unauthorized" element={<div className="p-8 text-red-400">Access Denied</div>} />
       <Route path="*" element={<Navigate to="/login" replace />} />
     </Routes>
   </BrowserRouter>
 );
}*/











///Below code is written for building the feature of schedule session
import { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

// Auth
import SignupPage from "../pages/auth/SignupPage";
import LoginPage from "../pages/auth/LoginPage";
import VerifyOtpPage from "../pages/auth/VerifyOtpPage";

// Onboarding
import StudentOnboardingPage from "../pages/onboarding/StudentOnboardingPage";
import TutorOnboardingPage from "../pages/onboarding/TutorOnboardingPage";

// Student
import StudentDashboardPage from "../pages/student/StudentDashboardPage";
import DiscoveryPage from "../pages/student/DiscoveryPage";
import TutorProfilePage from "../pages/student/TutorProfilePage";
import StudentChatPage from "../pages/student/StudentChatPage";
import StudentSessionsPage from "../pages/student/StudentSessionsPage";  //    ../pages/student/StudentSessionsPage
import WeaknessPredictionPage from "../pages/student/WeaknessPredictionPage";
import LearningVelocityPage from "../pages/student/LearningVelocityPage";
import ConceptStabilityPage from "../pages/student/ConceptStabilityPage";
import RevisionSessionPage from "../pages/student/RevisionSessionPage";
import FlashcardsPage from "../pages/student/FlashcardsPage";
import SolverProfilePage from "../pages/student/SolverProfilePage";
import ConceptTransferPage from "../pages/student/ConceptTransferPage";

// Tutor
import TutorDashboardPage from "../pages/tutor/TutorDashboardPage";
import ConnectionRequestsPage from "../pages/tutor/ConnectionRequestsPage";
import MyStudentsPage from "../pages/tutor/MyStudentsPage";
import TutorChatPage from "../pages/tutor/TutorChatPage";
import TutorSessionsPage from "../pages/tutor/TutorSessionsPage";     //       ../pages/tutor/TutorSessionsPage

// Admin
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import TutorManagementPage from "../pages/admin/TutorManagementPage";

// Video call
import VideoCallPage from "../../src/pages/VideoCallPage";            //             ../pages/VideoCallPage

// ─── Guards ───────────────────────────────────────────────────────────────────

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "tutor") return <Navigate to="/tutor/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }
  return <>{children}</>;
}

function RoleRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const user = useAuthStore((s) => s.user);
  if (!user || !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="min-h-screen bg-morpheus-bg flex items-center justify-center">
      <p className="font-display text-morpheus-muted">{label} — coming soon</p>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/verify-email" element={<VerifyOtpPage />} />

        {/* Onboarding */}
        <Route path="/student/onboarding" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentOnboardingPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/tutor/onboarding" element={
          <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorOnboardingPage /></RoleRoute></ProtectedRoute>
        } />

        {/* Student */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentDashboardPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/student/discovery" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><DiscoveryPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/student/tutors/:tutorId" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><TutorProfilePage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/student/chat" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentChatPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/student/connections" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><Placeholder label="Connections" /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/student/sessions" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><StudentSessionsPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/student/weakness-prediction" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><WeaknessPredictionPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/student/learning-velocity" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><LearningVelocityPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/student/concept-stability" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><ConceptStabilityPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/student/revision/:topicSlug" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><RevisionSessionPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/student/flashcards/:topicSlug" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><FlashcardsPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/student/solver-profile" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><SolverProfilePage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/student/concept-transfer" element={
          <ProtectedRoute><RoleRoute allowedRoles={["student"]}><ConceptTransferPage /></RoleRoute></ProtectedRoute>
        } />

        {/* Tutor */}
        <Route path="/tutor/dashboard" element={
          <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorDashboardPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/tutor/requests" element={
          <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><ConnectionRequestsPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/tutor/students" element={
          <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><MyStudentsPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/tutor/chat" element={
          <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorChatPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/tutor/sessions" element={
          <ProtectedRoute><RoleRoute allowedRoles={["tutor"]}><TutorSessionsPage /></RoleRoute></ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute><RoleRoute allowedRoles={["admin"]}><AdminDashboardPage /></RoleRoute></ProtectedRoute>
        } />
        <Route path="/admin/tutors" element={
          <ProtectedRoute><RoleRoute allowedRoles={["admin"]}><TutorManagementPage /></RoleRoute></ProtectedRoute>
        } />

        {/* Video call — accessible by both student and tutor */}
        <Route path="/call/:sessionId" element={
          <ProtectedRoute><VideoCallPage /></ProtectedRoute>
        } />

        {/* Fallbacks */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/unauthorized" element={<div className="p-8 text-red-400">Access Denied</div>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
