import { 
  createEvent, 
  cancelEvent, 
  updateEvent, 
  getOrganizerEvents, 
  getDiscoverableEvents,
  toggleEventRsvp
} from '@/lib/services/events';
import { addDoc, getDoc, updateDoc, getDocs, runTransaction } from 'firebase/firestore';
import { notifyOrganizerRsvp } from '@/lib/services/notifications';

jest.mock('@/lib/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'mocked-collection'),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mocked-timestamp'),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(() => 'mocked-doc'),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  runTransaction: jest.fn(),
  writeBatch: jest.fn(() => ({
    update: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined)
  })),
  getDocs: jest.fn(),
}));

jest.mock('@/lib/services/notifications', () => ({
  notifyAdminsNewEvent: jest.fn().mockResolvedValue(undefined),
  notifyOrganizerRsvp: jest.fn().mockResolvedValue(undefined),
  notifyRsvpEventCancelled: jest.fn().mockResolvedValue(undefined),
  notifyRsvpEventUpdated: jest.fn().mockResolvedValue(undefined),
}));

describe('Event Service - createEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail validation immediately if bad data is provided', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const badData = {
      title: 'A', // too short
      description: 'Short',
      location: '',
      category: '',
      dateTime: '2020-01-01',
      price: -10,
    } as never;

    const result = await createEvent(badData, 'org123');

    expect(result.success).toBe(false);
    expect(addDoc).not.toHaveBeenCalled();
    expect(result.message).toBeDefined();
    consoleSpy.mockRestore();
  });

  it('should call addDoc with expected payload and pending status when data is valid', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const validData = {
      title: 'Valid Event Title',
      description: 'This is a valid event description that passes validation.',
      location: 'Athens, Greece',
      category: 'music',
      dateTime: futureDate,
      price: 20,
      capacity: 100,
    };

    (addDoc as jest.Mock).mockResolvedValue({ id: 'mocked-event-id' });

    const result = await createEvent(validData, 'org123');

    expect(result.success).toBe(true);
    // Verify payload sent to addDoc
    expect(addDoc).toHaveBeenCalledTimes(1);
    const payload = (addDoc as jest.Mock).mock.calls[0][1];
    expect(payload.status).toBe('pending');
  });
});

describe('Event Service - cancelEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return error if event is not found', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });
    const result = await cancelEvent('missing-id');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Event not found.');
  });

  it('should cancel event if it exists', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ title: 'My Event' })
    });
    (updateDoc as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await cancelEvent('event123');

    expect(result.success).toBe(true);
    expect(updateDoc).toHaveBeenCalledTimes(1);
    const updatePayload = (updateDoc as jest.Mock).mock.calls[0][1];
    expect(updatePayload).toEqual({ status: 'cancelled' });
  });
});

describe('Event Service - updateEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fail validation on bad update data', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await updateEvent('event123', { description: 'short' } as never);
    expect(result.success).toBe(false);
    consoleSpy.mockRestore();
  });

  it('should return error if event not found during update', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const result = await updateEvent('missing-id', {
      description: 'A valid description longer than 10 chars',
      location: 'Athens',
      category: 'music',
      dateTime: futureDate,
      price: 10,
      capacity: 50
    });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Event not found.');
  });
});

describe('Event Service - getOrganizerEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array if no events', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      forEach: () => {} 
    });
    const result = await getOrganizerEvents('org1');
    expect(result.success).toBe(true);
    expect(result.events).toEqual([]);
  });

  it('should return events sorted by createdAt desc', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce({
      forEach: (cb: (doc: { id: string; data: () => Record<string, unknown> }) => void) => {
        cb({ id: '1', data: () => ({ title: 'Event 1', status: 'pending', createdAt: { toMillis: () => 1000 } }) });
        cb({ id: '2', data: () => ({ title: 'Event 2', status: 'pending', createdAt: { toMillis: () => 2000 } }) });
      }
    });
    const result = await getOrganizerEvents('org1');
    expect(result.success).toBe(true);
    expect(result.events[0].id).toBe('2'); // Newest first
    expect(result.events[1].id).toBe('1');
  });
});

describe('Event Service - getDiscoverableEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter out non-approved events and sort by date asc', async () => {
    const futureDate1 = new Date(Date.now() + 86400000).toISOString();
    const futureDate2 = new Date(Date.now() + 186400000).toISOString();
    
    (getDocs as jest.Mock).mockResolvedValueOnce({
      docs: [
        { id: '1', data: () => ({ status: 'pending', dateTime: futureDate1, organizerId: 'org1' }) },
        { id: '2', data: () => ({ status: 'approved', dateTime: futureDate2, organizerId: 'org1' }) },
        { id: '3', data: () => ({ status: 'approved', dateTime: futureDate1, organizerId: 'org2' }) },
      ]
    });

    (getDoc as jest.Mock).mockResolvedValue({
      data: () => ({ displayName: 'Mocked Organizer' })
    });

    const result = await getDiscoverableEvents();
    expect(result.success).toBe(true);
    expect(result.events.length).toBe(2);
    // Sort asc by date
    expect(result.events[0].id).toBe('3');
    expect(result.events[0].organizerName).toBe('Mocked Organizer');
    expect(result.events[1].id).toBe('2');
  });
});

