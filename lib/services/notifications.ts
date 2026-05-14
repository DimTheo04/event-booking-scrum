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
  type Timestamp,
} from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | "EVENT_REQUEST"
  | "RSVP_NEW"
  | "EVENT_APPROVAL"
  | "EVENT_REJECTION"
  | "GLOBAL_ANNOUNCEMENT"
  | "FOLLOWED_ORGANIZER_EVENT";

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
      `/dashboard/events/${eventId}`
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
