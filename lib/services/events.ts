import { z } from "zod";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import {
  eventCreationSchema,
  EventCreationFormValues,
  rsvpActionSchema,
  rsvpLookupSchema,
} from "@/lib/schemas";
import {
  notifyAdminsNewEvent,
  notifyOrganizerRsvp,
  notifyRsvpEventCancelled,
  notifyRsvpEventUpdated,
} from "@/lib/services/notifications";

type EventStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

export type EventData = Omit<EventCreationFormValues, "capacity"> & {
  id?: string;
  capacity?: number | null;
  organizerId: string;
  status: EventStatus;
  rsvpCount: number;
  rejectReason?: string;
  createdAt?: { toMillis?: () => number } | null;
};

export type DiscoverableEventData = EventData & {
  organizerName: string;
};

type ToggleEventRsvpResult =
  | {
      success: true;
      rsvped: boolean;
      rsvpCount: number;
      message: string;
    }
  | {
      success: false;
      error: unknown;
      message: string;
    };

class RsvpActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RsvpActionError";
  }
}

function getTimestampMillis(value: unknown) {
  if (typeof value !== "object" || value === null || !("toMillis" in value)) {
    return 0;
  }

  const timestamp = value as { toMillis?: () => number };
  return typeof timestamp.toMillis === "function" ? timestamp.toMillis() : 0;
}

function getEventTime(dateTime: string) {
  const eventTime = Date.parse(dateTime);
  return Number.isNaN(eventTime) ? null : eventTime;
}

function isPastEvent(event: EventData, now = Date.now()) {
  const eventTime = getEventTime(event.dateTime);
  return eventTime !== null && eventTime <= now;
}

function isFutureDateTime(value: string) {
  const eventTime = getEventTime(value);
  return eventTime !== null && eventTime > Date.now();
}

async function markPastApprovedEventsCompleted(events: EventData[]) {
  const now = Date.now();
  const pastApprovedEvents = events.filter(
    (event) => event.id && event.status === "approved" && isPastEvent(event, now)
  );

  if (pastApprovedEvents.length === 0) {
    return events;
  }

  const batch = writeBatch(db);
  pastApprovedEvents.forEach((event) => {
    batch.update(doc(db, "events", event.id!), { status: "completed" });
  });

  try {
    await batch.commit();
  } catch (error) {
    console.warn(
      "Past approved events were marked completed locally, but Firestore denied the status update:",
      getFirebaseErrorMessage(error)
    );
  }

  const completedEventIds = new Set(pastApprovedEvents.map((event) => event.id));
  return events.map((event) =>
    event.id && completedEventIds.has(event.id)
      ? { ...event, status: "completed" as const }
      : event
  );
}

async function getOrganizerName(
  organizerId: string,
  organizerCache: Map<string, string>
) {
  if (!organizerId) {
    return "Unknown organizer";
  }

  const cachedName = organizerCache.get(organizerId);
  if (cachedName) {
    return cachedName;
  }

  try {
    const organizerRef = doc(db, "users", organizerId);
    const organizerSnap = await getDoc(organizerRef);
    const organizerData = organizerSnap.data();
    const displayName = organizerData?.displayName;
    const organizerName =
      typeof displayName === "string" && displayName.trim()
        ? displayName.trim()
        : "Unknown organizer";

    organizerCache.set(organizerId, organizerName);
    return organizerName;
  } catch (error) {
    console.error("Error fetching organizer:", error);
    return "Unknown organizer";
  }
}

const eventUpdateSchema = z.object({
  description: z.string().min(10, { message: "Description must be at least 10 characters long." }),
  location: z.string().min(3, { message: "Location is required." }),
  category: z.string().min(1, { message: "Please select a category." }),
  dateTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date and time." }).refine(isFutureDateTime, {
    message: "Event date and time must be in the future.",
  }),
  price: z.coerce.number().min(0, { message: "Price cannot be negative." }),
  capacity: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal(0))
    .or(z.nan())
    .transform((val) => Number.isNaN(val) || val === 0 ? undefined : val),
});

export type EventUpdateValues = z.infer<typeof eventUpdateSchema>;

function getFirebaseErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Please review the event details and try again.";
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    switch (error.code) {
      case "permission-denied":
        return "You do not currently have permission to update this event.";
      default:
        return "We could not complete your request right now.";
    }
  }

  return "We could not complete your request right now.";
}

