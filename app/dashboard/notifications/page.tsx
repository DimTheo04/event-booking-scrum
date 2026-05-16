"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, ExternalLink, Inbox } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { markNotificationAsRead } from "@/lib/services/notifications";
import type { NotificationData, NotificationType } from "@/lib/services/notifications";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: { toMillis?: () => number } | null): string {
  if (!timestamp?.toMillis) return "Just now";
  const diff = Date.now() - timestamp.toMillis();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_LABEL: Record<NotificationType, string> = {
  EVENT_REQUEST: "New Event Submission",
  RSVP_NEW: "New RSVP",
  EVENT_APPROVAL: "Event Approved",
  EVENT_REJECTION: "Event Rejected",
  GLOBAL_ANNOUNCEMENT: "Platform Announcement",
  ORGANIZER_ANNOUNCEMENT: "Organizer Announcement",
  FOLLOWED_ORGANIZER_EVENT: "New Event from Organizer",
  EVENT_CANCELLED: "Event Cancelled",
  EVENT_UPDATED: "Event Updated",
};

const TYPE_COLOR: Record<NotificationType, string> = {
  EVENT_REQUEST: "bg-blue-50 text-blue-700",
  RSVP_NEW: "bg-purple-50 text-purple-700",
  EVENT_APPROVAL: "bg-green-50 text-green-700",
  EVENT_REJECTION: "bg-red-50 text-red-700",
  GLOBAL_ANNOUNCEMENT: "bg-amber-50 text-amber-700",
  ORGANIZER_ANNOUNCEMENT: "bg-orange-50 text-orange-700",
  FOLLOWED_ORGANIZER_EVENT: "bg-teal-50 text-teal-700",
  EVENT_CANCELLED: "bg-rose-50 text-rose-700",
  EVENT_UPDATED: "bg-blue-50 text-blue-700",
};

// ─── Notification Card ────────────────────────────────────────────────────────

interface NotificationCardProps {
  notification: NotificationData;
  onAction: (notification: NotificationData) => void;
}

function NotificationCard({ notification, onAction }: NotificationCardProps) {
  const label = TYPE_LABEL[notification.type] ?? "Notification";
  const tagColor = TYPE_COLOR[notification.type] ?? "bg-gray-50 text-gray-700";
  const isUnread = !notification.read;

  return (
    <div
      className={`relative flex gap-4 p-5 rounded-xl border transition-all duration-200 ${
        isUnread
          ? "bg-white border-[#6bb77b] shadow-sm"
          : "bg-white border-[#e2e8f0]"
      }`}
    >
      {/* Unread side indicator */}
      {isUnread && (
        <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-[#6bb77b]" />
      )}

      {/* Bell icon */}
      <div
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUnread ? "bg-[#172d13]/10" : "bg-gray-100"
        }`}
      >
        <Bell size={18} className={isUnread ? "text-[#172d13]" : "text-gray-400"} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span
            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${tagColor}`}
          >
            {label}
          </span>
          <span className="text-xs text-slate-400">
            {formatRelativeTime(notification.createdAt)}
          </span>
          {!isUnread && (
            <span className="text-xs text-slate-400 flex items-center gap-0.5">
              <CheckCircle2 size={12} /> Read
            </span>
          )}
        </div>
        <p
          className={`text-sm leading-relaxed ${
            isUnread ? "text-[#172d13] font-medium" : "text-slate-500"
          }`}
        >
          {notification.message}
        </p>
      </div>

      {/* Action button */}
      <div className="shrink-0 flex items-center">
        <button
          onClick={() => onAction(notification)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
            isUnread
              ? "bg-[#d76f30] text-white hover:bg-[#c0612a]"
              : "bg-[#f9fafb] text-[#172d13] border border-[#e2e8f0] hover:bg-[#e2e8f0]"
          }`}
        >
          {notification.type === "EVENT_CANCELLED"
            ? "Find new Events"
            : notification.type === "EVENT_UPDATED"
            ? "View My RSVPs"
            : "View"}
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, loading } = useNotifications();

  async function handleAction(notification: NotificationData) {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    router.push(notification.actionLink);
  }

  return (
    <div className="min-h-full bg-[#f9fafb]">
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Bell size={26} className="text-[#172d13]" />
            <h1 className="text-2xl font-extrabold text-[#172d13] tracking-tight">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="text-sm font-bold bg-[#d76f30] text-white rounded-full px-2.5 py-0.5 leading-none">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            Your full notification history. Click &quot;View&quot; to be taken to the relevant page.
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-white border border-[#e2e8f0] animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#172d13]/10 flex items-center justify-center mb-4">
              <Inbox size={32} className="text-[#172d13]" />
            </div>
            <h2 className="text-lg font-bold text-[#172d13] mb-1">
              No notifications yet
            </h2>
            <p className="text-sm text-slate-500 max-w-xs">
              You&apos;re all caught up! Notifications from events, RSVPs, and
              announcements will appear here.
            </p>
          </div>
        )}

        {/* Notification list */}
        {!loading && notifications.length > 0 && (
          <>
            {/* Unread section */}
            {unreadCount > 0 && (
              <section className="mb-8">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Unread
                </h2>
                <div className="space-y-3">
                  {notifications
                    .filter((n) => !n.read)
                    .map((n) => (
                      <NotificationCard
                        key={n.id}
                        notification={n}
                        onAction={handleAction}
                      />
                    ))}
                </div>
              </section>
            )}

            {/* Read / History section */}
            {notifications.filter((n) => n.read).length > 0 && (
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Earlier
                </h2>
                <div className="space-y-3">
                  {notifications
                    .filter((n) => n.read)
                    .map((n) => (
                      <NotificationCard
                        key={n.id}
                        notification={n}
                        onAction={handleAction}
                      />
                    ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
