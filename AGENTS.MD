# AI Agent Master Guidelines: Event Booking Application

## 1. Project Overview
This is a project for an Event Booking web application. It features a three-tier user system:

Main roles:
- **Attendee / Visitor**: browse public events, view event details, RSVP, cancel RSVP, follow organizers, and view in-app notifications.
- **Organizer**: create events, view RSVP dashboard data, and manage announcements.
- **Admin**: approve or reject events, manage users, and send global platform announcements.

Core flows:
- Signup and login
- Event creation by organizers
- Admin approval before publication
- Public event browsing and filtering
- RSVP and RSVP cancellation
- Follow organizers and receive notifications
- Organizer dashboard
- Admin moderation and user management.

## 2. Tech Stack & Tools
- **Framework:** Next.js (App Router strictly - `app/` directory).
- **Styling:** Tailwind CSS.
- **UI Components:** shadcn/ui (use standard copy-paste components) + Lucide React for icons.
- **Forms & Validation:** React Hook Form tightly coupled with Zod.
- **Backend/Auth:** Firebase (Authentication + Cloud Firestore).

## 3. Architecture & Coding Rules
- **Clean and Scalable Architecture:** Always write code that is clean, organized, and scalable. Avoid nested callbacks, deeply nested code, or complex logic.
- **Server vs Client:** Default to React Server Components (RSC). ONLY use the `'use client';` directive when absolute necessary (e.g., forms, event listeners, hooks like `useState` or `useEffect`).
- **Data Validation:** ALL user input must be validated via Zod schemas BEFORE being sent to Firebase. Do not rely on Firebase Security Rules for structural data validation.
- **Firebase Initialization:** Always ensure Firebase is initialized purely on the client-side using a singleton pattern in a `lib/firebase.ts` file, using environment variables.
- **Environment Variables:** Always use `.env.local` for local development. Never hardcode API keys.

## 4. Database Schema (Firestore)
The database is NoSQL. Agents must respect this structure:

- **`users` collection:** 
  - Fields: `email`, `role` ("attendee" | "organizer" | "admin"), `displayName`, `createdAt`.
  - *Note:* Roles are managed explicitly via the `role` field in this document, NOT via Firebase Custom Claims.

- **`events` collection:**
  - Fields: `organizerId`, `title`, `location`, `category`, `dateTime`, `price`, `capacity` (optional), `rsvpCount`, `status` ("pending" | "approved" | "rejected" | "completed" | "cancelled").
  - *Sub-collection `rsvps`:* Document ID is the `userId`. Field: `timestamp`.

- **`follows` collection:** 
  - Document ID: `{attendeeId}_{organizerId}`. Fields: `attendeeId`, `organizerId`.

- **`announcements` collection:**
  - Fields: `authorId`, `message`, `audience`, `createdAt`.

- **`notifications` collection:**
  - Fields: `userId`, `type`, `message`, `read`, `createdAt`.

## 5. Security & Flow Constraints
- **Event Visibility:** Public users and Attendees can ONLY fetch events where `status == 'approved'`. New events posted by organizers start with a `pending` status.
- **RSVP Logic:** Only logged in users can make RSVP. Before writing an RSVP to the sub-collection, the app must check if `rsvpCount < capacity` (if capacity exists). Also completed or cancelled events can't accept new RSVP
- **Admin Actions:** Admin status is verified by checking the user's document in the `users` collection.
- **Notifications:** Notifications are only in-app.