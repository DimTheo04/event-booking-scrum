import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy } from "firebase/firestore";
import { EventCreationFormValues } from "@/lib/schemas";

export interface EventData extends EventCreationFormValues {
  id?: string;
  organizerId: string;
  status: "pending" | "approved" | "rejected" | "completed" | "cancelled";
  rsvpCount: number;
  createdAt: any;
}

export async function createEvent(data: EventCreationFormValues, organizerId: string) {
  try {
    const eventsRef = collection(db, "events");
    
    // As per PRD, new events start with 'pending' status
    const newEvent = {
      ...data,
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
    
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() } as EventData);
    });
    
    // Sort client-side to avoid requiring composite indexes immediately during MVP
    events.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });

    return { success: true, events };
  } catch (error) {
    console.error("Error fetching organizer events:", error);
    return { success: false, events: [], error };
  }
}
