import type { Metadata } from "next";

import EventDiscovery from "@/components/events/EventDiscovery";

export const metadata: Metadata = {
  title: "Events | EventPlatform",
  description: "Discover approved upcoming events on EventPlatform.",
};

export default function EventsPage() {
  return <EventDiscovery />;
}
