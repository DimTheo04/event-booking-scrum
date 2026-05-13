'use client';

import { useState, useEffect } from 'react';
import { getPendingEvents, updateEventStatus } from '@/lib/services/admin';
import type { EventData } from '@/lib/services/events';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

  const handleStatusUpdate = async (eventId: string, newStatus: 'approved' | 'rejected') => {
    setProcessingId(eventId);
    try {
      const res = await updateEventStatus(eventId, newStatus);
      if (res.success) {
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
      } else {
        alert('Failed to update status. Please try again.');
      }
    } catch (error) {
      console.error(`Failed to update status:`, error);
      alert('An error occurred while updating status.');
    } finally {
      setProcessingId(null);
    }
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
                      onClick={() => handleStatusUpdate(event.id!, 'rejected')}
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
    </div>
  );
}