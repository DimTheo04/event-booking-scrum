"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cancelEvent, getOrganizerEvents, updateEvent, type EventData, type EventUpdateValues } from "@/lib/services/events";
import { CalendarDays, MapPin, Users, Tag, Filter, X, Pencil, Ban, Mail, UserRound, Euro, AlignLeft, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrganizerInfo {
  displayName: string;
  email: string;
}

const EVENT_CATEGORIES = ["Music", "Sports", "Tech", "Art", "Business", "Education"] as const;

function formatDateTimeDisplay(dateTime: string) {
  return dateTime
    ? new Date(dateTime).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "TBD";
}

function formatDateTimeInput(dateTime: string) {
  if (!dateTime) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTime)) {
    return dateTime;
  }

  const parsedDate = new Date(dateTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsedDate.getDate()}`.padStart(2, "0");
  const hours = `${parsedDate.getHours()}`.padStart(2, "0");
  const minutes = `${parsedDate.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function buildEditValues(event: EventData): EventUpdateValues {
  return {
    description: event.description,
    location: event.location,
    category: event.category,
    dateTime: formatDateTimeInput(event.dateTime),
    price: event.price,
    capacity: event.capacity,
  };
}

export default function RSVPTracker({ organizerId }: { organizerId: string }) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<EventUpdateValues | null>(null);
  const [organizerInfo, setOrganizerInfo] = useState<OrganizerInfo | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

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
    const matchCategory = categoryFilter === "all" || event.category === categoryFilter;
    return matchStatus && matchCategory;
  });

  const uniqueCategories = Array.from(new Set(events.map(e => e.category)));
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? null;

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <p className="text-slate-500">Loading events...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "completed": return "bg-slate-100 text-slate-800 border-slate-200";
      case "cancelled": return "bg-red-200 text-red-900 border-red-300";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  function openEventDetails(event: EventData) {
    setSelectedEventId(event.id ?? null);
    setEditValues(buildEditValues(event));
    setIsEditing(false);
    setActionError(null);
  }

  function closeEventDetails() {
    setSelectedEventId(null);
    setEditValues(null);
    setIsEditing(false);
    setActionError(null);
  }

  function handleEditChange<K extends keyof EventUpdateValues>(field: K, value: EventUpdateValues[K]) {
    setEditValues((current) => current ? { ...current, [field]: value } : current);
  }

  async function handleSaveChanges() {
    if (!selectedEvent || !selectedEvent.id || !editValues) {
      return;
    }

    setIsSaving(true);
    setActionError(null);

    const res = await updateEvent(selectedEvent.id, {
      ...editValues,
      price: Number(editValues.price),
      capacity: editValues.capacity ? Number(editValues.capacity) : undefined,
    });

    setIsSaving(false);

    if (!res.success) {
      setActionError(
        res.message ||
          "We couldn't save your changes right now. Please review the fields and try again."
      );
      return;
    }

    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === selectedEvent.id
          ? { ...event, ...editValues, price: Number(editValues.price), capacity: editValues.capacity ? Number(editValues.capacity) : undefined }
          : event
      )
    );
    setIsEditing(false);
  }

  async function handleCancelEvent() {
    if (!selectedEvent || !selectedEvent.id || selectedEvent.status === "cancelled") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel "${selectedEvent.title}"?\n\n` +
      "Your event will stay in the system, but attendees will see it as cancelled."
    );
    if (!confirmed) {
      return;
    }

    setIsCancelling(true);
    setActionError(null);

    const res = await cancelEvent(selectedEvent.id);

    setIsCancelling(false);

    if (!res.success) {
      setActionError(
        res.message ||
          "We couldn't cancel this event right now. Please try again in a moment."
      );
      return;
    }

    setEvents((currentEvents) =>
      currentEvents.map((event) =>
        event.id === selectedEvent.id
          ? { ...event, status: "cancelled" }
          : event
      )
    );
  }

  return (
    <>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 text-brand-dark font-medium">
          <Filter size={18} />
          <span>Filters:</span>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
          <select 
            className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-light"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
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
          {filteredEvents.map(event => {
            const dateStr = formatDateTimeDisplay(event.dateTime);

            const isFull = event.capacity ? event.rsvpCount >= event.capacity : false;
            const isCancelled = event.status === "cancelled";

            return (
              <div
                key={event.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col transition-shadow cursor-pointer ${isCancelled ? "border-red-200" : "border-slate-200 hover:shadow-md"}`}
                onClick={() => openEventDetails(event)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openEventDetails(event);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-brand-dark line-clamp-1">{event.title}</h3>
                    <div className="flex gap-2 items-center mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium uppercase tracking-wider ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                      <span className="flex items-center text-xs text-slate-500 gap-1 bg-slate-100 px-2 py-1 rounded-full">
                        <Tag size={12} /> {event.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-3 flex-1">
                  {event.status === 'rejected' && event.rejectReason && (
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
                  <p className="text-sm text-slate-600 line-clamp-3">{event.description}</p>
                </div>

                <div className="bg-gray-50 p-5 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-orange/10 rounded-full">
                      <Users size={18} className="text-brand-orange" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">RSVPs</p>
                      <p className="font-bold text-brand-dark">
                        {event.rsvpCount} <span className="text-sm font-normal text-slate-500">{event.capacity ? `/ ${event.capacity}` : ''}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isFull && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md">FULL</span>}
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-300 bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEventDetails(event);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {selectedEvent && editValues && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Event Details</p>
                <h3 className="mt-1 text-2xl font-bold text-brand-dark">{selectedEvent.title}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium uppercase tracking-wider ${getStatusColor(selectedEvent.status)}`}>
                    {selectedEvent.status}
                  </span>
                  <span className="flex items-center text-xs text-slate-500 gap-1 bg-slate-100 px-2 py-1 rounded-full">
                    <Tag size={12} /> {selectedEvent.category}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEventDetails}
                className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close event details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              {actionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {actionError}
                </div>
              )}

              {selectedEvent.status === "cancelled" && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  Cancelled events stay stored in Firebase and are marked here for tracking.
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <UserRound size={16} />
                    Organizer
                  </div>
                  <p className="text-base font-semibold text-brand-dark">{organizerInfo?.displayName || "Organizer"}</p>
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={14} />
                    {organizerInfo?.email || "No email available"}
                  </p>
                </div>

                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Users size={16} />
                    RSVP Overview
                  </div>
                  <p className="text-base font-semibold text-brand-dark">
                    {selectedEvent.rsvpCount}
                    <span className="ml-1 text-sm font-normal text-slate-500">
                      {selectedEvent.capacity ? `/ ${selectedEvent.capacity}` : "/ Unlimited"}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedEvent.capacity && selectedEvent.rsvpCount >= selectedEvent.capacity ? "This event is currently full." : "Spots are still available."}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Event Title</label>
                  <Input value={selectedEvent.title} readOnly disabled className="bg-slate-100 text-slate-500" />
                  <p className="text-xs text-slate-500">Title is locked and cannot be edited.</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <AlignLeft size={16} />
                    Description
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={editValues.description}
                      onChange={(e) => handleEditChange("description", e.target.value)}
                      className="min-h-[140px]"
                    />
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {selectedEvent.description}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Date & Time</label>
                  {isEditing ? (
                    <div className="event-edit-datetime">
                      <Input
                        type="datetime-local"
                        value={editValues.dateTime}
                        onChange={(e) => handleEditChange("dateTime", e.target.value)}
                        className="pr-10"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <CalendarDays size={16} className="text-brand-light" />
                      {formatDateTimeDisplay(selectedEvent.dateTime)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Location</label>
                  {isEditing ? (
                    <Input
                      value={editValues.location}
                      onChange={(e) => handleEditChange("location", e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <MapPin size={16} className="text-brand-light" />
                      {selectedEvent.location}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Category</label>
                  {isEditing ? (
                    <Select
                      value={editValues.category}
                      onValueChange={(value) => handleEditChange("category", value)}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <Tag size={16} className="text-brand-light" />
                      {selectedEvent.category}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Price (EUR)</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editValues.price}
                      onChange={(e) => handleEditChange("price", Number(e.target.value))}
                    />
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <Euro size={16} className="text-brand-light" />
                      {selectedEvent.price}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Capacity</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      min="1"
                      placeholder="Leave blank for unlimited"
                      value={editValues.capacity ?? ""}
                      onChange={(e) => handleEditChange("capacity", e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      {selectedEvent.capacity ?? "Unlimited"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancelEvent}
                disabled={isCancelling || selectedEvent.status === "cancelled"}
                className="justify-center"
              >
                <Ban size={16} />
                {selectedEvent.status === "cancelled" ? "Event Cancelled" : isCancelling ? "Cancelling..." : "Cancel Event"}
              </Button>

              <div className="flex flex-col gap-3 sm:flex-row">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditValues(buildEditValues(selectedEvent));
                        setIsEditing(false);
                        setActionError(null);
                      }}
                    >
                      Discard Changes
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                      className="bg-brand-dark text-white hover:bg-brand-dark/90"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={closeEventDetails}>
                      Close
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setEditValues(buildEditValues(selectedEvent));
                        setIsEditing(true);
                        setActionError(null);
                      }}
                      className="bg-brand-dark text-white hover:bg-brand-dark/90"
                    >
                      <Pencil size={16} />
                      Edit Event
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .event-edit-datetime {
          position: relative;
        }

        .event-edit-datetime input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          left: auto;
          right: 0.75rem;
          top: 50%;
          bottom: auto;
          width: 1.25rem;
          height: 1.25rem;
          transform: translateY(-50%);
        }
      `}</style>
    </>
  );
}
