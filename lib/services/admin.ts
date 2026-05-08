import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import { EventData } from "./events";

export interface UserData {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

// Event Moderation Services
export async function getPendingEvents() {
  try {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    
    const events: EventData[] = [];
    querySnapshot.forEach((doc) => {
      events.push({ id: doc.id, ...doc.data() } as EventData);
    });
    
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

export async function updateEventStatus(eventId: string, status: "approved" | "rejected", reason?: string) {
  try {
    const eventRef = doc(db, "events", eventId);
    const updateData: any = { status };
    if (reason) {
      updateData.rejectionReason = reason;
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
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { role: newRole });
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error };
  }
}
