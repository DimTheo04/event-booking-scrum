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
      <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
        <Navigation
          user={user}
          userData={userData}
          unreadCount={unreadCount}
          handleSignOut={handleSignOut}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-y-auto overflow-x-hidden">
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
      </div>
    </RoleGuard>
  );
}

