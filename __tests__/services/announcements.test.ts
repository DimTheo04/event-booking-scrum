import {
  createAnnouncement,
  deleteAnnouncement,
  getOrganizerAnnouncements,
  getPlatformAnnouncements,
  getVisibleAnnouncementsForUser,
  updateAnnouncement,
} from '@/lib/services/announcements';
import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  notifyAnnouncementAudience,
  notifyOrganizerAnnouncementAudience,
} from '@/lib/services/notifications';

jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((...path: unknown[]) => ({ path })),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn((...path: unknown[]) => ({ path })),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn((...args: unknown[]) => ({ args })),
  where: jest.fn((field: string, op: string, value: unknown) => ({ field, op, value })),
  serverTimestamp: jest.fn(() => 'mocked-timestamp'),
}));

jest.mock('@/lib/services/notifications', () => ({
  notifyAnnouncementAudience: jest.fn().mockResolvedValue(undefined),
  notifyOrganizerAnnouncementAudience: jest.fn().mockResolvedValue(undefined),
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

describe('Announcement Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a platform announcement and notifies the selected audience', async () => {
    (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'announcement1' });

    const result = await createAnnouncement(
      'admin1',
      {
        title: 'Platform News',
        message: 'This announcement is long enough.',
        targetAudience: 'attendee',
      },
      { isAdmin: true }
    );

    expect(result.success).toBe(true);
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        authorId: 'admin1',
        title: 'Platform News',
        targetAudience: 'attendee',
        audienceType: 'platform',
        createdAt: 'mocked-timestamp',
      })
    );
    expect(notifyAnnouncementAudience).toHaveBeenCalledWith(
      'attendee',
      'Platform News'
    );
  });

  it('creates an organizer announcement and notifies organizer-specific recipients', async () => {
    (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'announcement1' });

    const result = await createAnnouncement('organizer1', {
      title: 'Organizer News',
      message: 'This announcement is long enough.',
      targetAudience: 'followers_and_rsvps',
    });

    expect(result.success).toBe(true);
    expect(addDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        authorId: 'organizer1',
        audienceType: 'organizer',
        targetAudience: 'followers_and_rsvps',
      })
    );
    expect(notifyOrganizerAnnouncementAudience).toHaveBeenCalledWith(
      'organizer1',
      'followers_and_rsvps',
      'Organizer News'
    );
  });

  it('rejects platform-only audiences for organizer announcements', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await createAnnouncement('organizer1', {
      title: 'Invalid Organizer News',
      message: 'This announcement is long enough.',
      targetAudience: 'all',
    });

    expect(result.success).toBe(false);
    expect(addDoc).not.toHaveBeenCalled();
    expect(notifyOrganizerAnnouncementAudience).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('returns organizer announcements sorted by createdAt desc', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([
        makeDoc('announcement1', {
          title: 'Older',
          authorId: 'organizer1',
          createdAt: { toMillis: () => 1000 },
        }),
        makeDoc('announcement2', {
          title: 'Newer',
          authorId: 'organizer1',
          createdAt: { toMillis: () => 2000 },
        }),
      ])
    );

    const result = await getOrganizerAnnouncements('organizer1');

    expect(result.success).toBe(true);
    expect(result.announcements.map((announcement) => announcement.id)).toEqual([
      'announcement2',
      'announcement1',
    ]);
    expect(where).toHaveBeenCalledWith('authorId', '==', 'organizer1');
  });

  it('returns platform announcements sorted by createdAt desc', async () => {
    (getDocs as jest.Mock).mockResolvedValueOnce(
      makeSnapshot([
        makeDoc('announcement1', {
          title: 'Older',
          audienceType: 'platform',
          createdAt: { toMillis: () => 1000 },
        }),
        makeDoc('announcement2', {
          title: 'Newer',
          audienceType: 'platform',
          createdAt: { toMillis: () => 2000 },
        }),
      ])
    );

    const result = await getPlatformAnnouncements();

    expect(result.success).toBe(true);
    expect(result.announcements.map((announcement) => announcement.id)).toEqual([
      'announcement2',
      'announcement1',
    ]);
  });

  it('filters visible announcements for attendees by platform audience, follows, and RSVPs', async () => {
    (getDocs as jest.Mock)
      .mockResolvedValueOnce(
        makeSnapshot([
          makeDoc('platform-all', {
            authorId: 'admin1',
            title: 'All',
            targetAudience: 'all',
            audienceType: 'platform',
            createdAt: { toMillis: () => 5000 },
          }),
          makeDoc('platform-organizer', {
            authorId: 'admin1',
            title: 'Organizers',
            targetAudience: 'organizer',
            audienceType: 'platform',
            createdAt: { toMillis: () => 4000 },
          }),
          makeDoc('followed-organizer', {
            authorId: 'org-followed',
            title: 'Followers',
            targetAudience: 'followers',
            audienceType: 'organizer',
            createdAt: { toMillis: () => 3000 },
          }),
          makeDoc('rsvped-organizer', {
            authorId: 'org-rsvped',
            title: 'RSVPs',
            targetAudience: 'rsvps',
            audienceType: 'organizer',
            createdAt: { toMillis: () => 2000 },
          }),
          makeDoc('hidden-organizer', {
            authorId: 'org-hidden',
            title: 'Hidden',
            targetAudience: 'followers',
            audienceType: 'organizer',
            createdAt: { toMillis: () => 1000 },
          }),
        ])
      )
      .mockResolvedValueOnce(
        makeSnapshot([makeDoc('follow1', { organizerId: 'org-followed' })])
      )
      .mockResolvedValueOnce(
        makeSnapshot([
          makeDoc('event1', {
            organizerId: 'org-rsvped',
            status: 'approved',
          }),
          makeDoc('event2', {
            organizerId: 'org-hidden',
            status: 'approved',
          }),
        ])
      );
    (getDoc as jest.Mock)
      .mockResolvedValueOnce({ exists: () => true })
      .mockResolvedValueOnce({ exists: () => false });

    const result = await getVisibleAnnouncementsForUser('attendee1', 'attendee');

    expect(result.success).toBe(true);
    expect(result.announcements.map((announcement) => announcement.id).sort()).toEqual([
      'followed-organizer',
      'platform-all',
      'rsvped-organizer',
    ]);
    expect(where).toHaveBeenCalledWith('followerId', '==', 'attendee1');
    expect(where).toHaveBeenCalledWith('status', '==', 'approved');
  });

  it('validates announcement updates before writing', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const invalid = await updateAnnouncement('announcement1', {
      title: 'No',
      message: 'short',
    });
    expect(invalid.success).toBe(false);
    expect(updateDoc).not.toHaveBeenCalled();

    const valid = await updateAnnouncement('announcement1', {
      title: 'Updated',
      message: 'This updated announcement is long enough.',
    });
    expect(valid.success).toBe(true);
    expect(updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'Updated',
        message: 'This updated announcement is long enough.',
        updatedAt: 'mocked-timestamp',
      })
    );

    consoleSpy.mockRestore();
  });

  it('deletes announcements by id', async () => {
    const result = await deleteAnnouncement('announcement1');

    expect(result.success).toBe(true);
    expect(deleteDoc).toHaveBeenCalledWith(expect.anything());
  });
});
