import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, serverTimestamp } from "firebase/firestore";

export interface AnnouncementData {
  id?: string;
  authorId: string;
  title: string;
  message: string;
  createdAt: any;
  updatedAt?: any;
}

export async function createAnnouncement(authorId: string, title: string, message: string) {
  try {
    const announcementsRef = collection(db, "announcements");
    const newAnnouncement = {
      authorId,
      title,
      message,
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

export async function updateAnnouncement(announcementId: string, title: string, message: string) {
  try {
    const announcementRef = doc(db, "announcements", announcementId);
    await updateDoc(announcementRef, { 
      title, 
      message,
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
