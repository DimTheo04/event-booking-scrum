import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

export interface FollowData {
  id?: string;
  followerId: string;
  organizerId: string;
  createdAt: { toMillis?: () => number } | null;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: string;
}

function getFirebaseErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    if (error.code === "permission-denied") {
      return "You do not have permission to perform this action.";
    }
  }
  return "An unexpected error occurred.";
}

export async function toggleFollow(followerId: string, organizerId: string) {
  try {
    if (!followerId || !organizerId) {
      throw new Error("Missing followerId or organizerId.");
    }

    const followsRef = collection(db, "follows");
    const q = query(
      followsRef,
      where("followerId", "==", followerId),
      where("organizerId", "==", organizerId)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Unfollow
      const followDoc = querySnapshot.docs[0];
      await deleteDoc(doc(db, "follows", followDoc.id));
      return { success: true, isFollowing: false, message: "Unfollowed successfully." };
    } else {
      // Follow
      await addDoc(followsRef, {
        followerId,
        organizerId,
        createdAt: serverTimestamp(),
      });
      return { success: true, isFollowing: true, message: "Followed successfully." };
    }
  } catch (error) {
    console.error("Error toggling follow:", error);
    return { success: false, error, message: getFirebaseErrorMessage(error) };
  }
}

export async function getFollowingIds(followerId: string) {
  try {
    const followsRef = collection(db, "follows");
    const q = query(followsRef, where("followerId", "==", followerId));
    const querySnapshot = await getDocs(q);

    const organizerIds = new Set<string>();
    querySnapshot.forEach((docSnap) => {
      organizerIds.add(docSnap.data().organizerId);
    });

    return { success: true, followingIds: organizerIds };
  } catch (error) {
    console.error("Error fetching following ids:", error);
    return { success: false, followingIds: new Set<string>(), error };
  }
}

export async function getFollowedOrganizers(followerId: string) {
  try {
    const followsRef = collection(db, "follows");
    const q = query(followsRef, where("followerId", "==", followerId));
    const querySnapshot = await getDocs(q);

    const organizers: UserProfile[] = [];
    
    // Fetch profiles sequentially or in parallel. In parallel is faster.
    const promises = querySnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const orgRef = doc(db, "users", data.organizerId);
      const orgSnap = await getDoc(orgRef);
      if (orgSnap.exists()) {
        const orgData = orgSnap.data();
        organizers.push({
          id: orgSnap.id,
          displayName: orgData.displayName || "Unknown",
          email: orgData.email || "",
          role: orgData.role || "organizer",
        });
      }
    });

    await Promise.all(promises);

    // Sort alphabetically by display name
    organizers.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return { success: true, organizers };
  } catch (error) {
    console.error("Error fetching followed organizers:", error);
    return { success: false, organizers: [], error };
  }
}

export async function getOrganizerFollowers(organizerId: string) {
  try {
    const followsRef = collection(db, "follows");
    const q = query(followsRef, where("organizerId", "==", organizerId));
    const querySnapshot = await getDocs(q);

    const attendees: UserProfile[] = [];
    
    const promises = querySnapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const userRef = doc(db, "users", data.followerId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        attendees.push({
          id: userSnap.id,
          displayName: userData.displayName || "Unknown",
          email: userData.email || "",
          role: userData.role || "attendee",
        });
      }
    });

    await Promise.all(promises);

    attendees.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return { success: true, followers: attendees, count: attendees.length };
  } catch (error) {
    console.error("Error fetching organizer followers:", error);
    return { success: false, followers: [], count: 0, error };
  }
}
