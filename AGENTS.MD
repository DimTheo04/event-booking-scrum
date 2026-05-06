# AI Agent Master Guidelines: Event Booking Application

## 1. Project Overview
This is a project for an Event Booking web application. It features a three-tier user system:
- **Attendees (Επισκέπτες):** Can search events, follow organizers, and RSVP.
- **Organizers (Διοργανωτές):** Can create events, manage RSVPs, and send announcements.
- **Admins (Διαχειριστές):** Can approve/reject events, manage users, and send global announcements.

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
- **Event Visibility:** Public users and Attendees can ONLY fetch events where `status == 'approved'`.
- **RSVP Logic:** Before writing an RSVP to the sub-collection, the app must check if `rsvpCount < capacity` (if capacity exists).
- **Admin Actions:** Admin status is verified by checking the user's document in the `users` collection.