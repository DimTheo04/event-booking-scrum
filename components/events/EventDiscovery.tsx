"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  CalendarDays,
  Filter,
  LogIn,
  LogOut,
  MapPin,
  Search,
  Tag,
  User as UserIcon,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import {
  type EventDiscoveryFilterValues,
  eventDiscoveryFilterSchema,
} from "@/lib/schemas";
import {
  getDiscoverableEvents,
  type DiscoverableEventData,
} from "@/lib/services/events";

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

export default function EventDiscovery() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [events, setEvents] = useState<DiscoverableEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const hasActiveFilters =
    sanitizedFilters.search !== "" ||
    sanitizedFilters.category !== "all" ||
    sanitizedFilters.startDate !== "" ||
    sanitizedFilters.endDate !== "";

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

  const navLinks = [
    ...(user ? [{ href: "/dashboard", icon: UserIcon, label: "Profile" }] : []),
    { href: "/events", icon: CalendarDays, label: "Events" },
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
                <Icon size={20} className={isActive ? "text-brand-orange" : ""} />
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
              <h2 className="text-3xl font-bold text-brand-dark">Events</h2>
              <p className="text-slate-600 mt-2">
                Discover approved upcoming events from organizers across the
                platform.
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
            ) : filteredEvents.length === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500">
                  {events.length === 0
                    ? "No upcoming approved events are available yet."
                    : "No events found matching your filters."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredEvents.map((event) => {
                  const category = getCategory(event);
                  const rsvpCount =
                    typeof event.rsvpCount === "number" ? event.rsvpCount : 0;
                  const hasCapacity =
                    typeof event.capacity === "number" && event.capacity > 0;
                  const availability = hasCapacity
                    ? `${rsvpCount} / ${event.capacity}`
                    : "Unlimited";

                  return (
                    <article
                      key={event.id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
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
    </div>
  );
}
