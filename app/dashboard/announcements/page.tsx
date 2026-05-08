"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import AnnouncementManager from "@/components/dashboard/AnnouncementManager";

export default function AnnouncementsPage() {
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Layout guarantees auth, but we need the UID
    if (auth.currentUser) {
      setOrganizerId(auth.currentUser.uid);
    } else {
      router.push("/login");
    }
  }, [router]);

  if (!organizerId) return null;

  return (
    <div className="p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">
            Announcements
          </h2>
          <p className="text-slate-600 mt-2">
            Broadcast updates, venue changes, and important information to your followers and event attendees.
          </p>
        </div>

        <AnnouncementManager organizerId={organizerId} />
      </div>
    </div>
  );
}
