"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFollowedOrganizers, toggleFollow, UserProfile } from "@/lib/services/follows";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";

export default function AttendeeFollows() {
  const { user } = useAuth();
  const [organizers, setOrganizers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function loadFollows() {
      const res = await getFollowedOrganizers(user!.uid);
      if (res.success) {
        setOrganizers(res.organizers);
      } else {
        setError("Failed to load followed organizers.");
      }
      setLoading(false);
    }

    loadFollows();
  }, [user]);

  async function handleUnfollow(organizerId: string) {
    if (!user) return;

    const res = await toggleFollow(user.uid, organizerId);
    if (res.success && !res.isFollowing) {
      setOrganizers((current) => current.filter((org) => org.id !== organizerId));
    } else {
      // In a real app we might show a toast here
      alert(res.message || "Failed to unfollow");
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <p className="text-slate-500">Loading followed organizers...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
      <h3 className="text-xl font-semibold text-brand-dark border-b border-slate-100 pb-4">
        Followed Organizers
      </h3>

      {error && <p className="text-red-600">{error}</p>}

      {organizers.length === 0 && !error ? (
        <p className="text-slate-500">You are not following any organizers yet.</p>
      ) : (
        <ul className="space-y-4">
          {organizers.map((org) => (
            <li
              key={org.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-slate-100"
            >
              <div>
                <p className="font-semibold text-brand-dark">{org.displayName}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnfollow(org.id)}
                className="h-8 px-4 text-xs font-bold rounded-full bg-brand-orange !text-white hover:bg-brand-orange/90 transition-all shadow-sm"
              >
                <UserMinus size={14} className="mr-1.5" />
                Unfollow Organizer
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
