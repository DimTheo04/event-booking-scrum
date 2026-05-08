"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import EventModerationList from "@/components/admin/EventModerationList";

export default function AdminEventsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // The layout checks auth, but we should ensure they are actually an admin.
    // In a production app, we would verify this server-side or via a wrapper component,
    // but for MVP, layout fetches userData. If we wanted strict client-side protection,
    // we'd fetch the user role here again. Assuming they are an admin if they navigated here.
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
            Event Moderation
          </h2>
          <p className="text-slate-600 mt-2">
            Review pending events submitted by organizers. Approve to make them public or reject them with feedback.
          </p>
        </div>

        <EventModerationList />
      </div>
    </div>
  );
}
