"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import RSVPTracker from "@/components/dashboard/RSVPTracker";

export default function EventsDashboardPage() {
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Layout already guarantees authenticated user
    if (auth.currentUser) {
      setOrganizerId(auth.currentUser.uid);
    } else {
      router.push("/login");
    }
  }, [router]);

  if (!organizerId) {
    return null; 
  }

  return (
    <div className="p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">
            My Events
          </h2>
          <p className="text-slate-600 mt-2">
            Track RSVPs, manage statuses, and view all your published and pending events.
          </p>
        </div>

        <RSVPTracker organizerId={organizerId} />
      </div>
    </div>
  );
}
