import type { Metadata } from "next";

import RoleGuard from "@/components/RoleGuard";
import EventDiscovery from "@/components/events/EventDiscovery";

export const metadata: Metadata = {
  title: "My RSVPs | EventPlatform",
  description: "View your RSVP'd upcoming events on EventPlatform.",
};

export default function EventRsvpsPage() {
  return (
    <RoleGuard allowedRoles={["attendee"]}>
      <EventDiscovery view="rsvps" />
    </RoleGuard>
  );
}
