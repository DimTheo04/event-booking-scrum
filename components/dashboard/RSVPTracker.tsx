"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Euro,
  Filter,
  MapPin,
  Sparkles,
  Tag,
  Users,
} from "lucide-react";

import OrganizerRsvpCharts from "@/components/dashboard/OrganizerRsvpCharts";
import EventDetailsModal, {
  type EventDetailsModalEvent,
} from "@/components/events/EventDetailsModal";
import { auth, db } from "@/lib/firebase";
import {
  cancelEvent,
  getOrganizerEvents,
  updateEvent,
  type EventData,
  type EventUpdateValues,
} from "@/lib/services/events";

interface OrganizerInfo {
  displayName: string;
  email: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTimeDisplay(dateTime: string) {
  return dateTime
    ? new Date(dateTime).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "TBD";
}

function getStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "completed":
      return "bg-slate-100 text-slate-800 border-slate-200";
    case "cancelled":
      return "bg-red-200 text-red-900 border-red-300";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

function getEventRevenue(event: EventData) {
  return Math.max(event.price ?? 0, 0) * Math.max(event.rsvpCount ?? 0, 0);
}

function isPastEvent(dateTime: string) {
  const timestamp = Date.parse(dateTime);
  return !Number.isNaN(timestamp) && timestamp < Date.now();
}

export default function RSVPTracker({ organizerId }: { organizerId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [organizerInfo, setOrganizerInfo] = useState<OrganizerInfo | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchEvents() {
      try {
        const res = await getOrganizerEvents(organizerId);
        if (!controller.signal.aborted) {
          if (res.success && res.events) {
            setEvents(res.events);
          } else if (!res.success) {
            alert("Failed to fetch events. Please try again.");
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching events:", error);
          alert("An error occurred while fetching events.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchEvents();

    return () => {
      controller.abort();
    };
  }, [organizerId]);

  useEffect(() => {
    async function fetchOrganizerInfo() {
      const fallbackInfo = {
        displayName: auth.currentUser?.displayName || "Organizer",
        email: auth.currentUser?.email || "No email available",
      };

      try {
        const userRef = doc(db, "users", organizerId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data() as Partial<OrganizerInfo>;
          setOrganizerInfo({
            displayName: data.displayName || fallbackInfo.displayName,
            email: data.email || fallbackInfo.email,
          });
          return;
        }
      } catch (error) {
        console.error("Error fetching organizer info:", error);
      }

      setOrganizerInfo(fallbackInfo);
    }

    fetchOrganizerInfo();
  }, [organizerId]);

  const filteredEvents = events.filter((event) => {
    const matchStatus = statusFilter === "all" || event.status === statusFilter;
    const matchCategory =
      categoryFilter === "all" || event.category === categoryFilter;
    return matchStatus && matchCategory;
  });

  const uniqueCategories = Array.from(new Set(events.map((event) => event.category)));
  const notificationEventId = searchParams.get("eventId");
  const effectiveSelectedEventId = notificationEventId ?? selectedEventId;
  const selectedEvent =
    events.find((event) => event.id === effectiveSelectedEventId) ?? null;
  const totalEvents = events.length;
  const totalRsvps = events.reduce(
    (sum, event) => sum + (event.rsvpCount ?? 0),
    0
  );
  const totalRevenue = events.reduce(
    (sum, event) => sum + getEventRevenue(event),
    0
  );
  const pastEvents = events.filter((event) => isPastEvent(event.dateTime));
  const activeEvents = events.filter((event) => !isPastEvent(event.dateTime));
  const chartEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    category: event.category,
    status: event.status,
    rsvpCount: event.rsvpCount ?? 0,
    revenue: getEventRevenue(event),
  }));

  function openEventDetails(event: EventData) {
    setSelectedEventId(event.id ?? null);

    const params = new URLSearchParams(searchParams.toString());
    if (event.id) {
      params.set("eventId", event.id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }

  function closeEventDetails() {
    setSelectedEventId(null);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("eventId");
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  async function handleSaveEventChanges(
    event: EventDetailsModalEvent,
    values: EventUpdateValues
  ) {
    if (event.status === "cancelled" || event.status === "rejected") {
      return {
        success: false,
        message: "Cancelled or rejected events cannot be edited.",
      };
    }

    if (!event.id) {
      return { success: false, message: "Missing event id." };
    }

    const nextValues = {
      ...values,
      price: Number(values.price),
      capacity: values.capacity ? Number(values.capacity) : undefined,
    };

    const res = await updateEvent(event.id, nextValues);
    if (!res.success) {
      return {
        success: false,
        message:
          res.message ||
          "We could not save your changes right now. Please review the fields and try again.",
      };
    }

    setEvents((currentEvents) =>
      currentEvents.map((currentEvent) =>
        currentEvent.id === event.id
          ? {
              ...currentEvent,
              ...nextValues,
              capacity: nextValues.capacity ?? null,
            }
          : currentEvent
      )
    );

    return { success: true };
  }

  async function handleCancelSelectedEvent(event: EventDetailsModalEvent) {
    if (event.status === "rejected") {
      return {
        success: false,
        message: "Rejected events cannot be cancelled.",
      };
    }

    if (!event.id || event.status === "cancelled") {
      return { success: false, message: "This event cannot be cancelled." };
    }

    const res = await cancelEvent(event.id);
    if (!res.success) {
      return {
        success: false,
        message:
          res.message ||
          "We could not cancel this event right now. Please try again in a moment.",
      };
    }

    setEvents((currentEvents) =>
      currentEvents.map((currentEvent) =>
        currentEvent.id === event.id
          ? { ...currentEvent, status: "cancelled" }
          : currentEvent
      )
    );

    return { success: true };
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <p className="text-slate-500">Loading events...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.22),_transparent_34%),linear-gradient(135deg,#fff7ed_0%,#ffffff_50%,#f8fafc_100%)] px-6 py-6 sm:px-8">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand-orange/10 blur-3xl" />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark">
                  <Sparkles size={14} className="text-brand-orange" />
                  RSVP Dashboard
                </div>
                <h3 className="mt-4 text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
                  Organizer performance at a glance
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  Track audience interest, estimated revenue, and how your event portfolio is split between active and past activity.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                <div className="rounded-xl bg-brand-dark p-2 text-white">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                    Organizer
                  </p>
                  <p className="text-sm font-semibold text-brand-dark">
                    {organizerInfo?.displayName || "Event Organizer"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-4 xl:p-6">
            <div className="group rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Events</p>
                  <p className="mt-3 text-3xl font-bold text-brand-dark">{totalEvents}</p>
                </div>
                <div className="rounded-2xl bg-brand-dark p-3 text-white shadow-sm">
                  <CalendarDays size={18} />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                All events currently owned by this organizer.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fff7ed_100%)] p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total RSVPs</p>
                  <p className="mt-3 text-3xl font-bold text-brand-dark">{totalRsvps}</p>
                </div>
                <div className="rounded-2xl bg-brand-orange p-3 text-white shadow-sm">
                  <Users size={18} />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Combined RSVP participants across all your events.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                  <p className="mt-3 text-3xl font-bold text-brand-dark">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <div className="rounded-2xl bg-emerald-500 p-3 text-white shadow-sm">
                  <Euro size={18} />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Estimated from ticket price multiplied by RSVP count.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Active vs Past</p>
                  <p className="mt-3 text-3xl font-bold text-brand-dark">
                    {activeEvents.length} / {pastEvents.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-sky-500 p-3 text-white shadow-sm">
                  <BarChart3 size={18} />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Upcoming-active events compared with older-past ones.
              </p>
            </div>
          </div>
        </div>

        <OrganizerRsvpCharts events={chartEvents} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-brand-dark font-medium">
            <Filter size={18} />
            <span>Filters:</span>
          </div>

          <div className="flex flex-wrap gap-4 w-full sm:w-auto">
            <select
              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-light"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-light"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
            <p className="text-slate-500">No events found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const dateStr = formatDateTimeDisplay(event.dateTime);
              const isFull = event.capacity
                ? event.rsvpCount >= event.capacity
                : false;
              const isCancelled = event.status === "cancelled";
              const eventRevenue = getEventRevenue(event);
              const isPast = isPastEvent(event.dateTime);

              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-shadow cursor-pointer ${
                    isCancelled
                      ? "border-red-200"
                      : "border-slate-200 hover:shadow-md"
                  }`}
                  onClick={() => openEventDetails(event)}
                  onKeyDown={(keyboardEvent) => {
                    if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                      keyboardEvent.preventDefault();
                      openEventDetails(event);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-brand-dark line-clamp-1">
                        {event.title}
                      </h3>
                      <div className="flex gap-2 items-center mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium uppercase tracking-wider ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                        {isPast && (
                          <span className="text-xs px-2 py-1 rounded-full border border-slate-200 bg-slate-100 font-medium uppercase tracking-wider text-slate-600">
                            Past Event
                          </span>
                        )}
                        <span className="flex items-center text-xs text-slate-500 gap-1 bg-slate-100 px-2 py-1 rounded-full">
                          <Tag size={12} /> {event.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1">
                    {event.status === "rejected" && event.rejectReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3 text-red-800 text-sm mb-2">
                        <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                        <div>
                          <p className="font-semibold mb-0.5">Event Rejected</p>
                          <p className="text-red-700">{event.rejectReason}</p>
                        </div>
                      </div>
                    )}
                    {isCancelled && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                        This event has been cancelled.
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <CalendarDays size={16} className="mt-0.5 shrink-0 text-brand-light" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-brand-light" />
                      <span className="line-clamp-2">{event.location}</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {event.description}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-5 border-t border-slate-100 flex justify-between items-center">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-brand-orange/10 rounded-full">
                          <Users size={18} className="text-brand-orange" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">RSVPs</p>
                          <p className="font-bold text-brand-dark">
                            {event.rsvpCount}
                            <span className="text-sm font-normal text-slate-500">
                              {event.capacity ? ` / ${event.capacity}` : ""}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 rounded-full">
                          <Euro size={18} className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium">Revenue</p>
                          <p className="font-bold text-brand-dark">
                            {formatCurrency(eventRevenue)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {isFull && (
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md">
                        FULL
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          organizerInfo={organizerInfo}
          canManage
          onClose={closeEventDetails}
          onSave={handleSaveEventChanges}
          onCancelEvent={handleCancelSelectedEvent}
          cancelledNotice="Cancelled events stay stored in Firebase and are marked here for tracking."
        />
      )}
    </>
  );
}
