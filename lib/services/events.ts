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
} from "firebase/firestore";
import { EventCreationFormValues } from "@/lib/schemas";

type EventStatus = "pending" | "approved" | "rejected" | "completed" | "cancelled";

export interface EventData extends EventCreationFormValues {
  id?: string;
  organizerId: string;
  status: EventStatus;
  rsvpCount: number;
  rejectReason?: string;
  createdAt?: { toMillis?: () => number } | null;
}

export type DiscoverableEventData = Omit<EventData, "capacity"> & {
  organizerName: string;
  capacity?: number | null;
};

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

export async function createEvent(data: EventCreationFormValues, organizerId: string) {
  try {
    const eventsRef = collection(db, "events");
    
    // As per PRD, new events start with 'pending' status
    const newEvent = {
      ...data,
      capacity: data.capacity === undefined ? null : data.capacity,
      organizerId,
      status: "pending",
      rsvpCount: 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(eventsRef, newEvent);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error };
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
    const events: EventData[] = [];
    
    querySnapshot.forEach((eventDoc) => {
      events.push({ id: eventDoc.id, ...eventDoc.data() } as EventData);
    });
    
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

      if (event.status !== "approved" || eventTime === null || eventTime <= now) {
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
