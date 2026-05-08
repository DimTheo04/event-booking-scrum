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

  const fetchAnnouncements = async () => {
    setLoading(true);
    const res = await getOrganizerAnnouncements(organizerId);
    if (res.success && res.announcements) {
      setAnnouncements(res.announcements);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [organizerId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;
    
    setIsSubmitting(true);
    const res = await createAnnouncement(organizerId, newTitle, newMessage);
    if (res.success) {
      setNewTitle("");
      setNewMessage("");
      fetchAnnouncements(); // Refresh list to get proper timestamps
    } else {
      alert("Failed to create announcement.");
    }
    setIsSubmitting(false);
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
    
    const res = await updateAnnouncement(id, editTitle, editMessage);
    if (res.success) {
      setAnnouncements(prev => prev.map(a => 
        a.id === id ? { ...a, title: editTitle, message: editMessage } : a
      ));
      handleCancelEdit();
    } else {
      alert("Failed to update announcement.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    
    const res = await deleteAnnouncement(id);
    if (res.success) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } else {
      alert("Failed to delete announcement.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Create Announcement Form */}
      <div className="lg:col-span-5 xl:col-span-4">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 sticky top-8 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-brand-orange to-orange-400 rounded-2xl shadow-sm">
              <Megaphone className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-2xl text-brand-dark tracking-tight">New Announcement</h3>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Send a message to your attendees</p>
            </div>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Title</label>
              <Input 
                placeholder="E.g., Venue Change for Summer Fest" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-slate-50/50 border-slate-200/60 focus:bg-white focus:ring-brand-orange/20 rounded-xl h-12 px-4 transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Message</label>
              <Textarea 
                placeholder="Write your announcement here..." 
                className="resize-y min-h-[160px] bg-slate-50/50 border-slate-200/60 focus:bg-white focus:ring-brand-orange/20 rounded-xl p-4 leading-relaxed transition-all"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-brand-dark hover:bg-black text-white rounded-xl h-14 font-bold tracking-wide shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5"
              disabled={isSubmitting || !newTitle.trim() || !newMessage.trim()}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Publishing...
                </span>
              ) : "Publish Announcement"}
            </Button>
          </form>
        </div>
      </div>

      {/* Announcements Feed */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-6">
        <div className="flex items-center justify-between mb-6 px-2">
          <div>
            <h3 className="font-extrabold text-3xl text-brand-dark tracking-tight">Past Announcements</h3>
            <p className="text-slate-500 font-medium mt-1">A history of messages you have sent</p>
          </div>
          <div className="flex items-center justify-center bg-white shadow-sm border border-slate-100 rounded-full px-4 py-2">
            <span className="text-sm font-bold text-brand-dark">
              {announcements.length} {announcements.length === 1 ? 'Announcement' : 'Announcements'}
            </span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="h-16 w-16 bg-brand-light/20 rounded-full animate-ping absolute"></div>
                <div className="h-16 w-16 bg-brand-light/40 rounded-full relative z-10"></div>
              </div>
              <p className="text-slate-400 font-medium animate-pulse">Loading announcements...</p>
            </div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white/50 p-20 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center transition-all hover:bg-white hover:border-slate-300">
            <div className="bg-slate-100/50 p-6 rounded-full mb-6">
              <Megaphone className="text-slate-300" size={40} />
            </div>
            <h4 className="text-2xl font-extrabold text-brand-dark mb-2">No announcements yet</h4>
            <p className="text-slate-500 max-w-md text-lg leading-relaxed">You haven't published any announcements. Use the form on the left to create one.</p>
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
                  className="group bg-white rounded-[2rem] p-8 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-brand-light/20 transition-all duration-500"
                >
                  {isEditing ? (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Edit2 size={16} className="text-brand-orange" />
                        <h4 className="font-bold text-brand-dark">Edit Announcement</h4>
                      </div>
                      <Input 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title"
                        className="font-bold text-lg bg-slate-50 border-slate-200 rounded-xl h-12 px-4"
                      />
                      <Textarea 
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                        placeholder="Message"
                        className="min-h-[140px] bg-slate-50 border-slate-200 rounded-xl p-4 leading-relaxed text-slate-700"
                      />
                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={handleCancelEdit} className="rounded-xl hover:bg-slate-100 text-slate-600 font-semibold px-6">
                          Cancel
                        </Button>
                        <Button onClick={() => handleUpdate(announcement.id!)} className="bg-brand-dark hover:bg-black text-white rounded-xl shadow-md font-semibold px-8">
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in duration-500">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl w-14 h-14 border border-slate-100 shadow-sm shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dateObj.toLocaleString(undefined, { month: 'short' })}</span>
                            <span className="text-lg font-extrabold text-brand-dark leading-none">{dateObj.getDate()}</span>
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xl text-brand-dark tracking-tight">{announcement.title}</h4>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
                              <Clock size={12} />
                              <span>{timeStr}</span>
                              <span className="mx-1.5 w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="text-brand-orange bg-orange-50 px-2 py-0.5 rounded-full">Published</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white shadow-sm border border-slate-100 rounded-xl p-1">
                          <button 
                            onClick={() => handleStartEdit(announcement)}
                            className="p-2.5 text-slate-400 hover:text-brand-dark hover:bg-slate-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(announcement.id!)}
                            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-[15px]">{announcement.message}</p>
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
