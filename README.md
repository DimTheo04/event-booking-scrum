# GoOutJs: Premium Event Booking & Management Platform

Welcome to **GoOutJs**, a premium, high-performance, three-tier Event Booking and Management application built with Next.js (App Router), Tailwind CSS v4, shadcn/ui, and Firebase. 

[![CI Pipeline](https://github.com/DimTheo04/event-booking-scrum/actions/workflows/ci.yml/badge.svg)](https://github.com/DimTheo04/event-booking-scrum/actions/workflows/ci.yml)


## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema (Firestore)](#database-schema-firestore)
4. [CI/CD & DevOps Strategy](#cicd--devops-strategy)
5. [Local Installation & Setup](#local-installation--setup)
6. [Environment Variables Config](#environment-variables-config)
7. [Creating Your First Admin User](#creating-your-first-admin-user)
8. [Security & Flow Constraints](#security--flow-constraints)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Operational Commands](#operational-commands)


## Tech Stack

*   **Frontend Framework**: [Next.js 16 (App Router)](https://nextjs.org/) for highly performant hybrid rendering and file-based routing.
*   **Styling Engine**: [Tailwind CSS v4](https://tailwindcss.com/) with native inline theme overrides.
*   **UI Components**: [shadcn/ui](https://ui.shadcn.com/) copy-paste primitives integrated with [Lucide React](https://lucide.dev/) for crisp, responsive iconography.
*   **State & Validation**: [React Hook Form](https://react-hook-form.com/) tightly coupled with [Zod](https://zod.dev/) for client-side forms and rigorous server-side boundary validation.
*   **Database & Auth**: [Firebase v12 Client SDK](https://firebase.google.com/docs/web/setup) for authentication, state tracking, and Firestore real-time snapshots.
*   **Server-Side SDK**: [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) for secure administrative tasks (e.g., user deletion API).


## Project Structure

```
code/
├── app/                      # Next.js App Router root
│   ├── (auth)/               # Authentication route grouping (login, register)
│   ├── api/                  # API endpoints (e.g., Admin user deletion via Server SDK)
│   ├── dashboard/            # Three-tier dashboard layout and views
│   │   ├── (admin)/          # Admin-only panels (Moderation, Users, Announcements)
│   │   ├── (organizer)/      # Organizer-only panels (Create Event, Events Tracker)
│   │   ├── announcements/    # Organizer announcement panel
│   │   └── notifications/    # Notifications center
│   ├── events/               # Public discovery page
│   ├── globals.css           # Tailwind v4 directives & custom theme variables
│   ├── layout.tsx            # Global layout wrapper
│   └── page.tsx              # Home landing hero page
├── components/               # Shared & feature-based components
│   ├── admin/                # Admin sub-components (User Table, Moderation Queue)
│   ├── dashboard/            # Dashboard widgets
│   ├── events/               # Core event discovery, details modal, and creation forms
│   ├── layout/               # Header, Sidebar, Responsive Navigation, Footer
│   ├── ui/                   # shadcn/ui components (Dialog, Buttons, Inputs, Tables)
│   └── visuals/              # Ambient UI visuals (MouseGlow, CanvasBackground)
├── hooks/                    # Custom React hooks (e.g., useNotifications)
├── lib/                      # Base configurations & service layer
│   ├── services/             # Firebase Cloud Firestore interaction logic
│   │   ├── admin.ts          # Admin moderation & user functions
│   │   ├── announcements.ts  # Audience announcement publishing
│   │   ├── events.ts         # RSVP checking, capacity logic, event status updates
│   │   ├── follows.ts        # Organizer follow registry
│   │   └── notifications.ts  # In-app notification creation & removal
│   ├── firebase.ts           # Client-side Firebase singleton
│   ├── firebase-admin.ts     # Server-side Admin SDK initializer
│   ├── schemas.ts            # Centralized Zod Validation Schemas
│   └── utils.ts              # Styling layout helpers
├── package.json              # App configuration, scripts, and dependencies
└── tsconfig.json             # TypeScript configuration
```


## Database Schema (Firestore)

**GoOutJs** utilizes a flat NoSQL database structure designed for fast queries and simple joins. Sub-collections are kept shallow for optimization.

### 1. `users` (Collection)
*   *Document ID*: Firebase Auth User UID (`uid`)
*   *Fields*:
    *   `email` (string): User email address.
    *   `displayName` (string): Full name of the user.
    *   `role` (string): `"attendee"` | `"organizer"` | `"admin"`.
    *   `createdAt` (timestamp): Registration time.

### 2. `events` (Collection)
*   *Document ID*: Unique event auto-generated token
*   *Fields*:
    *   `organizerId` (string): Organizer `uid`.
    *   `title` (string): Title of the event.
    *   `description` (string): Detailed outline of the event.
    *   `location` (string): Physical address or online link.
    *   `category` (string): e.g., "music", "tech", "food", "sports".
    *   `dateTime` (string): ISO string format of event schedule.
    *   `price` (number): Admission price.
    *   `capacity` (number, optional): Maximum capacity.
    *   `rsvpCount` (number): Active RSVPs.
    *   `status` (string): `"pending"` | `"approved"` | `"rejected"` | `"completed"` | `"cancelled"`.

#### Sub-collection: `rsvps` (Inside an Event Document)
*   *Document ID*: Attendee `userId`
*   *Fields*:
    *   `timestamp` (timestamp): Time when the attendee booked their ticket.

### 3. `follows` (Collection)
*   *Document ID*: `{attendeeId}_{organizerId}`
*   *Fields*:
    *   `attendeeId` (string): Attendee `userId`.
    *   `organizerId` (string): Organizer `userId`.

### 4. `announcements` (Collection)
*   *Document ID*: Auto-generated
*   *Fields*:
    *   `authorId` (string): Admin or Organizer `uid`.
    *   `title` (string): Short overview heading.
    *   `message` (string): Content text body.
    *   `targetAudience` (string): `"all"` | `"organizer"` | `"attendee"` | `"followers"` | `"rsvps"` | `"followers_and_rsvps"`.
    *   `createdAt` (timestamp): Time of publishing.

### 5. `notifications` (Collection)
*   *Document ID*: Auto-generated
*   *Fields*:
    *   `userId` (string): Target user `uid` receiving the notification.
    *   `type` (string): `"rsvp"` | `"rsvp_cancel"` | `"event_cancel"` | `"announcement"`.
    *   `message` (string): Display text context.
    *   `read` (boolean): `true` if read, else `false`.
    *   `createdAt` (timestamp): Timestamp generated.


## CI/CD & DevOps Strategy

### 1. Release Management (Git Flow)
This project follows a strict **Git Flow** methodology for release management.
*   **`main` branch**: The production-ready code.
*   **`develop` branch**: The active integration branch for features.
All new features are developed in feature branches, pushed to `develop`, and eventually merged into `main` for release.

### 2. Code Quality & Git Hooks (Husky)
To enforce code standards locally, we utilize **Husky** and **lint-staged**.
*   **Pre-commit Hook**: Runs ESLint and a strict TypeScript type-check (`tsc --noEmit`) on staged files to ensure no syntax or type errors can be committed.
*   **Pre-push Hook**: Automatically executes the entire Jest Unit Test suite before code leaves your local machine.

### 3. Automated Testing (Jest)
We employ **Jest** coupled with React Testing Library for our automated testing strategy.
*   **Critical Paths Tested**: The test suite covers core business logic, including complex Zod validation schemas, RSVP transaction constraints, admin event moderation, follow relationships, announcement filtering, notification targeting, hooks, and UI primitives.
*   The test suite acts as an automated gatekeeper during both the pre-push local hook and the cloud CI pipeline.

### 4. CI/CD Pipeline (GitHub Actions)
Our cloud pipeline ensures a unified source of truth for build success. The pipeline triggers on every push and pull request to `develop` and `main`.
*   **Stages**: Checkout -> Secret Scan -> Setup Node.js -> Install Dependencies -> Type Check -> Lint -> Run Tests -> Build.
*   Commits failing any of these quality gates are automatically rejected.

### 5. Continuous Deployment (Vercel)
The application relies on **Vercel** for automatic, serverless Continuous Deployment.
1. Connect your GitHub repository to a Vercel project.
2. Vercel automatically creates a production deployment every time code is merged into the `main` branch.
3. Vercel automatically manages HTTPS, CDN caching, and edge routing.
*Note: We do not require a separate Docker Image because Vercel natively handles the Next.js build output and deployment architecture.*

### 6. Secrets Management
*   **Local Development**: API keys are securely stored in `.env.local` which is strictly ignored by Git (`.gitignore`).
*   **Cloud Deployment**: Sensitive keys (like the Firebase Admin Private Key) are securely injected directly into Vercel's Environment Variables dashboard, meaning they are never exposed in the source code or build artifacts.
*   **Automated Secret Scanning**: GitHub Actions runs Gitleaks on push and pull request builds using `.gitleaks.toml`. The pre-commit hook also runs Gitleaks against staged changes when the CLI is installed locally.


## Local Installation & Setup

Follow these detailed steps to get a local copy of **GoOutJs** running:

### 1. Prerequisites
Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (Version **20.x** or higher recommended)
*   An active **Firebase Account**

### 2. Extract / Clone the Codebase
Extract the project zip folder, or clone using git:
```bash
git clone <repository_url>
cd event-booking-scrum/code
```

### 3. Install Dependencies
Run the package installation:
```bash
npm install
```

### 4. Setup Firebase Project Console
1.  Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**. Name it `GoOutJs`.
2.  Enable **Authentication**:
    *   Navigate to **Build > Authentication**.
    *   Click **Get Started** and enable the **Email/Password** provider.
3.  Create a **Cloud Firestore Database**:
    *   Navigate to **Build > Firestore Database**.
    *   Click **Create Database** and select your region.
    *   Set security rules in **Rules** tab (or use development rules to start, but replace them as shown in the security section below).
4.  Get your **Web App Config Credentials**:
    *   Click the gear icon (Settings) next to *Project Overview* -> **Project settings**.
    *   Under *Your apps*, click the **Web icon (`</>`)** to register a new Web App.
    *   Name it `GoOutJs Client`, and copy the config parameters for step 7.
5.  Generate your **Admin SDK Service Account Credentials**:
    *   In the **Project settings**, navigate to the **Service accounts** tab.
    *   Click **Generate new private key**, then download the `.json` file containing your credentials. Keep this file secure and *never* check it into git.

### 5. Deploy Firestore Security Rules

To enforce validation, roles, and safety constraints across your database collections, you must configure the Firestore Security Rules. Choose one of the following methods:

#### Method A: Console Copy-Paste (Fastest)
1. Go to your **Firebase Console > Build > Firestore Database**.
2. Click on the **Rules** tab.
3. Delete any default placeholder rules and paste the following configuration:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function: Checks if the logged-in user's role is 'admin'
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Helper function: Checks if the logged-in user's role is 'organizer'
    function isOrganizer() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'organizer';
    }

    // USERS COLLECTION
    match /users/{userId} {
      // Anyone authenticated can read profiles.
      // Public unauthenticated users can only read organizer/admin profiles.
      allow get: if
        request.auth != null ||
        resource.data.role == 'organizer' ||
        resource.data.role == 'admin';

      // Only authenticated users can list users
      allow list: if request.auth != null;

      // Allow users to create their initial profile
      allow create: if request.auth != null &&
                    request.auth.uid == userId;

      // Users can update their own profile but cannot change their own role.
      // Admins can update any profile.
      allow update: if request.auth != null && (
        isAdmin() ||
        (
          request.auth.uid == userId &&
          request.resource.data.role == resource.data.role
        )
      );

      // Only admins can delete users
      allow delete: if isAdmin();
    }

    // EVENTS COLLECTION
    match /events/{eventId} {
      // Anyone can read approved events.
      // Organizers can read their own events.
      // Admins can read all events.
      allow read: if resource.data.status == 'approved'
                  || (
                    request.auth != null &&
                    resource.data.organizerId == request.auth.uid
                  )
                  || isAdmin();

      // Only organizers can create events, and they must set themselves as organizer.
      allow create: if isOrganizer()
                    && request.resource.data.organizerId == request.auth.uid;

      // Admins can update anything.
      // Organizers can update their own events.
      // Authenticated users can update only rsvpCount by +1 or -1 on approved events.
      allow update: if isAdmin()
        || (
          request.auth != null &&
          resource.data.organizerId == request.auth.uid
        )
        || (
          request.auth != null &&
          resource.data.status == 'approved' &&
          request.resource.data.diff(resource.data).changedKeys().hasOnly(['rsvpCount']) &&
          (
            request.resource.data.rsvpCount == resource.data.rsvpCount + 1 ||
            request.resource.data.rsvpCount == resource.data.rsvpCount - 1
          ) &&
          request.resource.data.rsvpCount >= 0
        );

      // Only admins can delete events
      allow delete: if isAdmin();

      // RSVPS SUB-COLLECTION
      match /rsvps/{rsvpId} {
        // Authenticated users can read RSVPs
        allow read: if request.auth != null;

        // Users can RSVP only for themselves, and only to approved events
        allow create: if request.auth != null
          && request.auth.uid == rsvpId
          && request.resource.data.userId == request.auth.uid
          && get(/databases/$(database)/documents/events/$(eventId)).data.status == 'approved';

        // Users can update only their own RSVP and cannot change userId
        allow update: if request.auth != null
          && request.auth.uid == rsvpId
          && resource.data.userId == request.auth.uid
          && request.resource.data.userId == resource.data.userId;

        // Users can delete only their own RSVP
        allow delete: if request.auth != null
          && request.auth.uid == rsvpId
          && resource.data.userId == resource.data.userId;
      }
    }

    // FOLLOWS COLLECTION
    match /follows/{followId} {
      // Authenticated users can read follows.
      // This is needed so attendees can find followed organizers.
      allow read: if request.auth != null;

      // Users can only create a follow if they are the follower.
      allow create: if request.auth != null
                    && request.resource.data.followerId == request.auth.uid;

      // Users can only delete a follow if they created it.
      allow delete: if request.auth != null
                    && resource.data.followerId == request.auth.uid;

      // Follows do not need updates
      allow update: if false;
    }

    // ANNOUNCEMENTS COLLECTION
    match /announcements/{docId} {
      // Authenticated users can read announcements.
      // This allows attendees to read organizer announcements.
      // Visibility logic such as followers/rsvps is handled in frontend filtering.
      allow read: if request.auth != null;

      // Organizers and admins can create announcements.
      // They must set themselves as the author.
      allow create: if (isOrganizer() || isAdmin())
                    && request.resource.data.authorId == request.auth.uid;

      // Admins can update/delete any announcement.
      // Authors can update/delete their own announcements.
      allow update, delete: if isAdmin()
                            || (
                              request.auth != null &&
                              resource.data.authorId == request.auth.uid
                            );
    }

    // NOTIFICATIONS COLLECTION
    match /notifications/{docId} {
      // Users can only read their own notifications
      allow read: if request.auth != null
                  && resource.data.recipientId == request.auth.uid;

      // Any authenticated user can create notifications.
      // Example: attendee notifies organizer, organizer notifies admin.
      allow create: if request.auth != null;

      // Users can update/delete only their own notifications
      allow update, delete: if request.auth != null
                            && resource.data.recipientId == request.auth.uid;
    }
  }
}
```

4. Click **Publish**.

#### Method B: Local File & CLI Deploy (Recommended Best Practice)
1. In the root of your `/code` directory, create a file named `firestore.rules` and paste the exact rules block shown in Method A inside it.
2. In the same root directory, ensure you have a `firebase.json` containing:
```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```
3. Install the Firebase CLI tools globally:
   ```bash
   npm install -g firebase-tools
   ```
4. Log into your Firebase account and select your project:
   ```bash
   firebase login
   firebase use <your-firebase-project-id>
   ```
5. Deploy the rules dynamically from your terminal:
   ```bash
   firebase deploy --only firestore:rules
   ```


## Environment Variables Config

Create a `.env.local` file in the root of the `/code` directory. Fill it with the parameters gathered from step 4:

```env
# ==========================================
# 1. CLIENT-SIDE SDK KEYS (Publicly Exposed)
# ==========================================
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyA..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="gooutjs-xxxx.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="gooutjs-xxxx"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="gooutjs-xxxx.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="39401..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:39401..."

# ==========================================
# 2. SERVER-SIDE ADMIN KEYS (Secret Keys)
# ==========================================
FIREBASE_PROJECT_ID="gooutjs-xxxx"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@gooutjs-xxxx.iam.gserviceaccount.com"
# Note: Ensure the private key has escaped newlines (\n) inside double quotes as shown below
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC8...\n-----END PRIVATE KEY-----\n"
```

> [!WARNING]  
> The `FIREBASE_PRIVATE_KEY` contains literal newlines. When pasting it inside your `.env.local`, wrap it in double quotes and ensure the raw newlines are represented as `\n` to prevent parsing failures in `lib/firebase-admin.ts`.


## Creating Your First Admin User

To moderate events and manage roles, at least one user must hold the `admin` role. Since registration defaults to `attendee` or `organizer`, follow this workflow to seed your first admin:

1.  Start the local server (`npm run dev`).
2.  Open [http://localhost:3000/register](http://localhost:3000/register) and register a new user.
3.  Go to your **Firebase Console > Firestore Database**.
4.  Locate the `users` collection.
5.  Find the document corresponding to your registered user's email.
6.  Double-click the `role` field value, change it from `"attendee"` (or `"organizer"`) to `"admin"`, and click save.
7.  Refresh the web application. You will now be redirected to the Admin Dashboard upon signing in!


## Security & Flow Constraints

*   **Public Event Scoping**: Unauthenticated visitors and attendees can only query events where `status == 'approved'`. Other event states (pending, rejected, cancelled) are automatically filtered out.
*   **RSVP Safety Constraints**: A user can only place an RSVP if:
    *   They are authenticated.
    *   The event state is `'approved'` (completed or cancelled events are closed for RSVPs).
    *   The current `rsvpCount` is strictly less than `capacity` (if a limit is specified).
*   **Validation Rules**: All form inputs (Register, Login, Event Creation, Announcements) pass through Zod parsing libraries *before* communication with Firebase Firestore occurs, guaranteeing data integrity.


## Troubleshooting Guide

### 1. Missing Firebase Admin Environment Variables
If your Next.js application throws a runtime server error stating `Missing Firebase Admin environment variables`:
*   Check if you named the environment variables *exactly* as shown in the [Environment Variables](#environment-variables-config) list.
*   Ensure that you are restarting the Next.js process (`npm run dev`) after making changes to your `.env.local` file.

### 2. Admin API Failures
If you are unable to delete users from the admin panel:
*   Make sure that you copied your service account credentials correctly.
*   Ensure that the user being deleted has a valid UID in Firebase Authentication and a matching Firestore user document.

### 3. Firestore Rules & Indexes
If event searching and date-range queries return empty arrays:
*   Open your browser console to check for Firebase warnings. A complex query using multiple range filters (e.g., search term + date sorting) sometimes requires an index.
*   Click the link generated in the console warning to automatically create the composite Firestore indexes required.


## Operational Commands

To interact with the local development platform, run the following npm commands:

*   **Run Development Server**:
    ```bash
    npm run dev
    ```
*   **Build Production Application Bundle**:
    ```bash
    npm run build
    ```
*   **Start Production Application Bundle**:
    ```bash
    npm run start
    ```
*   **Code Linting**:
    ```bash
    npm run lint
    ```