describe('Event Service - toggleEventRsvp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if event not found', async () => {
    (runTransaction as jest.Mock).mockImplementation(async (db, callback) => {
      const mockTransaction = {
        get: jest.fn().mockResolvedValueOnce({ exists: () => false }), 
      };
      return callback(mockTransaction);
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await toggleEventRsvp('event1', 'user1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('This event is no longer available.');
    consoleSpy.mockRestore();
  });

  it('should create an RSVP for an attendee when the event is approved, upcoming, and has capacity', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    let mockTransaction: {
      get: jest.Mock;
      set: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };

    (runTransaction as jest.Mock).mockImplementation(async (_db, callback) => {
      mockTransaction = {
        get: jest.fn()
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
              title: 'Approved Event',
              organizerId: 'organizer1',
              status: 'approved',
              dateTime: futureDate,
              capacity: 3,
              rsvpCount: 2,
            }),
          })
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ role: 'attendee' }),
          })
          .mockResolvedValueOnce({ exists: () => false }),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };

      return callback(mockTransaction);
    });

    const result = await toggleEventRsvp('event1', 'user1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.rsvped).toBe(true);
      expect(result.rsvpCount).toBe(3);
    }
    expect(mockTransaction!.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'user1',
        timestamp: 'mocked-timestamp',
      })
    );
    expect(mockTransaction!.update).toHaveBeenCalledWith(
      expect.anything(),
      { rsvpCount: 3 }
    );
    expect(notifyOrganizerRsvp).toHaveBeenCalledWith(
      'organizer1',
      'event1',
      'Approved Event'
    );
  });

  it('should cancel an existing RSVP and decrement the RSVP count', async () => {
    let mockTransaction: {
      get: jest.Mock;
      set: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };

    (runTransaction as jest.Mock).mockImplementation(async (_db, callback) => {
      mockTransaction = {
        get: jest.fn()
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
              status: 'approved',
              dateTime: new Date(Date.now() + 86400000).toISOString(),
              rsvpCount: 1,
            }),
          })
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ role: 'attendee' }),
          })
          .mockResolvedValueOnce({ exists: () => true }),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };

      return callback(mockTransaction);
    });

    const result = await toggleEventRsvp('event1', 'user1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.rsvped).toBe(false);
      expect(result.rsvpCount).toBe(0);
    }
    expect(mockTransaction!.delete).toHaveBeenCalledTimes(1);
    expect(mockTransaction!.update).toHaveBeenCalledWith(
      expect.anything(),
      { rsvpCount: 0 }
    );
    expect(notifyOrganizerRsvp).not.toHaveBeenCalled();
  });

  it('should reject RSVP attempts from non-attendees', async () => {
    (runTransaction as jest.Mock).mockImplementation(async (_db, callback) => {
      const mockTransaction = {
        get: jest.fn()
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
              status: 'approved',
              dateTime: new Date(Date.now() + 86400000).toISOString(),
            }),
          })
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ role: 'organizer' }),
          }),
      };

      return callback(mockTransaction);
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await toggleEventRsvp('event1', 'organizer1');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Only attendees can RSVP to events.');
    consoleSpy.mockRestore();
  });

  it('should reject new RSVPs when the event is full', async () => {
    (runTransaction as jest.Mock).mockImplementation(async (_db, callback) => {
      const mockTransaction = {
        get: jest.fn()
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
              status: 'approved',
              dateTime: new Date(Date.now() + 86400000).toISOString(),
              capacity: 2,
              rsvpCount: 2,
            }),
          })
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ role: 'attendee' }),
          })
          .mockResolvedValueOnce({ exists: () => false }),
        set: jest.fn(),
        update: jest.fn(),
      };

      return callback(mockTransaction);
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await toggleEventRsvp('event1', 'user1');

    expect(result.success).toBe(false);
    expect(result.message).toBe('This event is currently full.');
    consoleSpy.mockRestore();
  });

  it('should reject new RSVPs for cancelled, completed, pending, rejected, or past events', async () => {
    const blockedEvents = [
      { status: 'cancelled', dateTime: new Date(Date.now() + 86400000).toISOString() },
      { status: 'completed', dateTime: new Date(Date.now() + 86400000).toISOString() },
      { status: 'pending', dateTime: new Date(Date.now() + 86400000).toISOString() },
      { status: 'rejected', dateTime: new Date(Date.now() + 86400000).toISOString() },
      { status: 'approved', dateTime: new Date(Date.now() - 86400000).toISOString() },
    ];
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    for (const eventData of blockedEvents) {
      (runTransaction as jest.Mock).mockImplementationOnce(async (_db, callback) => {
        const mockTransaction = {
          get: jest.fn()
            .mockResolvedValueOnce({
              exists: () => true,
              data: () => ({
                ...eventData,
                rsvpCount: 0,
              }),
            })
            .mockResolvedValueOnce({
              exists: () => true,
              data: () => ({ role: 'attendee' }),
            })
            .mockResolvedValueOnce({ exists: () => false }),
          set: jest.fn(),
          update: jest.fn(),
        };

        return callback(mockTransaction);
      });

      const result = await toggleEventRsvp('event1', 'user1');
      expect(result.success).toBe(false);
      expect(result.message).toBe('This event is not accepting new RSVPs.');
    }

    consoleSpy.mockRestore();
  });
});
