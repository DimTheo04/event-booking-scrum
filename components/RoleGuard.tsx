"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RoleGuardProps {
  children: ReactNode;
  /**
   * Roles that are allowed to view this content.
   * When omitted, any authenticated user is allowed.
   */
  allowedRoles?: UserRole[];
  /**
   * Redirect logged-in users away (for /login and /register).
   * When true, allowedRoles and requireAuth are ignored.
   */
  guestOnly?: boolean;
  /**
   * Redirect unauthenticated users to /login.
   * Defaults to true.
   */
  requireAuth?: boolean;
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">
          Loading…
        </p>
      </div>
    </div>
  );
}

// ─── Guard ────────────────────────────────────────────────────────────────────

export default function RoleGuard({
  children,
  allowedRoles,
  guestOnly = false,
  requireAuth = true,
}: RoleGuardProps) {
  // If the route is for guests only, it logically cannot require authentication.
  if (guestOnly) {
    requireAuth = false;
  }

  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the auth state is resolved before making any decision
    if (loading) return;

    if (guestOnly) {
      // Route is for guests only (e.g. /login, /register)
      // Redirect authenticated users to the dashboard
      if (user) {
        router.replace("/dashboard");
      }
      return;
    }

    if (requireAuth && !user) {
      // Route requires auth and the user is not logged in
      router.replace("/login");
      return;
    }

    if (user && allowedRoles && allowedRoles.length > 0) {
      // User is logged in but their role is not in the allowed list
      if (!role || !allowedRoles.includes(role)) {
        router.replace("/dashboard");
      }
    }
  }, [loading, user, role, router, guestOnly, requireAuth, allowedRoles]);

  // ── Render decisions ───────────────────────────────────────────────────────

  // Always show spinner while resolving auth
  if (loading) return <LoadingScreen />;

  // Guest-only: hide content from logged-in users while redirect fires
  if (guestOnly && user) return null;

  // Auth-required: hide content from guests while redirect fires
  if (requireAuth && !user) return null;

  // Role-restricted: hide content from wrong-role users while redirect fires
  if (user && allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) return null;
  }

  return <>{children}</>;
}
