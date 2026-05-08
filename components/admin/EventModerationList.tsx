"use client";

import { useEffect, useState } from "react";
import { getPendingEvents, updateEventStatus } from "@/lib/services/admin";
import { type EventData } from "@/lib/services/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, MapPin, CalendarDays, Search } from "lucide-react";

export default function EventModerationList() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    const res = await getPendingEvents();
    if (res.success && res.events) {
      setEvents(res.events);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleApprove = async (eventId: string) => {
    const res = await updateEventStatus(eventId, "approved");
    if (res.success) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } else {
      alert("Failed to approve event.");
    }
  };

  const handleReject = async (eventId: string) => {
    const res = await updateEventStatus(eventId, "rejected", rejectReason);
    if (res.success) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setRejectingId(null);
      setRejectReason("");
    } else {
      alert("Failed to reject event.");
    }
  };

  // The PRD mentions searching pending events by organizer name.
  // Since we only store organizerId in the event doc in MVP (we didn't join users), 
  // we can do a simple client-side search by title or just implement basic filtering.
  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.organizerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <p className="text-slate-500">Loading pending events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search by event title or organizer ID..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <p className="text-slate-500">No pending events found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map(event => {
            const dateStr = event.dateTime ? new Date(event.dateTime).toLocaleString(undefined, {
              dateStyle: "medium", timeStyle: "short"
            }) : "TBD";

            return (
              <div key={event.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg text-brand-dark">{event.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full border bg-yellow-100 text-yellow-800 border-yellow-200 font-medium uppercase tracking-wider">
                      Pending
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 mt-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-brand-light" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-brand-light" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 mt-2">
                    <p><strong>Category:</strong> {event.category}</p>
                    <p><strong>Price:</strong> {event.price > 0 ? `€${event.price}` : 'Free'}</p>
                    <p><strong>Capacity:</strong> {event.capacity || 'Unlimited'}</p>
                    <p className="text-xs mt-1"><strong>Organizer ID:</strong> {event.organizerId}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[200px] justify-center">
                  {rejectingId === event.id ? (
                    <div className="space-y-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <Input 
                        placeholder="Reason for rejection (optional)" 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="text-sm h-8"
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleReject(event.id!)}
                          className="w-full bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                        >
                          Confirm Reject
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason("");
                          }}
                          className="w-full h-8 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button 
                        onClick={() => handleApprove(event.id!)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white flex gap-2"
                      >
                        <CheckCircle size={18} />
                        Approve Event
                      </Button>
                      <Button 
                        onClick={() => setRejectingId(event.id!)}
                        variant="outline"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex gap-2"
                      >
                        <XCircle size={18} />
                        Reject Event
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
