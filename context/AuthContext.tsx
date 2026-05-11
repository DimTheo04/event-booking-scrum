"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "attendee" | "organizer" | "admin";

export interface UserData {
  displayName: string;
  email: string;
  role: UserRole;
  createdAt?: unknown;
}

interface AuthContextValue {
  /** Firebase Auth user object, or null if unauthenticated */
  user: User | null;
  /** Role fetched from Firestore users/{uid}.role */
  role: UserRole | null;
  /** Full Firestore user document */
  userData: UserData | null;
  /** True while the initial auth + Firestore fetch is in-flight */
  loading: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  userData: null,
  loading: true,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Fetch role + profile from Firestore
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        } else {
          // Firestore doc missing — treat as no data
          setUserData(null);
        }
      } else {
        // Signed out
        setUser(null);
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    role: userData?.role ?? null,
    userData,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the global auth state anywhere inside `<AuthProvider>`.
 * Must be called from a client component.
 */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
