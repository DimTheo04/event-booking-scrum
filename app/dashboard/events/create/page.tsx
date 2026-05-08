"use client";

import EventCreateForm from "@/components/events/EventCreateForm";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateEventPage() {
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Layout already guarantees we have an authenticated user when this renders
    if (auth.currentUser) {
      setOrganizerId(auth.currentUser.uid);
    } else {
      router.push("/login");
    }
  }, [router]);

  if (!organizerId) {
    return null; // Will show layout loading state or flash quickly
  }

  return (
    <div className="p-8 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <EventCreateForm organizerId={organizerId} />
      </div>
    </div>
  );
}
