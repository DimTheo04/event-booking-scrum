import {
  getFollowedOrganizers,
  getFollowingIds,
  getOrganizerFollowers,
  toggleFollow,
} from '@/lib/services/follows';
import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  where,
} from 'firebase/firestore';

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((...path: unknown[]) => ({ path })),
  query: jest.fn((...args: unknown[]) => ({ args })),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
  getDocs: jest.fn(),
  doc: jest.fn((...path: unknown[]) => ({ path })),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mocked-timestamp'),
}));

function makeDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    data: () => data,
  };
}

function makeSnapshot(docs: Array<ReturnType<typeof makeDoc>>, empty = false) {
  return {
    docs,
    empty,
    forEach: (callback: (docSnap: ReturnType<typeof makeDoc>) => void) => {
      docs.forEach(callback);
    },
  };
}

describe('Follow Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a follow when the attendee is not already following the organizer', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(makeSnapshot([], true));
    (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'follow1' });

    const result = await toggleFollow('attendee1', 'organizer1');

    expect(result.success).toBe(true);
    expect(result.isFollowing).toBe(true);
    expect(where).toHaveBeenCalledWith('followerId', '==', 'attendee1');
    expect(where).toHaveBeenCalledWith('organizerId', '==', 'organizer1');
    expect(addDoc).toHaveBeenCalledWith(expect.anything(), {
      followerId: 'attendee1',
      organizerId: 'organizer1',
      createdAt: 'mocked-timestamp',
    });
    expect(serverTimestamp).toHaveBeenCalledTimes(1);
  });

  it('deletes the existing follow when the attendee is already following the organizer', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([makeDoc('follow1', { followerId: 'attendee1', organizerId: 'organizer1' })])
    );

    const result = await toggleFollow('attendee1', 'organizer1');

    expect(result.success).toBe(true);
    expect(result.isFollowing).toBe(false);
    expect(doc).toHaveBeenCalledWith({}, 'follows', 'follow1');
    expect(deleteDoc).toHaveBeenCalledWith(expect.anything());
    expect(addDoc).not.toHaveBeenCalled();
  });

  it('returns followed organizer ids for an attendee', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([
        makeDoc('follow1', { organizerId: 'org2' }),
        makeDoc('follow2', { organizerId: 'org1' }),
      ])
    );

    const result = await getFollowingIds('attendee1');

    expect(result.success).toBe(true);
    expect(Array.from(result.followingIds).sort()).toEqual(['org1', 'org2']);
  });

  it('returns followed organizer profiles sorted by display name', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([
        makeDoc('follow1', { organizerId: 'org2' }),
        makeDoc('follow2', { organizerId: 'org1' }),
      ])
    );
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({
        exists: () => true,
        id: 'org2',
        data: () => ({
          displayName: 'Beta Organizer',
          email: 'beta@example.com',
          role: 'organizer',
        }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        id: 'org1',
        data: () => ({
          displayName: 'Alpha Organizer',
          email: 'alpha@example.com',
          role: 'organizer',
        }),
      });

    const result = await getFollowedOrganizers('attendee1');

    expect(result.success).toBe(true);
    expect(result.organizers.map((organizer) => organizer.id)).toEqual(['org1', 'org2']);
    expect(result.organizers[0].displayName).toBe('Alpha Organizer');
  });

  it('returns organizer followers sorted by display name', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([
        makeDoc('follow1', { followerId: 'attendee2' }),
        makeDoc('follow2', { followerId: 'attendee1' }),
      ])
    );
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({
        exists: () => true,
        id: 'attendee2',
        data: () => ({
          displayName: 'Beta Attendee',
          email: 'beta@example.com',
          role: 'attendee',
        }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        id: 'attendee1',
        data: () => ({
          displayName: 'Alpha Attendee',
          email: 'alpha@example.com',
          role: 'attendee',
        }),
      });

    const result = await getOrganizerFollowers('organizer1');

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.followers.map((follower) => follower.id)).toEqual([
      'attendee1',
      'attendee2',
    ]);
  });
});
