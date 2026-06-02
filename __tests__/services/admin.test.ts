import {
  deleteUser,
  getAllUsers,
  getPendingEvents,
  updateEventStatus,
  updateUserRole,
} from '@/lib/services/admin';
import { auth } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import {
  notifyFollowersNewEvent,
  notifyOrganizerEventStatus,
} from '@/lib/services/notifications';

type MockCurrentUser = {
  getIdToken: jest.Mock<Promise<string>, []>;
};

jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((...path: unknown[]) => ({ path })),
  doc: jest.fn((...path: unknown[]) => ({ path })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn((...args: unknown[]) => ({ args })),
  updateDoc: jest.fn(),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
}));

jest.mock('@/lib/services/notifications', () => ({
  notifyOrganizerEventStatus: jest.fn().mockResolvedValue(undefined),
  notifyFollowersNewEvent: jest.fn().mockResolvedValue(undefined),
}));

function makeDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
  };
}

function makeSnapshot(docs: Array<ReturnType<typeof makeDoc>>) {
  return {
    docs,
    forEach: (callback: (docSnap: ReturnType<typeof makeDoc>) => void) => {
      docs.forEach(callback);
    },
  };
}

describe('Admin Service', () => {
  const originalFetch = global.fetch;
  const mockedAuth = auth as { currentUser: MockCurrentUser | null };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAuth.currentUser = null;
    global.fetch = originalFetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('fetches pending events with organizer names sorted by createdAt desc', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([
        makeDoc('event1', {
          title: 'Older Event',
          organizerId: 'org1',
          status: 'pending',
          createdAt: { toMillis: () => 1000 },
        }),
        makeDoc('event2', {
          title: 'Newer Event',
          organizerId: 'org2',
          status: 'pending',
          createdAt: { toMillis: () => 2000 },
        }),
      ])
    );
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({
        data: () => ({ displayName: 'Organizer One' }),
      })
      .mockResolvedValueOnce({
        data: () => ({ displayName: 'Organizer Two' }),
      });

    const result = await getPendingEvents();

    expect(result.success).toBe(true);
    expect(result.events.map((event) => event.id)).toEqual(['event2', 'event1']);
    expect(result.events[0].organizerName).toBe('Organizer Two');
    expect(collection).toHaveBeenCalledWith({}, 'events');
    expect(where).toHaveBeenCalledWith('status', '==', 'pending');
    expect(query).toHaveBeenCalled();
  });

  it('approves a future event and notifies organizer and followers', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    (getDoc as jest.Mock).mockResolvedValueOnce({
      data: () => ({
        title: 'Future Event',
        organizerId: 'org1',
        dateTime: futureDate,
      }),
    });
    (updateDoc as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await updateEventStatus('event1', 'approved');

    expect(result.success).toBe(true);
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { status: 'approved' });
    expect(notifyOrganizerEventStatus).toHaveBeenCalledWith(
      'org1',
      'Future Event',
      'approved'
    );
    expect(notifyFollowersNewEvent).toHaveBeenCalledWith(
      'org1',
      'event1',
      'Future Event'
    );
  });

  it('marks past approved events completed without follower notifications', async () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    (getDoc as jest.Mock).mockResolvedValueOnce({
      data: () => ({
        title: 'Past Event',
        organizerId: 'org1',
        dateTime: pastDate,
      }),
    });

    const result = await updateEventStatus('event1', 'approved');

    expect(result.success).toBe(true);
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { status: 'completed' });
    expect(notifyOrganizerEventStatus).toHaveBeenCalledWith(
      'org1',
      'Past Event',
      'approved'
    );
    expect(notifyFollowersNewEvent).not.toHaveBeenCalled();
  });

  it('rejects an event with a rejection reason and does not notify followers', async () => {
    (getDoc as jest.Mock).mockResolvedValueOnce({
      data: () => ({
        title: 'Rejected Event',
        organizerId: 'org1',
        dateTime: new Date(Date.now() + 86400000).toISOString(),
      }),
    });

    const result = await updateEventStatus('event1', 'rejected', 'Missing details.');

    expect(result.success).toBe(true);
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), {
      status: 'rejected',
      rejectReason: 'Missing details.',
    });
    expect(notifyOrganizerEventStatus).toHaveBeenCalledWith(
      'org1',
      'Rejected Event',
      'rejected'
    );
    expect(notifyFollowersNewEvent).not.toHaveBeenCalled();
  });

  it('lists users from Firestore', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([
        makeDoc('user1', {
          email: 'attendee@example.com',
          displayName: 'Attendee',
          role: 'attendee',
        }),
        makeDoc('user2', {
          email: 'organizer@example.com',
          displayName: 'Organizer',
          role: 'organizer',
        }),
      ])
    );

    const result = await getAllUsers();

    expect(result.success).toBe(true);
    expect(result.users).toEqual([
      {
        id: 'user1',
        email: 'attendee@example.com',
        displayName: 'Attendee',
        role: 'attendee',
      },
      {
        id: 'user2',
        email: 'organizer@example.com',
        displayName: 'Organizer',
        role: 'organizer',
      },
    ]);
  });

  it('validates role updates before writing to Firestore', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const invalid = await updateUserRole('user1', 'superadmin');
    expect(invalid.success).toBe(false);
    expect(updateDoc).not.toHaveBeenCalled();

    const valid = await updateUserRole('user1', 'admin');
    expect(valid.success).toBe(true);
    expect(doc).toHaveBeenCalledWith({}, 'users', 'user1');
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { role: 'admin' });

    consoleSpy.mockRestore();
  });

  it('requires a signed-in admin client before deleting a user', async () => {
    const result = await deleteUser('user1');

    expect(result.success).toBe(false);
    expect(result.error).toEqual(expect.any(Error));
  });

  it('sends the current user token to the admin delete API', async () => {
    mockedAuth.currentUser = {
      getIdToken: jest.fn().mockResolvedValue('token123'),
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    }) as unknown as typeof fetch;

    const result = await deleteUser('target/user');

    expect(result.success).toBe(true);
    expect(mockedAuth.currentUser.getIdToken).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/target%2Fuser', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer token123',
      },
    });
  });
});
