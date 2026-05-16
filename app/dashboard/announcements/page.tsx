"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import {
  getVisibleAnnouncementsForUser,
  type AnnouncementData,
} from "@/lib/services/announcements";
import { Megaphone, Clock } from "lucide-react";

function getAnnouncementSource(announcement: AnnouncementData) {
  const target = announcement.targetAudience || "all";
  const isOrganizerAnnouncement =
    announcement.audienceType === "organizer" ||
    target === "followers" ||
    target === "rsvps" ||
    target === "followers_and_rsvps";

  return isOrganizerAnnouncement
    ? {
        label: "Organizer Announcement",
        className: "bg-orange-50 text-orange-700 border-orange-200",
      }
    : {
        label: "Platform Announcement",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
}

export default function AnnouncementsPage() {
  const { user, userData } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAnnouncements = async () => {
      try {
        if (!user?.uid || !userData?.role) return;

        const res = await getVisibleAnnouncementsForUser(
          user.uid,
          userData.role
        );
        if (!controller.signal.aborted) {
          if (res.success && res.announcements) {
            setAnnouncements(res.announcements);
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching announcements:", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (user && userData) {
      fetchAnnouncements();
    }

    return () => {
      controller.abort();
    };
  }, [user, userData]);

  if (!userData) return null;

  return (
    <div className="p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">Announcements</h2>
          <p className="text-slate-600 mt-2">
            View event updates and important information from the platform admins.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Megaphone className="text-brand-orange" size={24} />
            <h3 className="text-xl font-semibold text-brand-dark">
              Latest Announcements
            </h3>
          </div>

          {loading ? (
            <p className="text-slate-500 py-4">Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <p className="text-slate-500 py-4">No recent announcements.</p>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => {
                const source = getAnnouncementSource(announcement);
                const dateObj = announcement.createdAt?.toMillis ? new Date(announcement.createdAt.toMillis()) : new Date();
                const dateStr = dateObj.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = dateObj.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });

                return (
                  <div key={announcement.id} className="bg-gray-50 border border-slate-100 rounded-lg p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${source.className}`}
                          >
                            {source.label}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock size={12} />
                            <span>{dateStr} at {timeStr}</span>
                          </div>
                        </div>
                        <h4 className="font-bold text-lg text-brand-dark">
                          {announcement.title}
                        </h4>
                      </div>
                    </div>
                    <div className="text-slate-600 text-sm whitespace-pre-wrap">
                      {announcement.message}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
