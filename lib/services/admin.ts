import { auth, db } from "@/lib/firebase";
import { collection, getDoc, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { roleUpdateSchema } from "@/lib/schemas";
import { EventData } from "./events";

export interface UserData {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

export type PendingEventData = EventData & {
  organizerName: string;
};

async function getOrganizerName(organizerId: string) {
  if (!organizerId) {
    return "Unknown organizer";
  }

  const organizerRef = doc(db, "users", organizerId);
  const organizerSnap = await getDoc(organizerRef);
  const organizerData = organizerSnap.data();
  const displayName = organizerData?.displayName;

  return typeof displayName === "string" && displayName.trim()
    ? displayName.trim()
    : "Unknown organizer";
}

// Event Moderation Services
export async function getPendingEvents() {
  try {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    
    const events = await Promise.all(
      querySnapshot.docs.map(async (eventDoc) => {
        const event = { id: eventDoc.id, ...eventDoc.data() } as EventData;
        const organizerName = await getOrganizerName(event.organizerId);

        return {
          ...event,
          organizerName,
        };
      })
    );
    
    // Sort client-side
    events.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });

    return { success: true, events };
  } catch (error) {
    console.error("Error fetching pending events:", error);
    return { success: false, events: [], error };
  }
}

export async function updateEventStatus(eventId: string, status: "approved" | "rejected", rejectReason?: string) {
  try {
    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);
    const eventDateTime = eventSnap.data()?.dateTime;
    const isPastEvent =
      status === "approved" &&
      typeof eventDateTime === "string" &&
      Date.parse(eventDateTime) <= Date.now();
    const nextStatus = isPastEvent ? "completed" : status;
    const updateData: { status: "approved" | "rejected" | "completed"; rejectReason?: string } = {
      status: nextStatus,
    };

    if (rejectReason) {
      updateData.rejectReason = rejectReason;
    }
    await updateDoc(eventRef, updateData);
    return { success: true };
  } catch (error) {
    console.error("Error updating event status:", error);
    return { success: false, error };
  }
}

// User Management Services
export async function getAllUsers() {
  try {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    
    const users: UserData[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as UserData);
    });

    return { success: true, users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return { success: false, users: [], error };
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    const validated = roleUpdateSchema.parse({ role: newRole });
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role: validated.role });
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error };
  }
}

export async function deleteUser(userId: string) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: new Error("You must be signed in.") };
    }

    const token = await currentUser.getIdToken();
    const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return {
        success: false,
        error: payload?.error ?? "Failed to delete user.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error };
  }
}