export async function createEvent(data: EventCreationFormValues, organizerId: string) {
  try {
    const validatedData = eventCreationSchema.parse(data);
    const eventsRef = collection(db, "events");
    
    // As per PRD, new events start with 'pending' status
    const newEvent = {
      ...validatedData,
      capacity: validatedData.capacity === undefined ? null : validatedData.capacity,
      organizerId,
      status: "pending",
      rsvpCount: 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(eventsRef, newEvent);

    // Notify all admins about the new pending event (fire-and-forget)
    notifyAdminsNewEvent(validatedData.title).catch(console.error);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error, message: getFirebaseErrorMessage(error) };
  }
}

export async function getOrganizerEvents(organizerId: string) {
  try {
    const eventsRef = collection(db, "events");
    // We order by createdAt desc, but we might need a composite index in Firestore for where + orderBy.
    // For simplicity without assuming index, we will fetch by organizerId and sort on client if needed, 
    // or just rely on a simple query.
    const q = query(eventsRef, where("organizerId", "==", organizerId));
    
    const querySnapshot = await getDocs(q);
    let events: EventData[] = [];
    
    querySnapshot.forEach((eventDoc) => {
      events.push({ id: eventDoc.id, ...eventDoc.data() } as EventData);
    });

    events = await markPastApprovedEventsCompleted(events);
    
    // Sort client-side to avoid requiring composite indexes immediately during MVP
    events.sort((a, b) => {
      const timeA = getTimestampMillis(a.createdAt);
      const timeB = getTimestampMillis(b.createdAt);
      return timeB - timeA;
    });

    return { success: true, events };
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    return { success: false, events: [], error };
  }
}

export async function getDiscoverableEvents(): Promise<{
  success: boolean;
  events: DiscoverableEventData[];
  error?: unknown;
}> {
  try {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("status", "==", "approved"));
    const querySnapshot = await getDocs(q);
    const organizerCache = new Map<string, string>();
    const events: DiscoverableEventData[] = [];
    const now = Date.now();

    for (const eventDoc of querySnapshot.docs) {
      const event = { id: eventDoc.id, ...eventDoc.data() } as EventData;
      const eventTime = getEventTime(event.dateTime);

      if (event.status === "approved" && eventTime !== null && eventTime <= now) {
        await updateDoc(doc(db, "events", event.id!), { status: "completed" }).catch((error) => {
          console.warn(
            "Past approved event was filtered locally, but Firestore denied the completed status update:",
            getFirebaseErrorMessage(error)
          );
        });
        continue;
      }

      if (event.status !== "approved" || eventTime === null) {
        continue;
      }

      const organizerName = await getOrganizerName(
        event.organizerId,
        organizerCache
      );

      events.push({
        ...event,
        organizerName,
      });
    }

    events.sort((a, b) => Date.parse(a.dateTime) - Date.parse(b.dateTime));

    return { success: true, events };
  } catch (error) {
    console.error("Error fetching discoverable events:", error);
    return { success: false, events: [], error };
  }
}

export async function updateEvent(eventId: string, data: EventUpdateValues) {
  try {
    const validatedData = eventUpdateSchema.parse(data);
    const eventRef = doc(db, "events", eventId);

    // Fetch current event data to get the title for notifications
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      return { success: false, message: "Event not found." };
    }
    const eventData = eventSnap.data() as EventData;

    const updatePayload = {
      ...validatedData,
      capacity: validatedData.capacity ?? null,
    };

    await updateDoc(eventRef, updatePayload);

    // Notify RSVP'd users (fire-and-forget)
    notifyRsvpEventUpdated(eventId, eventData.title).catch((err) =>
      console.error("Failed to notify users of event update:", err)
    );

    return { success: true };
  } catch (error) {
    console.warn("Error updating event:", getFirebaseErrorMessage(error));
    return { success: false, error, message: getFirebaseErrorMessage(error) };
  }
}

