"use client";

import { useState } from "react";
import {
  AlignLeft,
  Ban,
  CalendarDays,
  Euro,
  Mail,
  MapPin,
  Pencil,
  Tag,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { EventData, EventUpdateValues } from "@/lib/services/events";

const EVENT_CATEGORIES = ["Music", "Sports", "Tech", "Art", "Business", "Education"] as const;

export type EventDetailsModalEvent = EventData & {
  organizerName?: string;
};

export interface EventDetailsOrganizerInfo {
  displayName: string;
  email?: string | null;
}

interface EventDetailsActionResult {
  success: boolean;
  message?: string;
}

interface EventDetailsModalProps {
  event: EventDetailsModalEvent;
  organizerInfo?: EventDetailsOrganizerInfo | null;
  canManage?: boolean;
  onClose: () => void;
  onSave?: (
    event: EventDetailsModalEvent,
    values: EventUpdateValues
  ) => Promise<EventDetailsActionResult>;
  onCancelEvent?: (
    event: EventDetailsModalEvent
  ) => Promise<EventDetailsActionResult>;
  cancelledNotice?: string;
}

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

function buildEditValues(event: EventDetailsModalEvent): EventUpdateValues {
  return {
    description: event.description,
    location: event.location,
    category: event.category,
    dateTime: formatDateTimeInput(event.dateTime),
    price: event.price,
    capacity: event.capacity ?? undefined,
  };
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

function formatPrice(price: number) {
  return price === 0 ? "Free" : `${price.toFixed(2)} EUR`;
}

export default function EventDetailsModal({
  event,
  organizerInfo,
  canManage = false,
  onClose,
  onSave,
  onCancelEvent,
  cancelledNotice = "This event has been cancelled.",
}: EventDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<EventUpdateValues>(() =>
    buildEditValues(event)
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const organizerName =
    organizerInfo?.displayName || event.organizerName || "Organizer";
  const organizerEmail = organizerInfo?.email;
  const hasCapacity = typeof event.capacity === "number" && event.capacity > 0;
  const isFull = hasCapacity && event.rsvpCount >= event.capacity!;
  const canEdit = canManage && event.status !== "cancelled" && event.status !== "rejected";
  const canCancel = canManage && event.status !== "cancelled" && event.status !== "rejected";

  function handleEditChange<K extends keyof EventUpdateValues>(
    field: K,
    value: EventUpdateValues[K]
  ) {
    setEditValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSaveChanges() {
    if (!onSave || !canEdit) {
      return;
    }

    setIsSaving(true);
    setActionError(null);

    const normalizedValues = {
      ...editValues,
      price: Number(editValues.price),
      capacity: editValues.capacity ? Number(editValues.capacity) : undefined,
    };
    const result = await onSave(event, normalizedValues);

    setIsSaving(false);

    if (!result.success) {
      setActionError(
        result.message ||
          "We could not save your changes right now. Please review the fields and try again."
      );
      return;
    }

    setIsEditing(false);
  }

  async function handleCancelEvent() {
    if (!onCancelEvent || !canCancel) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel "${event.title}"?\n\n` +
        "Your event will stay in the system, but attendees will see it as cancelled."
    );
    if (!confirmed) {
      return;
    }

    setIsCancelling(true);
    setActionError(null);

    const result = await onCancelEvent(event);

    setIsCancelling(false);

    if (!result.success) {
      setActionError(
        result.message ||
          "We could not cancel this event right now. Please try again in a moment."
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Event Details
            </p>
            <h3 className="mt-1 text-2xl font-bold text-brand-dark">{event.title}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full border font-medium uppercase tracking-wider ${getStatusColor(event.status)}`}>
                {event.status === "approved" && !canManage ? "Upcoming" : event.status}
              </span>
              <span className="flex items-center text-xs text-slate-500 gap-1 bg-slate-100 px-2 py-1 rounded-full">
                <Tag size={12} /> {event.category}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
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

          {event.status === "cancelled" && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {cancelledNotice}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <UserRound size={16} />
                Organizer
              </div>
              <p className="text-base font-semibold text-brand-dark">{organizerName}</p>
              {organizerEmail && (
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={14} />
                  {organizerEmail}
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users size={16} />
                RSVP Overview
              </div>
              <p className="text-base font-semibold text-brand-dark">
                {event.rsvpCount}
                <span className="ml-1 text-sm font-normal text-slate-500">
                  {hasCapacity ? `/ ${event.capacity}` : "/ Unlimited"}
                </span>
              </p>
              <p className="text-sm text-slate-600">
                {isFull ? "This event is currently full." : "Spots are still available."}
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
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
                  {event.description}
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
                  {formatDateTimeDisplay(event.dateTime)}
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
                  {event.location || "Location TBD"}
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
                  {event.category}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Price</label>
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
                  {formatPrice(event.price)}
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
                  onChange={(e) =>
                    handleEditChange(
                      "capacity",
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  {hasCapacity ? event.capacity : "Unlimited"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          {canManage && onCancelEvent ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleCancelEvent}
              disabled={isCancelling || !canCancel}
              className="justify-center"
            >
              <Ban size={16} />
              {event.status === "cancelled"
                ? "Event Cancelled"
                : isCancelling
                  ? "Cancelling..."
                  : "Cancel Event"}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            {canEdit && isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditValues(buildEditValues(event));
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
                <Button type="button" variant="outline" onClick={onClose}>
                  Close
                </Button>
                {canManage && onSave && (
                  <Button
                    type="button"
                    onClick={() => {
                      if (!canEdit) {
                        return;
                      }
                      setEditValues(buildEditValues(event));
                      setIsEditing(true);
                      setActionError(null);
                    }}
                    disabled={!canEdit}
                    className="bg-brand-dark text-white hover:bg-brand-dark/90"
                  >
                    <Pencil size={16} />
                    Edit Event
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}
