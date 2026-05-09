'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

export type PendingEvent = {
  id: string;
  title: string;
  organizerId: string;
  location: string;
  dateTime: string;
  status: string;
  [key: string]: any;
};

export default function PendingEventsTable() {
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Αυτό το κομμάτι τραβάει τα δεδομένα από τον browser
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, where('status', '==', 'pending'));
        const querySnapshot = await getDocs(q);

        const fetchedEvents: PendingEvent[] = [];
        querySnapshot.forEach((doc) => {
          fetchedEvents.push({ id: doc.id, ...doc.data() } as PendingEvent);
        });
        setEvents(fetchedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const queryStr = searchQuery.toLowerCase();
    return event.organizerId?.toLowerCase().includes(queryStr) ||
      event.title?.toLowerCase().includes(queryStr);
  });

  const handleStatusUpdate = async (eventId: string, newStatus: 'approved' | 'rejected') => {
    setProcessingId(eventId);
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (error) {
      console.error(`Failed to update status:`, error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="text-center py-10">Φόρτωση εκδηλώσεων...</div>;

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <h3 className="text-xl font-semibold text-[#172d13]">Pending Events</h3>
        <Input
          placeholder="Search by Title or Organizer ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs focus-visible:ring-[#6bb77b]"
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
                  <TableCell className="font-medium text-[#172d13] py-4">{event.title}</TableCell>
                  <TableCell className="text-slate-600 py-4">{event.organizerId}</TableCell>
                  <TableCell className="text-slate-600 py-4">{event.location}</TableCell>
                  <TableCell className="text-slate-600 py-4">
                    {new Date(event.dateTime).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right py-4 space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(event.id, 'approved')}
                      disabled={processingId === event.id}
                      className="bg-[#6bb77b] hover:bg-[#5da06b] text-white rounded-md transition-colors"
                    >
                      {processingId === event.id ? 'Processing...' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(event.id, 'rejected')}
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