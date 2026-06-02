import {
  signUpSchema,
  signInSchema,
  eventCreationSchema,
  eventDiscoveryFilterSchema,
  rsvpActionSchema,
  rsvpLookupSchema,
  announcementSchema,
  platformAnnouncementSchema,
  organizerAnnouncementSchema,
  roleUpdateSchema
} from '../lib/schemas';

describe('Zod Schemas Complete Suite', () => {

  describe('signUpSchema', () => {
    it('should validate a correct sign up payload', () => {
      const result = signUpSchema.safeParse({ email: 'test@example.com', password: 'password123', displayName: 'Test User', role: 'attendee' });
      expect(result.success).toBe(true);
    });
    it('should fail on invalid email', () => {
      const result = signUpSchema.safeParse({ email: 'invalid', password: 'password123', displayName: 'Test User', role: 'attendee' });
      expect(result.success).toBe(false);
    });
    it('should fail on invalid role', () => {
      const result = signUpSchema.safeParse({ email: 'test@example.com', password: 'password123', displayName: 'Test User', role: 'superadmin' });
      expect(result.success).toBe(false);
    });
    it('should fail if password is too short', () => {
      const result = signUpSchema.safeParse({ email: 'test@example.com', password: 'short', displayName: 'Test User', role: 'attendee' });
      expect(result.success).toBe(false);
    });
  });

  describe('signInSchema', () => {
    it('should validate a correct sign in payload', () => {
      expect(signInSchema.safeParse({ email: 'test@example.com', password: 'password123' }).success).toBe(true);
    });
    it('should fail if password is empty', () => {
      expect(signInSchema.safeParse({ email: 'test@example.com', password: '' }).success).toBe(false);
    });
  });

  describe('eventCreationSchema', () => {
    it('should fail if event date is in the past', () => {
      const result = eventCreationSchema.safeParse({
        title: 'My Past Event', description: 'A very cool past event that happened yesterday.',
        location: 'Athens', category: 'music', dateTime: '2020-01-01T10:00:00.000Z', price: 10
      });
      expect(result.success).toBe(false);
    });
    it('should validate a correct future event', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      expect(eventCreationSchema.safeParse({
        title: 'My Future Event', description: 'A very cool future event that will happen.',
        location: 'Athens', category: 'music', dateTime: futureDate, price: 10, capacity: 100
      }).success).toBe(true);
    });
    it('should transform zero or NaN capacity to undefined', () => {
       const futureDate = new Date(Date.now() + 86400000).toISOString();
       const result = eventCreationSchema.safeParse({
         title: 'My Future Event', description: 'A very cool future event that will happen.',
         location: 'Athens', category: 'music', dateTime: futureDate, price: 10, capacity: 0
       });
       expect(result.success).toBe(true);
       if (result.success) {
         expect(result.data.capacity).toBeUndefined();
       }
    });
  });

  describe('eventDiscoveryFilterSchema', () => {
    it('should apply defaults when empty', () => {
      const result = eventDiscoveryFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ search: '', category: 'all', startDate: '', endDate: '' });
      }
    });
    it('should fail on invalid date format', () => {
      expect(eventDiscoveryFilterSchema.safeParse({ startDate: '12-05-2024' }).success).toBe(false);
    });
    it('should pass on valid date format', () => {
      expect(eventDiscoveryFilterSchema.safeParse({ startDate: '2024-05-12' }).success).toBe(true);
    });
  });

  describe('rsvpActionSchema & rsvpLookupSchema', () => {
    it('should fail if firestore document id contains a slash', () => {
      expect(rsvpActionSchema.safeParse({ eventId: 'event/123', userId: 'user123' }).success).toBe(false);
    });
    it('should pass with valid ids', () => {
      expect(rsvpActionSchema.safeParse({ eventId: 'event123', userId: 'user123' }).success).toBe(true);
    });
    it('should validate array of eventIds', () => {
      expect(rsvpLookupSchema.safeParse({ eventIds: ['e1', 'e2'], userId: 'u1' }).success).toBe(true);
    });
  });

  describe('Announcement Schemas', () => {
    it('should validate a generic announcement', () => {
      expect(announcementSchema.safeParse({ title: 'Hello', message: 'This is a long enough message' }).success).toBe(true);
    });
    it('should set default targetAudience to all', () => {
      const result = announcementSchema.safeParse({ title: 'Hello', message: 'This is a long enough message' });
      if (result.success) expect(result.data.targetAudience).toBe('all');
    });
    it('should strictly allow only platform audiences for platformAnnouncementSchema', () => {
       expect(platformAnnouncementSchema.safeParse({ title: 'A valid title', message: 'Message here 123', targetAudience: 'followers' }).success).toBe(false);
       expect(platformAnnouncementSchema.safeParse({ title: 'A valid title', message: 'Message here 123', targetAudience: 'attendee' }).success).toBe(true);
    });
    it('should strictly allow only organizer audiences for organizerAnnouncementSchema', () => {
       expect(organizerAnnouncementSchema.safeParse({ title: 'A valid title', message: 'Message here 123', targetAudience: 'all' }).success).toBe(false);
       expect(organizerAnnouncementSchema.safeParse({ title: 'A valid title', message: 'Message here 123', targetAudience: 'rsvps' }).success).toBe(true);
    });
  });

  describe('roleUpdateSchema', () => {
    it('should allow valid roles', () => {
      expect(roleUpdateSchema.safeParse({ role: 'admin' }).success).toBe(true);
      expect(roleUpdateSchema.safeParse({ role: 'organizer' }).success).toBe(true);
      expect(roleUpdateSchema.safeParse({ role: 'attendee' }).success).toBe(true);
    });
    it('should reject invalid roles', () => {
      expect(roleUpdateSchema.safeParse({ role: 'superadmin' }).success).toBe(false);
    });
  });

});
