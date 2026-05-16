"use client";

import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";
import { useNotifications } from "@/hooks/useNotifications";
import { Footer } from "@/components/layout/Footer";
import Navigation from "@/components/layout/Navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData, user } = useAuth();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  return (
    <RoleGuard requireAuth>
      <div className="flex h-screen bg-gray-50 flex-col md:flex-row overflow-hidden">
        <Navigation
          user={user}
          userData={userData}
          unreadCount={unreadCount}
          handleSignOut={handleSignOut}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          <Footer />
        </div>
      </div>
    </RoleGuard>
  );
}

