"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface UserData {
  displayName: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (!currentUser.emailVerified) {
          await signOut(auth);
          router.push("/login");
          return;
        }

        setUser(currentUser);
        // Fetch custom user data from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        }
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || !userData) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-md">
            <p className="text-sm text-gray-500 font-medium">Display Name</p>
            <p className="text-lg font-semibold">{userData.displayName}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-md">
            <p className="text-sm text-gray-500 font-medium">Email</p>
            <p className="text-lg font-semibold">{userData.email}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-md">
            <p className="text-sm text-gray-500 font-medium">Role</p>
            <p className="text-lg font-semibold capitalize text-blue-600">
              {userData.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
