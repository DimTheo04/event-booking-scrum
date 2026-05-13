"use client";

import { useEffect, useState } from "react";
import { getAllUsers, updateUserRole, deleteUser, type UserData } from "@/lib/services/admin";
import { Button } from "@/components/ui/button";
import { Search, ShieldAlert, ShieldCheck, User as UserIcon, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function UserManagementTable() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await getAllUsers();
        if (!controller.signal.aborted) {
          if (res.success && res.users) {
            setUsers(res.users);
          } else if (!res.success) {
            alert("Failed to fetch users. Please try again.");
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching users:", error);
          alert("An error occurred while fetching users.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      controller.abort();
    };
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        alert("Failed to update user role.");
      }
    } catch (error) {
      console.error("Failed to update user role:", error);
      alert("An unexpected error occurred.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete the user ${email}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(userId);
    try {
      const res = await deleteUser(userId);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const message =
          res.error instanceof Error
            ? res.error.message
            : typeof res.error === "string"
              ? res.error
              : "Failed to delete user.";
        alert(message);
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <p className="text-slate-500">Loading users...</p>
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch(role) {
      case "admin": return <ShieldAlert size={16} className="text-red-500" />;
      case "organizer": return <ShieldCheck size={16} className="text-brand-orange" />;
      default: return <UserIcon size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search by email, name, or role..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-brand-dark">{user.displayName || "Unknown"}</div>
                      <div className="text-slate-500 text-xs">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{user.id}</code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="capitalize font-medium">{user.role || "attendee"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {updatingId === user.id && <span className="text-xs text-brand-orange animate-pulse">Updating...</span>}
                        {deletingId === user.id && <span className="text-xs text-red-600 animate-pulse">Deleting...</span>}
                        <select 
                          className="border border-slate-300 rounded px-2 py-1 text-xs bg-white outline-none focus:ring-1 focus:ring-brand-light"
                          value={user.role || "attendee"}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updatingId === user.id || deletingId === user.id}
                        >
                          <option value="attendee">Attendee</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={updatingId === user.id || deletingId === user.id}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Delete user"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
