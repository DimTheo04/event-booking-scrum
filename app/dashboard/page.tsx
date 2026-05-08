"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

interface UserData {
  displayName: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch custom user data from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p className="text-slate-500">Loading profile...</p>
      </div>
    );
  }

  if (!userData) {
    return null; 
  }

  return (
    <div className="p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">
            Welcome back, {userData.displayName}!
          </h2>
          <p className="text-slate-600 mt-2">
            Here is your account overview.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="text-xl font-semibold text-brand-dark border-b border-slate-100 pb-4">Profile Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500 font-medium mb-1">Display Name</p>
              <p className="text-lg font-semibold text-brand-dark">{userData.displayName}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500 font-medium mb-1">Email</p>
              <p className="text-lg font-semibold text-brand-dark">{userData.email}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-slate-100 md:col-span-2">
              <p className="text-sm text-slate-500 font-medium mb-1">Role</p>
              <p className="text-lg font-semibold capitalize text-brand-orange">
                {userData.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
