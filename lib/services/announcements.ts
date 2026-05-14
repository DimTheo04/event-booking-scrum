import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, serverTimestamp, type Timestamp } from "firebase/firestore";
import { announcementSchema, type AnnouncementFormValues } from "@/lib/schemas";

export interface AnnouncementData {
  id?: string;
  authorId: string;
  title: string;
  message: string;
  targetAudience?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function createAnnouncement(authorId: string, data: AnnouncementFormValues) {
  try {
    const validatedData = announcementSchema.parse(data);
    const announcementsRef = collection(db, "announcements");
    const newAnnouncement = {
      authorId,
      ...validatedData,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(announcementsRef, newAnnouncement);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { success: false, error };
  }
}

export async function getOrganizerAnnouncements(authorId: string) {
  try {
    const announcementsRef = collection(db, "announcements");
    const q = query(announcementsRef, where("authorId", "==", authorId));
    const querySnapshot = await getDocs(q);
    
    const announcements: AnnouncementData[] = [];
    querySnapshot.forEach((doc) => {
      announcements.push({ id: doc.id, ...doc.data() } as AnnouncementData);
    });

    // Sort client-side descending
    announcements.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });

    return { success: true, announcements };
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return { success: false, announcements: [], error };
  }
}

export async function getPlatformAnnouncements() {
  try {
    const announcementsRef = collection(db, "announcements");
    const querySnapshot = await getDocs(announcementsRef);
    
    const announcements: AnnouncementData[] = [];
    querySnapshot.forEach((doc) => {
      announcements.push({ id: doc.id, ...doc.data() } as AnnouncementData);
    });

    // Sort client-side descending
    announcements.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });

    return { success: true, announcements };
  } catch (error) {
    console.error("Error fetching platform announcements:", error);
    return { success: false, announcements: [], error };
  }
}

export async function updateAnnouncement(announcementId: string, data: Pick<AnnouncementFormValues, "title" | "message">) {
  try {
    const validatedData = announcementSchema.pick({ title: true, message: true }).parse(data);
    const announcementRef = doc(db, "announcements", announcementId);
    await updateDoc(announcementRef, { 
      ...validatedData,
      updatedAt: serverTimestamp() 
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating announcement:", error);
    return { success: false, error };
  }
}

export async function deleteAnnouncement(announcementId: string) {
  try {
    const announcementRef = doc(db, "announcements", announcementId);
    await deleteDoc(announcementRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { success: false, error };
  }
}
