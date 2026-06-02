import {
  clearAllNotifications,
  deleteNotification,
  markNotificationAsRead,
  notifyAdminsNewEvent,
  notifyAnnouncementAudience,
  notifyFollowersNewEvent,
  notifyOrganizerAnnouncementAudience,
  notifyOrganizerRsvp,
  notifyRsvpEventCancelled,
} from '@/lib/services/notifications';
import {
  addDoc,
  deleteDoc,
  getDocs,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const mockBatch = {
  set: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((...path: unknown[]) => ({ path })),
  addDoc: jest.fn(),
  doc: jest.fn((...path: unknown[]) => ({ path })),
  updateDoc: jest.fn(),
  query: jest.fn((...args: unknown[]) => ({ args })),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => 'mocked-timestamp'),
  writeBatch: jest.fn(() => mockBatch),
  deleteDoc: jest.fn(),
}));

function makeDoc(id: string, data: Record<string, unknown> = {}) {
  return {
    id,
    ref: { id, path: `notifications/${id}` },
    data: () => data,
  };
}

function makeSnapshot(docs: Array<ReturnType<typeof makeDoc>>, empty = false) {
  return {
    docs,
    empty,
  };
}

function writtenRecipients() {
  return mockBatch.set.mock.calls.map((call) => {
    const payload = call[1] as { recipientId: string };
    return payload.recipientId;
  });
}

describe('Notification Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBatch.set.mockClear();
    mockBatch.delete.mockClear();
    mockBatch.commit.mockClear();
  });

  it('marks a notification as read', async () => {
    await markNotificationAsRead('notification1');

    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { read: true });
  });

  it('deletes a notification by id', async () => {
    await deleteNotification('notification1');

    expect(deleteDoc).toHaveBeenCalledWith(expect.anything());
  });

  it('notifies all admins when a new event is submitted', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([makeDoc('admin1'), makeDoc('admin2')])
    );

    await notifyAdminsNewEvent('Pending Event');

    expect(where).toHaveBeenCalledWith('role', '==', 'admin');
    expect(writeBatch).toHaveBeenCalledTimes(1);
    expect(writtenRecipients()).toEqual(['admin1', 'admin2']);
    expect(mockBatch.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'EVENT_REQUEST',
        message: expect.stringContaining('Pending Event'),
        actionLink: '/dashboard/admin/events',
        read: false,
      })
    );
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it('creates a direct organizer notification for a new RSVP', async () => {
    await notifyOrganizerRsvp('organizer1', 'event1', 'Approved Event');

    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        recipientId: 'organizer1',
        type: 'RSVP_NEW',
        message: expect.stringContaining('Approved Event'),
        actionLink: '/dashboard/events',
        read: false,
      })
    );
  });

  it('notifies followers when an organizer event is approved', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([
        makeDoc('follow1', { followerId: 'attendee1' }),
        makeDoc('follow2', { followerId: 'attendee2' }),
      ])
    );

    await notifyFollowersNewEvent('organizer1', 'event1', 'Approved Event');

    expect(where).toHaveBeenCalledWith('organizerId', '==', 'organizer1');
    expect(writtenRecipients()).toEqual(['attendee1', 'attendee2']);
    expect(mockBatch.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'FOLLOWED_ORGANIZER_EVENT',
        actionLink: '/events',
      })
    );
  });

  it('notifies platform announcement recipients by audience', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([makeDoc('attendee1'), makeDoc('organizer1')])
    );

    await notifyAnnouncementAudience('all', 'Platform News');

    expect(where).toHaveBeenCalledWith('role', 'in', ['attendee', 'organizer']);
    expect(writtenRecipients()).toEqual(['attendee1', 'organizer1']);
    expect(mockBatch.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'GLOBAL_ANNOUNCEMENT',
        actionLink: '/dashboard/announcements',
      })
    );
  });

  it('deduplicates organizer announcement recipients from followers and RSVPs', async () => {
    (getDocs as jest.Mock)
      .mockResolvedValueOnce(
        makeSnapshot([
          makeDoc('follow1', { followerId: 'attendee1' }),
          makeDoc('follow2', { attendeeId: 'attendee2' }),
        ])
      )
      .mockResolvedValueOnce(
        makeSnapshot([
          makeDoc('event1', { organizerId: 'organizer1' }),
          makeDoc('event2', { organizerId: 'organizer1' }),
        ])
      )
      .mockResolvedValueOnce(
        makeSnapshot([
          makeDoc('attendee2'),
          makeDoc('rsvp1', { userId: 'attendee3' }),
        ])
      )
      .mockResolvedValueOnce(makeSnapshot([makeDoc('attendee1')]));

    await notifyOrganizerAnnouncementAudience(
      'organizer1',
      'followers_and_rsvps',
      'Organizer News'
    );

    expect(writtenRecipients().sort()).toEqual(['attendee1', 'attendee2', 'attendee3']);
    expect(mockBatch.set).toHaveBeenCalledTimes(3);
    expect(mockBatch.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'ORGANIZER_ANNOUNCEMENT',
        actionLink: '/dashboard/announcements',
      })
    );
  });

  it('notifies RSVP users when an event is cancelled', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([makeDoc('attendee1'), makeDoc('attendee2')])
    );

    await notifyRsvpEventCancelled('event1', 'Cancelled Event');

    expect(writtenRecipients()).toEqual(['attendee1', 'attendee2']);
    expect(mockBatch.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'EVENT_CANCELLED',
        message: expect.stringContaining('Cancelled Event'),
        actionLink: '/events',
      })
    );
  });

  it('clears notifications for a user in a write batch', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([makeDoc('notification1'), makeDoc('notification2')])
    );

    await clearAllNotifications('user1');

    expect(where).toHaveBeenCalledWith('recipientId', '==', 'user1');
    expect(mockBatch.delete).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });
});
