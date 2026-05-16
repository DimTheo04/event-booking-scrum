import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  deleteDoc,
  type Timestamp,
} from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "EVENT_REQUEST"
  | "RSVP_NEW"
  | "EVENT_APPROVAL"
  | "EVENT_REJECTION"
  | "GLOBAL_ANNOUNCEMENT"
  | "ORGANIZER_ANNOUNCEMENT"
  | "FOLLOWED_ORGANIZER_EVENT"
  | "EVENT_CANCELLED"
  | "EVENT_UPDATED";

export interface NotificationData {
  id: string;
  recipientId: string;
  type: NotificationType;
  message: string;
  actionLink: string;
  read: boolean;
  createdAt: Timestamp | null;
}

// ─── Core CRUD ────────────────────────────────────────────────────────────────

/**
 * Create a single notification document for one recipient.
 */
async function createNotification(
  recipientId: string,
  type: NotificationType,
  message: string,
  actionLink: string
): Promise<void> {
  const notificationsRef = collection(db, "notifications");
  await addDoc(notificationsRef, {
    recipientId,
    type,
    message,
    actionLink,
    read: false,
    createdAt: serverTimestamp(),
  });
}

/**
 * Bulk-create notifications for multiple recipients using batched writes.
 * Splits into chunks of 500 to respect Firestore batch limits.
 */
async function createBulkNotifications(
  recipientIds: string[],
  type: NotificationType,
  message: string,
  actionLink: string
): Promise<void> {
  if (recipientIds.length === 0) return;

  const notificationsRef = collection(db, "notifications");
  const BATCH_LIMIT = 500;

  for (let i = 0; i < recipientIds.length; i += BATCH_LIMIT) {
    const chunk = recipientIds.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);

    chunk.forEach((recipientId) => {
      const newDocRef = doc(notificationsRef);
      batch.set(newDocRef, {
        recipientId,
        type,
        message,
        actionLink,
        read: false,
        createdAt: serverTimestamp(),
      });
    });

    await batch.commit();
  }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const notificationRef = doc(db, "notifications", notificationId);
  await updateDoc(notificationRef, { read: true });
}

/**
 * Delete a single notification document.
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const notificationRef = doc(db, "notifications", notificationId);
  await deleteDoc(notificationRef);
}

/**
 * Delete all notifications for a specific user.
 */
export async function clearAllNotifications(userId: string): Promise<void> {
  try {
    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, where("recipientId", "==", userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    // Split into chunks of 500 to respect Firestore batch limits
    const BATCH_LIMIT = 500;
    for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
      const chunk = snapshot.docs.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);

      chunk.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();
    }
  } catch (error) {
    console.error("clearAllNotifications failed:", error);
    throw error;
  }
}

// ─── Trigger Helpers ──────────────────────────────────────────────────────────

/**
 * Notify all admin users when an organizer submits a new event for approval.
 */
export async function notifyAdminsNewEvent(eventTitle: string): Promise<void> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "==", "admin"));
    const snapshot = await getDocs(q);
    const adminIds = snapshot.docs.map((d) => d.id);

    await createBulkNotifications(
      adminIds,
      "EVENT_REQUEST",
      `A new event "${eventTitle}" has been submitted for your review.`,
      "/dashboard/admin/events"
    );
  } catch (error) {
    console.error("notifyAdminsNewEvent failed:", error);
  }
}

/**
 * Notify an organizer when a user RSVPs to their event.
 */
export async function notifyOrganizerRsvp(
  organizerId: string,
  eventId: string,
  eventTitle: string
): Promise<void> {
  try {
    await createNotification(
      organizerId,
      "RSVP_NEW",
      `Someone just RSVPed to your event "${eventTitle}".`,
      "/dashboard/events"
    );
  } catch (error) {
    console.error("notifyOrganizerRsvp failed:", error);
  }
}

/**
 * Notify an organizer when an admin approves or rejects their event.
 */
export async function notifyOrganizerEventStatus(
  organizerId: string,
  eventTitle: string,
  status: "approved" | "rejected"
): Promise<void> {
  try {
    const type = status === "approved" ? "EVENT_APPROVAL" : "EVENT_REJECTION";
    const message =
      status === "approved"
        ? `Your event "${eventTitle}" has been approved and is now live!`
        : `Your event "${eventTitle}" was rejected by an admin.`;

    await createNotification(
      organizerId,
      type,
      message,
      "/dashboard/events"
    );
  } catch (error) {
    console.error("notifyOrganizerEventStatus failed:", error);
  }
}

/**
 * Notify all followers of an organizer when a new event is approved.
 */
export async function notifyFollowersNewEvent(
  organizerId: string,
  eventId: string,
  eventTitle: string
): Promise<void> {
  try {
    const followsRef = collection(db, "follows");
    const q = query(followsRef, where("organizerId", "==", organizerId));
    const snapshot = await getDocs(q);
    const followerIds = snapshot.docs.map((d) => d.data().followerId as string);

    await createBulkNotifications(
      followerIds,
      "FOLLOWED_ORGANIZER_EVENT",
      `An organizer you follow just posted a new event: "${eventTitle}".`,
      `/events`
    );
  } catch (error) {
    console.error("notifyFollowersNewEvent failed:", error);
  }
}

