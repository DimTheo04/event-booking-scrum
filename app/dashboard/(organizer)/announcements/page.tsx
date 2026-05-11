"use client";

import { useAuth } from "@/context/AuthContext";
import AnnouncementManager from "@/components/dashboard/AnnouncementManager";

export default function AnnouncementsPage() {
  const { user } = useAuth();

  // Parent (organizer) layout guard ensures only organizer/admin reach here.
  if (!user) return null;

  return (
    <div className="p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">Announcements</h2>
          <p className="text-slate-600 mt-2">
            Broadcast updates, venue changes, and important information to your
            followers and event attendees.
          </p>
        </div>

        <AnnouncementManager organizerId={user.uid} />
      </div>
    </div>
  );
}
