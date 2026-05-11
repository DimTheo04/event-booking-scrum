"use client";

import { useAuth } from "@/context/AuthContext";
import EventCreateForm from "@/components/events/EventCreateForm";

export default function CreateEventPage() {
  const { user } = useAuth();

  // Parent (organizer) layout guard ensures only organizers reach here.
  if (!user) return null;

  return (
    <div className="p-6 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <EventCreateForm organizerId={user.uid} />
      </div>
    </div>
  );
}
