"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { announcementSchema, type AnnouncementFormValues } from "@/lib/schemas";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Megaphone, Trash2, Edit2, Clock } from "lucide-react";

export default function AnnouncementManager({ organizerId, isAdmin = false }: { organizerId: string, isAdmin?: boolean }) {
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema) as Resolver<AnnouncementFormValues>,
    defaultValues: {
      title: "",
      message: "",
      targetAudience: "all",
    },
  });

  const loadAnnouncements = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await getOrganizerAnnouncements(organizerId);
      if (signal?.aborted) return;
      if (res.success && res.announcements) {
        return res.announcements;
      } else if (!res.success) {
        alert("Failed to fetch announcements. Please try again.");
      }
    } catch (error) {
      if (signal?.aborted) return;
      console.error("Error fetching announcements:", error);
      alert("An error occurred while fetching announcements.");
    }
  }, [organizerId]);

  useEffect(() => {
    const controller = new AbortController();
    loadAnnouncements(controller.signal)
      .then((nextAnnouncements) => {
        if (!controller.signal.aborted && nextAnnouncements) {
          setAnnouncements(nextAnnouncements);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => {
      controller.abort();
    };
  }, [loadAnnouncements]);

  async function onSubmit(values: AnnouncementFormValues) {
    try {
      const res = await createAnnouncement(organizerId, values);
      if (res.success) {
        form.reset();
        const nextAnnouncements = await loadAnnouncements();
        if (nextAnnouncements) {
          setAnnouncements(nextAnnouncements);
        }
      } else {
        form.setError("root", {
          message: "Failed to create announcement. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      form.setError("root", {
        message: "An error occurred while creating announcement.",
      });
    }
  }

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
    try {
      const validated = announcementSchema.pick({ title: true, message: true }).safeParse({
        title: editTitle,
        message: editMessage
      });

      if (!validated.success) {
        alert(validated.error.issues[0]?.message || "Invalid input.");
        return;
      }

      const res = await updateAnnouncement(id, validated.data);
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
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="E.g., Schedule Update for Summer Fest"
                        className="bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Target Audience</FormLabel>
                    <FormControl>
                      <select 
                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-brand-orange/30 transition-colors"
                        {...field}
                      >
                        <option value="all">All Users</option>
                        <option value="organizer">Organizers Only</option>
                        {!isAdmin && <option value="attendee">Attendees Only</option>}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700">Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your announcement here..." 
                        className="resize-y min-h-[160px] bg-white border-slate-300 focus:ring-brand-orange/30 rounded-md text-sm transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                  {form.formState.errors.root.message}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button 
                  type="submit" 
                  className="w-full bg-brand-dark hover:bg-brand-dark/90 text-white rounded-md px-6 py-2 transition-colors"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Publishing...
                    </span>
                  ) : "Publish Announcement"}
                </Button>
              </div>
            </form>
          </Form>
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
            <p className="text-slate-500">You haven&apos;t published any announcements. Use the form to create one.</p>
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
                          <div className="flex items-center gap-2 text-xs mt-1">
                            {announcement.targetAudience && announcement.targetAudience !== 'all' && (
                              <span className="bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full font-medium uppercase tracking-wider text-[10px]">
                                {announcement.targetAudience}s
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock size={12} />
                              <span>{dateStr} at {timeStr}</span>
                            </div>
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
