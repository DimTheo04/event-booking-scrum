"use client";

import { useAuth } from "@/context/AuthContext";
import RSVPTracker from "@/components/dashboard/RSVPTracker";

export default function EventsDashboardPage() {
  const { user } = useAuth();

  // Parent layout (organizer) guard ensures only organizer/admin reach here.
  if (!user) return null;

  return (
    <div className="p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">My Events</h2>
          <p className="text-slate-600 mt-2">
            Track RSVPs, manage statuses, and view all your published and
            pending events.
          </p>
        </div>

        <RSVPTracker organizerId={user.uid} />
      </div>
    </div>
  );
}
