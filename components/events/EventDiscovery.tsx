"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  CalendarDays,
  CheckCircle2,
  Filter,
  LogIn,
  LogOut,
  MapPin,
  Search,
  Tag,
  TicketCheck,
  User as UserIcon,
  Users,
  Megaphone,
  PlusCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EventDetailsModal from "@/components/events/EventDetailsModal";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import {
  type EventDiscoveryFilterValues,
  eventDiscoveryFilterSchema,
} from "@/lib/schemas";
import {
  getDiscoverableEvents,
  getUserRsvpEventIds,
  toggleEventRsvp,
  type DiscoverableEventData,
} from "@/lib/services/events";

type EventsView = "all" | "rsvps";

interface EventDiscoveryProps {
  view?: EventsView;
}

const defaultFilters: EventDiscoveryFilterValues = {
  search: "",
  category: "all",
  startDate: "",
  endDate: "",
};

function getCategory(event: DiscoverableEventData) {
  return event.category?.trim() || "Uncategorized";
}

function getDateBoundary(value: string, endOfDay = false) {
  if (!value) return null;

  const suffix = endOfDay ? "T23:59:59.999" : "T00:00:00";
  const time = Date.parse(`${value}${suffix}`);
  return Number.isNaN(time) ? null : time;
}

function getEventTime(event: DiscoverableEventData) {
  const time = Date.parse(event.dateTime);
  return Number.isNaN(time) ? null : time;
}