export async function cancelEvent(eventId: string) {
  try {
    const eventRef = doc(db, "events", eventId);
    
    // Fetch event details to get the title for notifications
    const eventSnap = await getDoc(eventRef);
    if (!eventSnap.exists()) {
      return { success: false, message: "Event not found." };
    }
    const eventData = eventSnap.data() as EventData;

    await updateDoc(eventRef, { status: "cancelled" });

    // Notify RSVP'd users (fire-and-forget)
    notifyRsvpEventCancelled(eventId, eventData.title).catch((err) =>
      console.error("Failed to notify users of event cancellation:", err)
    );

    return { success: true };
  } catch (error) {
    console.warn("Error cancelling event:", getFirebaseErrorMessage(error));
    return { success: false, error, message: getFirebaseErrorMessage(error) };
  }
}

export async function getUserRsvpEventIds(eventIds: string[], userId: string) {
  try {
    const parsed = rsvpLookupSchema.parse({ eventIds, userId });

    if (parsed.eventIds.length === 0) {
      return { success: true, eventIds: [] as string[] };
    }

    const rsvpChecks = await Promise.all(
      parsed.eventIds.map(async (eventId) => {
        const rsvpRef = doc(db, "events", eventId, "rsvps", parsed.userId);
        const rsvpSnap = await getDoc(rsvpRef);
        return rsvpSnap.exists() ? eventId : null;
      })
    );

    return {
      success: true,
      eventIds: rsvpChecks.filter((eventId): eventId is string => Boolean(eventId)),
    };
  } catch (error) {
    console.warn("Error fetching RSVP markers:", getFirebaseErrorMessage(error));
    return {
      success: false,
      eventIds: [] as string[],
      error,
      message: getFirebaseErrorMessage(error),
    };
  }
}

export async function toggleEventRsvp(
  eventId: string,
  userId: string
): Promise<ToggleEventRsvpResult> {
  try {
    const parsed = rsvpActionSchema.parse({ eventId, userId });
    const eventRef = doc(db, "events", parsed.eventId);
    const rsvpRef = doc(db, "events", parsed.eventId, "rsvps", parsed.userId);
    const userRef = doc(db, "users", parsed.userId);

    const result = await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      const userSnap = await transaction.get(userRef);

      if (!eventSnap.exists()) {
        throw new RsvpActionError("This event is no longer available.");
      }

      if (!userSnap.exists() || userSnap.data()?.role !== "attendee") {
        throw new RsvpActionError("Only attendees can RSVP to events.");
      }

      const event = eventSnap.data() as EventData;
      const rsvpSnap = await transaction.get(rsvpRef);
      const currentRsvpCount =
        typeof event.rsvpCount === "number" ? event.rsvpCount : 0;

      if (rsvpSnap.exists()) {
        const nextRsvpCount = Math.max(currentRsvpCount - 1, 0);
        transaction.delete(rsvpRef);
        transaction.update(eventRef, { rsvpCount: nextRsvpCount });

        return {
          rsvped: false,
          rsvpCount: nextRsvpCount,
          message: "Your RSVP has been cancelled.",
        };
      }

      const eventTime = getEventTime(event.dateTime);
      const isUpcoming = eventTime !== null && eventTime > Date.now();

      if (event.status !== "approved" || !isUpcoming) {
        throw new RsvpActionError("This event is not accepting new RSVPs.");
      }

      const capacity =
        typeof event.capacity === "number" && event.capacity > 0
          ? event.capacity
          : null;

      if (capacity !== null && currentRsvpCount >= capacity) {
        throw new RsvpActionError("This event is currently full.");
      }

      const nextRsvpCount = currentRsvpCount + 1;
      transaction.set(rsvpRef, {
        userId: parsed.userId,
        timestamp: serverTimestamp(),
      });
      transaction.update(eventRef, { rsvpCount: nextRsvpCount });

      return {
        rsvped: true,
        rsvpCount: nextRsvpCount,
        message: "You are now RSVP'd to this event.",
        organizerId: event.organizerId,
        eventTitle: event.title,
      };
    });

    // Notify the organizer when someone RSVPs (not when they cancel)
    if (result.rsvped && result.organizerId && result.eventTitle) {
      notifyOrganizerRsvp(
        result.organizerId,
        parsed.eventId,
        result.eventTitle
      ).catch(console.error);
    }

    return { success: true, ...result };
  } catch (error) {
    const message =
      error instanceof RsvpActionError
        ? error.message
        : getFirebaseErrorMessage(error);

    console.warn("Error toggling RSVP:", message);
    return { success: false, error, message };
  }
}
