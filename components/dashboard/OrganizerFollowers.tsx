"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getOrganizerFollowers, UserProfile } from "@/lib/services/follows";
import { Users } from "lucide-react";

export default function OrganizerFollowers() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function loadFollowers() {
      const res = await getOrganizerFollowers(user!.uid);
      if (res.success) {
        setFollowers(res.followers);
        setCount(res.count);
      } else {
        setError("Failed to load followers.");
      }
      setLoading(false);
    }

    loadFollowers();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <p className="text-slate-500">Loading followers...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h3 className="text-xl font-semibold text-brand-dark">Followers</h3>
        <div className="flex items-center gap-2 bg-brand-orange/10 px-3 py-1.5 rounded-full">
          <Users size={16} className="text-brand-orange" />
          <span className="font-bold text-brand-dark">{count}</span>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      {followers.length === 0 && !error ? (
        <p className="text-slate-500">You don't have any followers yet.</p>
      ) : (
        <ul className="space-y-4">
          {followers.map((follower) => (
            <li
              key={follower.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-slate-100"
            >
              <div>
                <p className="font-semibold text-brand-dark">{follower.displayName}</p>
                <p className="text-sm text-slate-500">{follower.email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
