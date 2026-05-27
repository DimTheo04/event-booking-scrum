import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '@/hooks/useNotifications';
import { onSnapshot } from 'firebase/firestore';

jest.mock('@/lib/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
}));

let mockUser: { uid: string } | null = { uid: 'user123' };

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}));

describe('useNotifications hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { uid: 'user123' };
  });

  it('should initialize with empty notifications and loading state', () => {
    // Make onSnapshot do nothing immediately
    (onSnapshot as jest.Mock).mockImplementation(() => jest.fn());

    const { result } = renderHook(() => useNotifications());

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.loading).toBe(true);
  });

  it('should correctly parse a mocked Firestore snapshot and calculate unreadCount', () => {
    let snapshotCallback: (snapshot: { docs: Array<{ id: string; data: () => Record<string, unknown> }> }) => void;
    
    (onSnapshot as jest.Mock).mockImplementation((query, callback) => {
      snapshotCallback = callback;
      return jest.fn(); // unsubscribe function
    });

    const { result } = renderHook(() => useNotifications());

    act(() => {
      // Simulate firestore sending data
      snapshotCallback({
        docs: [
          { id: 'notif1', data: () => ({ read: false, message: 'Message 1' }) },
          { id: 'notif2', data: () => ({ read: true, message: 'Message 2' }) },
          { id: 'notif3', data: () => ({ read: false, message: 'Message 3' }) },
        ]
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.notifications.length).toBe(3);
    expect(result.current.unreadCount).toBe(2);
    expect(result.current.notifications[0].id).toBe('notif1');
  });

  it('should return empty if user is not logged in', () => {
    mockUser = null;
    const { result } = renderHook(() => useNotifications());
    
    expect(result.current.notifications).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(onSnapshot).not.toHaveBeenCalled();
  });
});
