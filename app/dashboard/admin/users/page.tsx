"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import UserManagementTable from "@/components/admin/UserManagementTable";

export default function AdminUsersPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      router.push("/login");
    } else {
      setIsAdmin(true);
    }
  }, [router]);

  if (!isAdmin) return null;

  return (
    <div className="p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">
            User Management
          </h2>
          <p className="text-slate-600 mt-2">
            View all registered users and update their roles across the platform.
          </p>
        </div>

        <UserManagementTable />
      </div>
    </div>
  );
}
