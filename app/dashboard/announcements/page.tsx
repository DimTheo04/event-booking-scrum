"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { getPlatformAnnouncements, type AnnouncementData } from "@/lib/services/announcements";
import { Megaphone, Clock } from "lucide-react";

export default function AnnouncementsPage() {
  const { userData } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchAnnouncements = async () => {
      try {
        const res = await getPlatformAnnouncements();
        if (!controller.signal.aborted) {
          if (res.success && res.announcements) {
            const role = userData?.role || "attendee";
            const filtered = res.announcements.filter((a) => {
              const target = a.targetAudience || "all";
              return target === "all" || target === role;
            });
            setAnnouncements(filtered);
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

    if (userData) {
      fetchAnnouncements();
    }

    return () => {
      controller.abort();
    };
  }, [userData]);

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
                const dateObj = announcement.createdAt?.toMillis ? new Date(announcement.createdAt.toMillis()) : new Date();
                const dateStr = dateObj.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = dateObj.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });

                return (
                  <div key={announcement.id} className="bg-gray-50 border border-slate-100 rounded-lg p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h4 className="font-bold text-lg text-brand-dark">{announcement.title}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={12} />
                        <span>{dateStr} at {timeStr}</span>
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
