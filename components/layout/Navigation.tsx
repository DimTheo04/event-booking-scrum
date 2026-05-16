"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  CalendarDays,
  PlusCircle,
  Megaphone,
  TicketCheck,
  User as UserIcon,
  Bell,
  Menu,
  X,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  user: any;
  userData: any;
  unreadCount: number;
  handleSignOut: () => Promise<void>;
}

export default function Navigation({
  user,
  userData,
  unreadCount,
  handleSignOut,
}: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const role = userData?.role?.toLowerCase();

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const navLinks = [
    ...(user ? [{ href: "/dashboard", icon: UserIcon, label: "Profile" }] : []),
    ...(role === "attendee"
      ? [
          {
            href: "/dashboard/announcements",
            icon: Megaphone,
            label: "Announcements",
          },
          {
            href: "/events",
            icon: CalendarDays,
            label: "All events",
          },
          {
            href: "/events/rsvps",
            icon: TicketCheck,
            label: "My events",
          },
        ]
      : []),
    ...(role === "organizer"
      ? [
          {
            href: "/dashboard/announcements",
            icon: Megaphone,
            label: "Announcements",
          },
          {
            href: "/dashboard/announcements/create",
            icon: PlusCircle,
            label: "Create Announcement",
          },
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
            href: "/dashboard/admin/announcements",
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
    ...(!user
      ? [
          {
            href: "/events",
            icon: CalendarDays,
            label: "Events",
          },
        ]
      : []),
  ];

  const NavItem = ({ link, mobile = false }: { link: any; mobile?: boolean }) => {
    const Icon = link.icon;
    const isActive = pathname === link.href;

    return (
      <Link
        href={link.href}
        className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all ${
          isActive
            ? "bg-white/10 text-brand-orange shadow-sm"
            : "hover:bg-white/5 text-brand-light hover:text-white"
        } ${mobile ? "text-lg py-4" : ""}`}
      >
        <Icon size={mobile ? 24 : 20} className={isActive ? "text-brand-orange" : ""} />
        <span className="font-medium text-white">{link.label}</span>
      </Link>
    );
  };

  const NotificationsLink = ({ mobile = false }: { mobile?: boolean }) => {
    if (!user) return null;
    const isActive = pathname === "/dashboard/notifications";

    return (
      <Link
        href="/dashboard/notifications"
        className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all ${
          isActive
            ? "bg-white/10 text-brand-orange shadow-sm"
            : "hover:bg-white/5 text-brand-light hover:text-white"
        } ${mobile ? "text-lg py-4" : ""}`}
      >
        <span className="relative inline-flex shrink-0">
          <Bell size={mobile ? 24 : 20} className={isActive ? "text-brand-orange" : ""} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-orange" />
            </span>
          )}
        </span>
        <span className="font-medium text-white">Notifications</span>
        {unreadCount > 0 && (
          <span className="ml-auto text-xs font-bold bg-brand-orange text-white rounded-full px-1.5 py-0.5 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between bg-brand-dark text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            GoOutJs
          </h1>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-white/10 rounded-md transition-colors"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-brand-dark flex flex-col p-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="mt-12 flex-1 overflow-y-auto space-y-2">
            {navLinks.map((link) => (
              <NavItem key={link.href} link={link} mobile />
            ))}
            <NotificationsLink mobile />
          </div>

          <div className="mt-auto pt-6 border-t border-white/10">
            {user ? (
              <div className="space-y-4">
                <div className="px-4">
                  <p className="text-base font-bold text-white truncate">
                    {userData?.displayName || user.email || "Signed in"}
                  </p>
                  <p className="text-sm text-brand-light truncate">
                    {userData?.email || user.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 px-4 py-4 w-full text-left bg-white/5 hover:bg-white/10 text-brand-orange rounded-md transition-all"
                >
                  <LogOut size={24} />
                  <span className="font-bold text-white text-lg">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-3 px-4 py-4 w-full text-left bg-brand-orange hover:bg-brand-orange/90 text-white rounded-md transition-all"
              >
                <LogIn size={24} />
                <span className="font-bold text-lg">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-brand-dark flex-col text-white p-6 shrink-0 sticky top-0 h-screen overflow-y-auto shadow-xl">
        <div className="mb-10">
          <h1 className="text-2xl font-extrabold tracking-tight">
            GoOutJs
          </h1>
          {user && (
            <p className="text-sm text-brand-light mt-1 capitalize">
              {userData?.role ?? "user"} Dashboard
            </p>
          )}
        </div>

        <nav className="flex-1 space-y-2">
          {navLinks.map((link) => (
            <NavItem key={link.href} link={link} />
          ))}
          <NotificationsLink />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          {user ? (
            <>
              <div className="mb-4 px-2">
                <p className="text-sm font-medium truncate text-white">
                  {userData?.displayName || user.email || "Signed in"}
                </p>
                <p className="text-xs text-brand-light truncate">
                  {userData?.email || user.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-white/5 text-brand-orange rounded-md transition-colors group"
              >
                <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium text-white">Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center space-x-3 px-4 py-3 w-full text-left bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange rounded-md transition-colors group"
            >
              <LogIn size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-medium text-white">Sign In</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
