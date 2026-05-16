import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import {
  announcementSchema,
  organizerAnnouncementSchema,
  platformAnnouncementSchema,
  type AnnouncementFormValues,
} from "@/lib/schemas";
import {
  notifyAnnouncementAudience,
  notifyOrganizerAnnouncementAudience,
} from "@/lib/services/notifications";

type OrganizerAnnouncementAudience = "followers" | "rsvps" | "followers_and_rsvps";

export interface AnnouncementData {
  id?: string;
  authorId: string;
  title: string;
  message: string;
  targetAudience?: string;
  audienceType?: "platform" | "organizer";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export async function createAnnouncement(
  authorId: string,
  data: AnnouncementFormValues,
  options: { isAdmin?: boolean } = {}
) {
  try {
    const isAdmin = options.isAdmin === true;
    const validatedData = isAdmin
      ? platformAnnouncementSchema.parse(data)
      : organizerAnnouncementSchema.parse(data);
    const announcementsRef = collection(db, "announcements");
    const newAnnouncement = {
      authorId,
      ...validatedData,
      audienceType: isAdmin ? "platform" : "organizer",
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(announcementsRef, newAnnouncement);

    const audience: string = validatedData.targetAudience ?? "all";
    if (isAdmin) {
      notifyAnnouncementAudience(audience, validatedData.title).catch(console.error);
    } else {
      notifyOrganizerAnnouncementAudience(
        authorId,
        validatedData.targetAudience as OrganizerAnnouncementAudience,
        validatedData.title
      ).catch(console.error);
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating announcement:", error);
    return { success: false, error };
  }
}

async function getFollowedOrganizerIds(userId: string) {
  const followsRef = collection(db, "follows");
  const q = query(followsRef, where("followerId", "==", userId));
  const snapshot = await getDocs(q);

  return new Set(
    snapshot.docs
      .map((docSnap) => docSnap.data().organizerId as string | undefined)
      .filter((id): id is string => Boolean(id))
  );
}

async function getRsvpedOrganizerIds(userId: string) {
  const eventsRef = collection(db, "events");
  const q = query(eventsRef, where("status", "==", "approved"));
  const snapshot = await getDocs(q);
  const organizerIds = new Set<string>();

  await Promise.all(
    snapshot.docs.map(async (eventDoc) => {
      const rsvpRef = doc(db, "events", eventDoc.id, "rsvps", userId);
      const rsvpSnap = await getDoc(rsvpRef);
      if (!rsvpSnap.exists()) return;

      const organizerId = eventDoc.data().organizerId;
      if (typeof organizerId === "string") {
        organizerIds.add(organizerId);
      }
    })
  );

  return organizerIds;
}

function isPlatformAnnouncement(announcement: AnnouncementData) {
  const target = announcement.targetAudience || "all";
  return (
    announcement.audienceType === "platform" ||
    target === "all" ||
    target === "organizer" ||
    target === "attendee"
  );
}

export async function getVisibleAnnouncementsForUser(
  userId: string,
  role: "attendee" | "organizer" | "admin"
) {
  try {
    const res = await getPlatformAnnouncements();
    if (!res.success) {
      return res;
    }

    const followedOrganizerIds =
      role === "attendee" ? await getFollowedOrganizerIds(userId) : new Set<string>();
    const rsvpedOrganizerIds =
      role === "attendee" ? await getRsvpedOrganizerIds(userId) : new Set<string>();

    const announcements = res.announcements.filter((announcement) => {
      const target = announcement.targetAudience || "all";

      if (isPlatformAnnouncement(announcement)) {
        return target === "all" || target === role;
      }

      if (role !== "attendee") {
        return false;
      }

      const followsOrganizer = followedOrganizerIds.has(announcement.authorId);
      const rsvpedToOrganizer = rsvpedOrganizerIds.has(announcement.authorId);

      if (target === "followers") return followsOrganizer;
      if (target === "rsvps") return rsvpedToOrganizer;
      if (target === "followers_and_rsvps") return followsOrganizer || rsvpedToOrganizer;

      return false;
    });

    return { success: true, announcements };
  } catch (error) {
    console.error("Error fetching visible announcements:", error);
    return { success: false, announcements: [], error };
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
