"use client";

import { useEffect, useState } from "react";
import { 
  createAnnouncement, 
  getOrganizerAnnouncements, 
  updateAnnouncement, 
  deleteAnnouncement,
  type AnnouncementData 
} from "@/lib/services/announcements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Trash2, Edit2, Check, X, Clock } from "lucide-react";

export default function AnnouncementManager({ organizerId }: { organizerId: string }) {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Form State
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const fetchAnnouncements = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await getOrganizerAnnouncements(organizerId);
      if (signal?.aborted) return;
      if (res.success && res.announcements) {
        setAnnouncements(res.announcements);
      } else if (!res.success) {
        alert("Failed to fetch announcements. Please try again.");
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Error fetching announcements:", error);
      alert("An error occurred while fetching announcements.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAnnouncements(controller.signal);
    return () => {
      controller.abort();
    };
  }, [organizerId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;
    
    try {
      const res = await createAnnouncement(organizerId, newTitle, newMessage);
      if (res.success) {
        setNewTitle("");
        setNewMessage("");
        fetchAnnouncements(); // Refresh list to get proper timestamps
      } else {
        alert("Failed to create announcement. Please try again.");
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      alert("An error occurred while creating announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (announcement: AnnouncementData) => {
    setEditingId(announcement.id!);
    setEditTitle(announcement.title);
    setEditMessage(announcement.message);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditMessage("");
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim() || !editMessage.trim()) return;
    
    try {
      const res = await updateAnnouncement(id, editTitle, editMessage);
      if (res.success) {
        setAnnouncements(prev => prev.map(a => 
          a.id === id ? { ...a, title: editTitle, message: editMessage } : a
        ));
        handleCancelEdit();
      } else {
        alert("Failed to update announcement. Please try again.");
      }
    } catch (error) {
      console.error("Error updating announcement:", error);
      alert("An error occurred while updating announcement.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    
    try {
      const res = await deleteAnnouncement(id);
      if (res.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      } else {
        alert("Failed to delete announcement. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert("An error occurred while deleting announcement.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Create Announcement Form */}
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 sticky top-8">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <Megaphone className="text-brand-orange" size={24} />
            <div>
              <h2 className="text-xl font-bold text-brand-dark tracking-tight">New Announcement</h2>
              <p className="text-sm text-slate-500 mt-0.5">Send a message to your attendees</p>
            </div>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Title</label>
              <Input 
                placeholder="E.g., Venue Change for Summer Fest" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Message</label>
              <Textarea 
                placeholder="Write your announcement here..." 
                className="resize-y min-h-[160px] bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md text-sm transition-colors"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                required
              />
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button 
                type="submit" 
                className="w-full bg-brand-dark hover:bg-brand-dark/90 text-white rounded-md px-6 py-2 transition-colors"
                disabled={isSubmitting || !newTitle.trim() || !newMessage.trim()}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Publishing...
                  </span>
                ) : "Publish Announcement"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-6">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Megaphone className="text-brand-orange" size={24} />
            <div>
              <h3 className="text-xl font-bold text-brand-dark tracking-tight">Past Announcements</h3>
              <p className="text-sm text-slate-500 mt-0.5">A history of messages you have sent</p>
            </div>
          </div>
          <div className="flex items-center justify-center bg-slate-100 text-slate-700 text-xs font-bold rounded-full px-3 py-1">
            {announcements.length} {announcements.length === 1 ? 'Total' : 'Total'}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-12">
            <p className="text-slate-500">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
            <p className="text-slate-500">You haven't published any announcements. Use the form to create one.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map((announcement) => {
              const dateObj = announcement.createdAt?.toMillis ? new Date(announcement.createdAt.toMillis()) : new Date();
              const dateStr = dateObj.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              const timeStr = dateObj.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' });
                
              const isEditing = editingId === announcement.id;

              return (
                <div 
                  key={announcement.id} 
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow p-6"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Edit2 size={16} className="text-brand-orange" />
                        <h4 className="font-bold text-brand-dark text-sm">Edit Announcement</h4>
                      </div>
                      <Input 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title"
                        className="bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md transition-colors"
                      />
                      <Textarea 
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                        placeholder="Message"
                        className="min-h-[100px] bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md transition-colors text-sm"
                      />
                      <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={handleCancelEdit} className="rounded-md px-4 py-2 text-sm">
                          Cancel
                        </Button>
                        <Button onClick={() => handleUpdate(announcement.id!)} className="bg-brand-dark hover:bg-brand-dark/90 text-white rounded-md px-4 py-2 text-sm">
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                        <div>
                          <h4 className="font-bold text-lg text-brand-dark">{announcement.title}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <Clock size={12} />
                            <span>{dateStr} at {timeStr}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit(announcement)}
                            className="h-8 px-2 text-slate-500 hover:text-brand-dark"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(announcement.id!)}
                            className="h-8 px-2 text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-slate-600 text-sm whitespace-pre-wrap">
                        {announcement.message}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
