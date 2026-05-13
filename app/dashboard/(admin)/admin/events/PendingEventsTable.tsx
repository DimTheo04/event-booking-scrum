'use client';

import { useState, useEffect } from 'react';
import { getPendingEvents, updateEventStatus } from '@/lib/services/admin';
import type { EventData } from '@/lib/services/events';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function PendingEventsTable() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingEventId, setRejectingEventId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const fetchEvents = async () => {
      try {
        const res = await getPendingEvents();
        if (!controller.signal.aborted) {
          if (res.success && res.events) {
            setEvents(res.events);
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error fetching events:', error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      controller.abort();
    };
  }, []);

  const filteredEvents = events.filter((event) => {
    const queryStr = searchQuery.toLowerCase();
    return event.organizerId?.toLowerCase().includes(queryStr) ||
      event.title?.toLowerCase().includes(queryStr);
  });

  const handleStatusUpdate = async (eventId: string, newStatus: 'approved' | 'rejected', reason?: string) => {
    setProcessingId(eventId);
    let success = false;
    try {
      const res = await updateEventStatus(eventId, newStatus, reason);
      if (res.success) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        success = true;
      } else {
        alert('Failed to update status. Please try again.');
      }
    } catch (error) {
      console.error(`Failed to update status:`, error);
      alert('An error occurred while updating status.');
    } finally {
      setProcessingId(null);
    }
    return success;
  };

  const openRejectModal = (eventId: string) => {
    setRejectingEventId(eventId);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectingEventId) return;
    if (!rejectReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    
    const success = await handleStatusUpdate(rejectingEventId, 'rejected', rejectReason.trim());
    
    // Only close and clear if processing was successful
    if (success) {
      setRejectModalOpen(false);
      setRejectingEventId(null);
      setRejectReason('');
    }
  };

  const closeRejectModal = () => {
    setRejectModalOpen(false);
    if (processingId !== rejectingEventId) {
      setRejectingEventId(null);
    }
    setRejectReason('');
  };

  if (loading) return <div className="text-center py-10 text-slate-500">Loading events...</div>;

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <h3 className="text-xl font-semibold text-brand-dark">Pending Events</h3>
        <Input
          placeholder="Search by Title or Organizer ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs focus-visible:ring-brand-light"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200 hover:bg-transparent">
              <TableHead className="text-slate-500 font-medium py-4">Title</TableHead>
              <TableHead className="text-slate-500 font-medium py-4">Organizer ID</TableHead>
              <TableHead className="text-slate-500 font-medium py-4">Location</TableHead>
              <TableHead className="text-slate-500 font-medium py-4">Date & Time</TableHead>
              <TableHead className="text-slate-500 font-medium py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                  No pending events found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow key={event.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-brand-dark py-4">{event.title}</TableCell>
                  <TableCell className="text-slate-600 py-4">{event.organizerId}</TableCell>
                  <TableCell className="text-slate-600 py-4">{event.location}</TableCell>
                  <TableCell className="text-slate-600 py-4">
                    {event.dateTime ? new Date(event.dateTime).toLocaleString() : 'TBD'}
                  </TableCell>
                  <TableCell className="text-right py-4 space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(event.id!, 'approved')}
                      disabled={processingId === event.id}
                      className="bg-brand-light hover:bg-brand-light/90 text-white rounded-md transition-colors"
                    >
                      {processingId === event.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRejectModal(event.id!)}
                      disabled={processingId === event.id}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                    >
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button 
              onClick={closeRejectModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-semibold text-brand-dark mb-4">Reject Event</h3>
            <p className="text-sm text-slate-600 mb-4">
              Please provide a reason for rejecting this event. This will be visible to the organizer.
            </p>
            <Textarea 
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mb-6 resize-none h-32 focus-visible:ring-brand-light"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeRejectModal}>
                Cancel
              </Button>
              <Button 
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white transition-colors"
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}