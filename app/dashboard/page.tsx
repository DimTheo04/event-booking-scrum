"use client";

import { useAuth } from "@/context/AuthContext";
import AttendeeFollows from "@/components/dashboard/AttendeeFollows";
import OrganizerFollowers from "@/components/dashboard/OrganizerFollowers";

export default function DashboardPage() {
  const { userData } = useAuth();

  // RoleGuard in the parent layout already handles loading + auth redirect.
  // By the time this renders, userData is guaranteed to be present.
  if (!userData) return null;

  return (
    <div className="p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">
            Welcome back, {userData.displayName}!
          </h2>
          <p className="text-slate-600 mt-2">Here is your account overview.</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <h3 className="text-xl font-semibold text-brand-dark border-b border-slate-100 pb-4">
            Profile Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500 font-medium mb-1">
                Display Name
              </p>
              <p className="text-lg font-semibold text-brand-dark">
                {userData.displayName}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500 font-medium mb-1">Email</p>
              <p className="text-lg font-semibold text-brand-dark">
                {userData.email}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-slate-100 md:col-span-2">
              <p className="text-sm text-slate-500 font-medium mb-1">Role</p>
              <p className="text-lg font-semibold capitalize text-brand-orange">
                {userData.role}
              </p>
            </div>
          </div>
        </div>

        {userData.role === "attendee" && <AttendeeFollows />}
        {userData.role === "organizer" && <OrganizerFollowers />}
      </div>
    </div>
  );
}
