"use client";

import PendingEventsTable from "./PendingEventsTable";

export default function AdminEventsPage() {
  // Parent (admin) layout guard ensures only admins reach here.
  return (
    <div className="p-8 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">
            Event Moderation
          </h2>
          <p className="text-slate-600 mt-2">
            Review pending events submitted by organizers. Approve to make them
            public or reject them with feedback.
          </p>
        </div>

        <PendingEventsTable />
      </div>
    </div>
  );
}