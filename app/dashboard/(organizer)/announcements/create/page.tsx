"use client";

import { useAuth } from "@/context/AuthContext";
import AnnouncementManager from "@/components/dashboard/AnnouncementManager";

export default function CreateAnnouncementPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">
            Create Announcement
          </h2>
          <p className="text-slate-600 mt-2">
            Send announcements only to people who follow you or have RSVPed to your events.
          </p>
        </div>

        <AnnouncementManager organizerId={user.uid} />
      </div>
    </div>
  );
}
