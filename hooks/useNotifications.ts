"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { NotificationData } from "@/lib/services/notifications";

interface UseNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
}

/**
 * Real-time hook that subscribes to the current user's notifications.
 * Automatically re-renders when Firestore documents change.
 */
export function useNotifications(): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef,
      where("recipientId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as NotificationData[];

        setNotifications(data);
        setFirestoreLoading(false);
      },
      (error) => {
        console.error("useNotifications snapshot error:", error);
        setFirestoreLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const activeNotifications = user?.uid ? notifications : [];
  const activeLoading = user?.uid ? firestoreLoading : false;
  const unreadCount = activeNotifications.filter((n) => !n.read).length;

  return { notifications: activeNotifications, unreadCount, loading: activeLoading };
}