function formatDate(dateTime: string) {
  return new Date(dateTime).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatPrice(price: number) {
  return price === 0 ? "Free" : `${price.toFixed(2)} EUR`;
}

function getRsvpUnavailableReason(
  event: DiscoverableEventData,
  isRsvped: boolean
) {
  if (isRsvped) {
    return null;
  }

  const eventTime = getEventTime(event);
  if (event.status !== "approved" || eventTime === null || eventTime <= Date.now()) {
    return "This event is not accepting new RSVPs.";
  }

  const hasCapacity =
    typeof event.capacity === "number" && event.capacity > 0;
  if (hasCapacity && event.rsvpCount >= event.capacity!) {
    return "This event is currently full.";
  }

  return null;
}

export default function EventDiscovery({ view = "all" }: EventDiscoveryProps) {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [events, setEvents] = useState<DiscoverableEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [rsvpEventIds, setRsvpEventIds] = useState<Set<string>>(new Set());
  const [rsvpStatusLoading, setRsvpStatusLoading] = useState(false);
  const [rsvpLoadingEventId, setRsvpLoadingEventId] = useState<string | null>(
    null
  );
  const [rsvpFeedback, setRsvpFeedback] = useState<string | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [filters, setFilters] =
    useState<EventDiscoveryFilterValues>(defaultFilters);

  useEffect(() => {
    async function fetchEvents() {
      const res = await getDiscoverableEvents();

      if (res.success) {
        setEvents(res.events);
        setError(null);
      } else {
        setError("Unable to load events right now.");
      }

      setLoading(false);
    }

    fetchEvents();
  }, []);

  useEffect(() => {
    let ignore = false;

    async function fetchRsvpMarkers() {
      if (!user) {
        setRsvpEventIds(new Set());
        setRsvpStatusLoading(false);
        return;
      }

      const eventIds = events
        .map((event) => event.id)
        .filter((eventId): eventId is string => Boolean(eventId));

      setRsvpStatusLoading(true);
      const res = await getUserRsvpEventIds(eventIds, user.uid);

      if (ignore) {
        return;
      }

      setRsvpEventIds(new Set(res.success ? res.eventIds : []));
      setRsvpStatusLoading(false);
    }

    fetchRsvpMarkers();

    return () => {
      ignore = true;
    };
  }, [events, user]);

  const sanitizedFilters = useMemo(() => {
    const parsed = eventDiscoveryFilterSchema.safeParse(filters);
    return parsed.success ? parsed.data : defaultFilters;
  }, [filters]);

  const categories = useMemo(() => {
    return Array.from(new Set(events.map((event) => getCategory(event)))).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    const searchQuery = sanitizedFilters.search.toLowerCase();
    const startTime = getDateBoundary(sanitizedFilters.startDate);
    const endTime = getDateBoundary(sanitizedFilters.endDate, true);

    return events.filter((event) => {
      const eventTime = getEventTime(event);
      if (eventTime === null) return false;

      const category = getCategory(event);
      const matchesCategory =
        sanitizedFilters.category === "all" ||
        category === sanitizedFilters.category;
      const matchesSearch =
        !searchQuery ||
        event.title.toLowerCase().includes(searchQuery) ||
        event.organizerName.toLowerCase().includes(searchQuery);
      const matchesStartDate = startTime === null || eventTime >= startTime;
      const matchesEndDate = endTime === null || eventTime <= endTime;

      return (
        matchesCategory && matchesSearch && matchesStartDate && matchesEndDate
      );
    });
  }, [events, sanitizedFilters]);

  const visibleEvents = useMemo(() => {
    if (view !== "rsvps") {
      return filteredEvents;
    }

    return filteredEvents.filter(
      (event) => event.id && rsvpEventIds.has(event.id)
    );
  }, [filteredEvents, rsvpEventIds, view]);

  const hasActiveFilters =
    sanitizedFilters.search !== "" ||
    sanitizedFilters.category !== "all" ||
    sanitizedFilters.startDate !== "" ||
    sanitizedFilters.endDate !== "";
  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? null;
  const selectedEventRsvped = selectedEvent?.id
    ? rsvpEventIds.has(selectedEvent.id)
    : false;
  const selectedEventRsvpUnavailableReason = selectedEvent
    ? getRsvpUnavailableReason(selectedEvent, selectedEventRsvped)
    : null;
  const isRsvpView = view === "rsvps";

  function updateFilter(
    key: keyof EventDiscoveryFilterValues,
    value: string
  ) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
    }));
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  function openEventDetails(event: DiscoverableEventData) {
    setSelectedEventId(event.id ?? null);
    setRsvpFeedback(null);
  }

  function closeEventDetails() {
    setSelectedEventId(null);
    setRsvpFeedback(null);
  }

  async function handleRsvpToggle(event: DiscoverableEventData) {
    if (!event.id) {
      setRsvpFeedback("This event cannot be updated right now.");
      return;
    }

    const isRsvped = rsvpEventIds.has(event.id);
    const unavailableReason = getRsvpUnavailableReason(event, isRsvped);

    if (unavailableReason) {
      setRsvpFeedback(unavailableReason);
      return;
    }

    if (!user) {
      setLoginPromptOpen(true);
      return;
    }

    setRsvpLoadingEventId(event.id);
    setRsvpFeedback(null);

    const res = await toggleEventRsvp(event.id, user.uid);

    setRsvpLoadingEventId(null);

    if (!res.success) {
      setRsvpFeedback(
        res.message || "We could not update your RSVP right now."
      );
      return;
    }

    setRsvpEventIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (res.rsvped) {
        nextIds.add(event.id!);
      } else {
        nextIds.delete(event.id!);
      }
      return nextIds;
    });

    setEvents((currentEvents) =>
      currentEvents.map((currentEvent) =>
        currentEvent.id === event.id
          ? { ...currentEvent, rsvpCount: res.rsvpCount }
          : currentEvent
      )
    );
    setRsvpFeedback(res.message ?? null);
  }

  function handleLoginRedirect() {
    const redirectPath = pathname || "/events";
    router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }

  const role = userData?.role?.toLowerCase();

  const navLinks = [
    ...(user ? [{ href: "/dashboard", icon: UserIcon, label: "Profile" }] : []),
    ...(role === "attendee"
      ? [
          {
            href: "/dashboard/announcements",
            icon: Megaphone,
            label: "Announcements",
          },
          {
            href: "/events",
            icon: CalendarDays,
            label: "All events",
          },
          {
            href: "/events/rsvps",
            icon: TicketCheck,
            label: "My events",
          },
        ]
      : []),
    ...(role === "organizer"
      ? [
          {
            href: "/dashboard/announcements",
            icon: Megaphone,
            label: "Announcements",
          },
          {
            href: "/dashboard/events",
            icon: CalendarDays,
            label: "My Events",
          },
          {
            href: "/dashboard/events/create",
            icon: PlusCircle,
            label: "Create Event",
          },
        ]
      : []),
    ...(role === "admin"
      ? [
          {
            href: "/dashboard/admin/announcements",
            icon: Megaphone,
            label: "Announcements",
          },
          {
            href: "/dashboard/admin/events",
            icon: CalendarDays,
            label: "Admin Approvals",
          },
          {
            href: "/dashboard/admin/users",
            icon: UserIcon,
            label: "Manage Users",
          },
        ]
      : []),
    ...(!user
      ? [
          {
            href: "/events",
            icon: CalendarDays,
            label: "Events",
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 flex-col md:flex-row">
      <aside className="md:w-64 bg-brand-dark flex flex-col text-white p-6 shrink-0">
        <div className="mb-10">
          <h1 className="text-2xl font-extrabold tracking-tight">
            EventPlatform
          </h1>
          {user && (
            <p className="text-sm text-brand-light mt-1 capitalize">
              {userData?.role ?? "user"} Dashboard
            </p>
          )}
        </div>

        <nav className="flex-1 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                  isActive
                    ? "bg-white/10 text-brand-orange"
                    : "hover:bg-white/5 text-brand-light hover:text-white"
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? "text-brand-orange" : ""}
                />
                <span className="font-medium text-white">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          {authLoading ? (
            <p className="px-2 text-sm text-brand-light">Loading account...</p>
          ) : user ? (
            <>
              <div className="mb-4 px-2">
                <p className="text-sm font-medium truncate">
                  {userData?.displayName || user.email || "Signed in"}
                </p>
                <p className="text-xs text-brand-light truncate">
                  {userData?.email || user.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-white/5 text-brand-orange rounded-md transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium text-white">Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center space-x-3 px-4 py-3 w-full text-left hover:bg-white/5 text-brand-orange rounded-md transition-colors"
            >
              <LogIn size={20} />
              <span className="font-medium text-white">Sign In</span>
            </Link>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 lg:p-12">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-brand-dark">
                {isRsvpView ? "My Events" : "Events"}
              </h2>
              <p className="text-slate-600 mt-2">
                {isRsvpView
                  ? "Review the upcoming events you have RSVPed to."
                  : "Discover approved upcoming events from organizers across the platform."}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-brand-dark font-medium">
                <Filter size={18} />
                <span>Filters:</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search by event or organizer..."
                    className="pl-9"
                    value={filters.search}
                    onChange={(event) => updateFilter("search", event.target.value)}
                  />
                </div>

                <select
                  className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-light"
                  value={filters.category}
                  onChange={(event) =>
                    updateFilter("category", event.target.value)
                  }
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <Input
                  type="date"
                  aria-label="Start date"
                  value={filters.startDate}
                  onChange={(event) =>
                    updateFilter("startDate", event.target.value)
                  }
                />

                <Input
                  type="date"
                  aria-label="End date"
                  value={filters.endDate}
                  onChange={(event) => updateFilter("endDate", event.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(defaultFilters)}
                  disabled={!hasActiveFilters}
                >
                  Clear all filters
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <p className="text-slate-500">Loading events...</p>
              </div>
            ) : error ? (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                <p className="text-red-600">{error}</p>
              </div>
            ) : isRsvpView && authLoading ? (
              <div className="flex justify-center p-12">
                <p className="text-slate-500">Loading your RSVPs...</p>
              </div>
            ) : isRsvpView && !user ? (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500">
                  Sign in to see the upcoming events you have RSVPed to.
                </p>
                <Button
                  type="button"
                  className="mt-5 bg-brand-orange text-white hover:bg-brand-orange/90"
                  onClick={() => setLoginPromptOpen(true)}
                >
                  <LogIn size={16} />
                  Sign In
                </Button>
              </div>
            ) : isRsvpView && rsvpStatusLoading ? (
              <div className="flex justify-center p-12">
                <p className="text-slate-500">Loading your RSVPs...</p>
              </div>
            ) : visibleEvents.length === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500">
                  {events.length === 0
                    ? "No upcoming approved events are available yet."
                    : isRsvpView && hasActiveFilters
                      ? "No RSVPed events match your filters."
                      : isRsvpView
                        ? "You have not RSVPed to any upcoming events yet."
                        : "No events found matching your filters."}
                </p>
              </div>
            ) : isRsvpView ? (
              <div className="space-y-4">
                {visibleEvents.map((event) => {
                  const category = getCategory(event);
                  const rsvpCount =
                    typeof event.rsvpCount === "number" ? event.rsvpCount : 0;
                  const hasCapacity =
                    typeof event.capacity === "number" && event.capacity > 0;
                  const availability = hasCapacity
                    ? `${rsvpCount} / ${event.capacity}`
                    : "Unlimited";
                  const date = new Date(event.dateTime);

                  return (
                    <article
                      key={event.id}
                      className="cursor-pointer rounded-xl border border-brand-orange/40 bg-white p-5 shadow-sm ring-1 ring-brand-orange/10 transition-shadow hover:shadow-md"
                      onClick={() => openEventDetails(event)}
                      onKeyDown={(keyboardEvent) => {
                        if (
                          keyboardEvent.key === "Enter" ||
                          keyboardEvent.key === " "
                        ) {
                          keyboardEvent.preventDefault();
                          openEventDetails(event);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center">
                        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-brand-dark">
                          <span className="text-xs font-semibold uppercase text-slate-500">
                            {date.toLocaleString(undefined, { month: "short" })}
                          </span>
                          <span className="text-2xl font-bold">
                            {date.getDate()}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex items-center gap-1 rounded-full bg-brand-orange/10 px-2 py-1 text-xs font-semibold text-brand-dark">
                              <CheckCircle2 size={14} />
                              RSVPed
                            </span>
                            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                              <Tag size={12} /> {category}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-brand-dark">
                            {event.title}
                          </h3>
                          <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                            <span className="flex items-center gap-2">
                              <CalendarDays
                                size={16}
                                className="shrink-0 text-brand-light"
                              />
                              {formatDate(event.dateTime)}
                            </span>
                            <span className="flex items-center gap-2">
                              <MapPin
                                size={16}
                                className="shrink-0 text-brand-light"
                              />
                              <span className="truncate">
                                {event.location || "Location TBD"}
                              </span>
                            </span>
                            <span className="flex items-center gap-2">
                              <UserIcon
                                size={16}
                                className="shrink-0 text-brand-light"
                              />
                              <span className="truncate">
                                {event.organizerName}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-5 border-t border-slate-100 pt-4 md:flex-col md:items-end md:border-t-0 md:pt-0">
                          <div className="text-left md:text-right">
                            <p className="text-xs font-medium text-slate-500">
                              Availability
                            </p>
                            <p className="font-bold text-brand-dark">
                              {availability}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-brand-dark">
                            {formatPrice(event.price)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleEvents.map((event) => {
                  const category = getCategory(event);
                  const rsvpCount =
                    typeof event.rsvpCount === "number" ? event.rsvpCount : 0;
                  const hasCapacity =
                    typeof event.capacity === "number" && event.capacity > 0;
                  const availability = hasCapacity
                    ? `${rsvpCount} / ${event.capacity}`
                    : "Unlimited";
                  const isRsvped = event.id ? rsvpEventIds.has(event.id) : false;

                  return (
                    <article
                      key={event.id}
                      className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition-shadow cursor-pointer ${
                        isRsvped
                          ? "border-brand-orange/50 ring-1 ring-brand-orange/20"
                          : "border-slate-200"
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
                          <div className="flex flex-wrap gap-2 items-center mt-2">
                            <span className="flex items-center text-xs text-slate-500 gap-1 bg-slate-100 px-2 py-1 rounded-full">
                              <Tag size={12} /> {category}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full border font-medium uppercase tracking-wider bg-green-100 text-green-800 border-green-200">
                              Upcoming
                            </span>
                          </div>
                        </div>
                        {isRsvped && (
                          <span className="ml-3 flex shrink-0 items-center gap-1 rounded-full bg-brand-orange/10 px-2 py-1 text-xs font-semibold text-brand-dark">
                            <CheckCircle2 size={14} />
                            RSVPed
                          </span>
                        )}
                      </div>

                      <div className="p-5 space-y-3 flex-1">
                        <p className="text-sm text-slate-600 line-clamp-3">
                          {event.description}
                        </p>
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <CalendarDays
                            size={16}
                            className="mt-0.5 shrink-0 text-brand-light"
                          />
                          <span>{formatDate(event.dateTime)}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <MapPin
                            size={16}
                            className="mt-0.5 shrink-0 text-brand-light"
                          />
                          <span className="line-clamp-2">
                            {event.location || "Location TBD"}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <UserIcon
                            size={16}
                            className="mt-0.5 shrink-0 text-brand-light"
                          />
                          <span className="line-clamp-1">
                            {event.organizerName}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-5 border-t border-slate-100 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-brand-orange/10 rounded-full">
                            <Users size={18} className="text-brand-orange" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-medium">
                              Availability
                            </p>
                            <p className="font-bold text-brand-dark">
                              {availability}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm font-bold text-brand-dark shrink-0">
                          {formatPrice(event.price)}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          organizerInfo={{ displayName: selectedEvent.organizerName }}
          onClose={closeEventDetails}
          showRsvpAction
          isRsvped={selectedEventRsvped}
          rsvpDisabled={
            authLoading ||
            Boolean(selectedEventRsvpUnavailableReason && !selectedEventRsvped)
          }
          rsvpLoading={rsvpLoadingEventId === selectedEvent.id}
          rsvpHelpText={
            rsvpFeedback ??
            selectedEventRsvpUnavailableReason ??
            (selectedEventRsvped ? "You have RSVPed to this event." : null)
          }
          onRsvpToggle={() => handleRsvpToggle(selectedEvent)}
        />
      )}

      {loginPromptOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="login-required-title"
            aria-describedby="login-required-description"
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xl"
          >
            <h2
              id="login-required-title"
              className="text-2xl font-bold text-brand-dark"
            >
              Sign in first
            </h2>
            <p
              id="login-required-description"
              className="mt-4 text-slate-600"
            >
              You need to sign in before you can RSVP to an event.
            </p>
            <div className="mt-6 flex w-full flex-col gap-3">
              <Button
                type="button"
                className="w-full bg-brand-orange text-white hover:bg-brand-orange/90"
                onClick={handleLoginRedirect}
              >
                Go to Login
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setLoginPromptOpen(false)}
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
