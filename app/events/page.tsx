import type { Metadata } from "next";

import RoleGuard from "@/components/RoleGuard";
import EventDiscovery from "@/components/events/EventDiscovery";

export const metadata: Metadata = {
  title: "Events | GoOutJs",
  description: "Discover approved upcoming events on GoOutJs.",
};

export default function EventsPage() {
  return (
    <RoleGuard allowedRoles={["attendee"]} requireAuth={false}>
      <EventDiscovery />
    </RoleGuard>
  );
}
