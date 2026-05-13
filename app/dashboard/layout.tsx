"use client";

import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  CalendarDays,
  PlusCircle,
  Megaphone,
  User as UserIcon,
} from "lucide-react";
import RoleGuard from "@/components/RoleGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  const role = userData?.role?.toLowerCase();

  const navLinks = [
    { href: "/dashboard", icon: UserIcon, label: "Profile" },
    ...(role === "attendee"
      ? [
          {
            href: "/events",
            icon: CalendarDays,
            label: "Events",
          },
        ]
      : []),
    ...(role === "organizer"
      ? [
          {
            href: "/dashboard/events",
            icon: CalendarDays,
            label: "My Events",
          },
          {
            href: "/dashboard/events/create",
            icon: PlusCircle,
            label: "Create Event",
          },
        ]
      : []),
    ...(role === "admin"
      ? [
          {
            href: "/dashboard/announcements",
            icon: Megaphone,
            label: "Announcements",
          },
          {
            href: "/dashboard/admin/events",
            icon: CalendarDays,
            label: "Admin Approvals",
          },
          {
            href: "/dashboard/admin/users",
            icon: UserIcon,
            label: "Manage Users",
          },
        ]
      : []),
  ];

  return (
    <RoleGuard requireAuth>
      <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
        {/* Sidebar */}
        <div className="md:w-64 bg-brand-dark flex flex-col text-white p-6 shrink-0">
          <div className="mb-10">
            <h1 className="text-2xl font-extrabold tracking-tight">
              EventPlatform
            </h1>
            <p className="text-sm text-brand-light mt-1 capitalize">
              {userData?.role ?? "—"} Dashboard
            </p>
          </div>

          <nav className="flex-1 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                    isActive
                      ? "bg-white/10 text-brand-orange"
                      : "hover:bg-white/5 text-brand-light hover:text-white"
                  }`}
                >
                  <Icon
                    size={20}
                    className={isActive ? "text-brand-orange" : ""}
                  />
                  <span className="font-medium text-white">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="mb-4 px-2">
              <p className="text-sm font-medium truncate">
                {userData?.displayName}
              </p>
              <p className="text-xs text-brand-light truncate">
                {userData?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-white/5 text-brand-orange rounded-md transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium text-white">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </RoleGuard>
  );
}
