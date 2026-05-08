"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { LogOut, CalendarDays, PlusCircle, Megaphone, User as UserIcon } from "lucide-react";

interface UserData {
  displayName: string;
  email: string;
  role: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (!currentUser.emailVerified) {
          await signOut(auth);
          router.push("/login");
          return;
        }

        setUser(currentUser);
        // Fetch custom user data from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-slate-500 font-medium animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  if (!user || !userData) {
    return null; // Will redirect in useEffect
  }

  const navLinks = [
    { href: "/dashboard", icon: UserIcon, label: "Profile" },
    ...(userData.role === "organizer" ? [
      { href: "/dashboard/events", icon: CalendarDays, label: "My Events" },
      { href: "/dashboard/events/create", icon: PlusCircle, label: "Create Event" },
      { href: "/dashboard/announcements", icon: Megaphone, label: "Announcements" }
    ] : []),
    ...(userData.role === "admin" ? [
      { href: "/dashboard/admin/events", icon: CalendarDays, label: "Event Moderation" },
      { href: "/dashboard/admin/users", icon: UserIcon, label: "Manage Users" }
    ] : [])
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
      {/* Sidebar - dark theme like login left panel */}
      <div className="md:w-64 bg-brand-dark flex flex-col text-white p-6 shrink-0">
        <div className="mb-10">
          <h1 className="text-2xl font-extrabold tracking-tight">EventPlatform</h1>
          <p className="text-sm text-brand-light mt-1 capitalize">{userData.role} Dashboard</p>
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
                  isActive ? "bg-white/10 text-brand-orange" : "hover:bg-white/5 text-brand-light hover:text-white"
                }`}
              >
                <Icon size={20} className={isActive ? "text-brand-orange" : ""} />
                <span className="font-medium text-white">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium truncate">{userData.displayName}</p>
            <p className="text-xs text-brand-light truncate">{userData.email}</p>
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