/**
 * Notify the intended audience when an admin posts a global announcement.
 * Audience: "all" | "organizers" | "attendees"
 */
export async function notifyAnnouncementAudience(
  audience: string,
  announcementTitle: string
): Promise<void> {
  try {
    const usersRef = collection(db, "users");
    let recipientIds: string[] = [];

    if (audience === "all") {
      // Notify everyone (attendees + organizers)
      const snapshot = await getDocs(
        query(usersRef, where("role", "in", ["attendee", "organizer"]))
      );
      recipientIds = snapshot.docs.map((d) => d.id);
    } else {
      // audience is already a singular role value: "organizer" | "attendee"
      const snapshot = await getDocs(
        query(usersRef, where("role", "==", audience))
      );
      recipientIds = snapshot.docs.map((d) => d.id);
    }

    await createBulkNotifications(
      recipientIds,
      "GLOBAL_ANNOUNCEMENT",
      `New platform announcement: "${announcementTitle}".`,
      "/dashboard/announcements"
    );
  } catch (error) {
    console.error("notifyAnnouncementAudience failed:", error);
  }
}

async function getOrganizerFollowerIds(organizerId: string): Promise<string[]> {
  const followsRef = collection(db, "follows");
  const q = query(followsRef, where("organizerId", "==", organizerId));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((docSnap) => {
      const data = docSnap.data();
      return (data.followerId || data.attendeeId) as string | undefined;
    })
    .filter((id): id is string => Boolean(id));
}

async function getOrganizerRsvpAttendeeIds(organizerId: string): Promise<string[]> {
  const eventsRef = collection(db, "events");
  const eventsQuery = query(eventsRef, where("organizerId", "==", organizerId));
  const eventsSnapshot = await getDocs(eventsQuery);
  const attendeeIds = new Set<string>();

  await Promise.all(
    eventsSnapshot.docs.map(async (eventDoc) => {
      const rsvpsRef = collection(db, "events", eventDoc.id, "rsvps");
      const rsvpsSnapshot = await getDocs(rsvpsRef);

      rsvpsSnapshot.docs.forEach((rsvpDoc) => {
        const userId = (rsvpDoc.data().userId as string | undefined) || rsvpDoc.id;
        if (userId) {
          attendeeIds.add(userId);
        }
      });
    })
  );

  return Array.from(attendeeIds);
}

export async function notifyOrganizerAnnouncementAudience(
  organizerId: string,
  audience: "followers" | "rsvps" | "followers_and_rsvps",
  announcementTitle: string
): Promise<void> {
  try {
    const recipientIds = new Set<string>();

    if (audience === "followers" || audience === "followers_and_rsvps") {
      const followerIds = await getOrganizerFollowerIds(organizerId);
      followerIds.forEach((id) => recipientIds.add(id));
    }

    if (audience === "rsvps" || audience === "followers_and_rsvps") {
      const rsvpAttendeeIds = await getOrganizerRsvpAttendeeIds(organizerId);
      rsvpAttendeeIds.forEach((id) => recipientIds.add(id));
    }

    await createBulkNotifications(
      Array.from(recipientIds),
      "ORGANIZER_ANNOUNCEMENT",
      `New organizer announcement: "${announcementTitle}".`,
      "/dashboard/announcements"
    );
  } catch (error) {
    console.error("notifyOrganizerAnnouncementAudience failed:", error);
  }
}

/**
 * Notify all users who RSVP'd to an event when it is cancelled.
 */
export async function notifyRsvpEventCancelled(
  eventId: string,
  eventTitle: string
): Promise<void> {
  try {
    const rsvpsRef = collection(db, "events", eventId, "rsvps");
    const snapshot = await getDocs(rsvpsRef);
    const recipientIds = snapshot.docs.map((d) => d.id);

    await createBulkNotifications(
      recipientIds,
      "EVENT_CANCELLED",
      `The event "${eventTitle}" you RSVP'd to has been cancelled.`,
      "/events"
    );
  } catch (error) {
    console.error("notifyRsvpEventCancelled failed:", error);
  }
}

/**
 * Notify all users who RSVP'd to an event when it is updated.
 */
export async function notifyRsvpEventUpdated(
  eventId: string,
  eventTitle: string
): Promise<void> {
  try {
    const rsvpsRef = collection(db, "events", eventId, "rsvps");
    const snapshot = await getDocs(rsvpsRef);
    const recipientIds = snapshot.docs.map((d) => d.id);

    await createBulkNotifications(
      recipientIds,
      "EVENT_UPDATED",
      `The event "${eventTitle}" you RSVP'd to has been updated.`,
      "/events/rsvps"
    );
  } catch (error) {
    console.error("notifyRsvpEventUpdated failed:", error);
  }
}
