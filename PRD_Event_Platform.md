# Product Requirements Document: Event Discovery and Management Platform

## 1. Product Overview

### Short Description

The Event Discovery and Management Platform is a web-based platform that allows visitors to discover events, organizers to publish and manage events, and administrators to moderate content and manage platform users.

### Main Purpose

The platform aims to provide a structured and trustworthy environment for event discovery, RSVP management, organizer communication, and administrative moderation. It supports personalized user experiences through accounts, follows, notifications, and role-based functionality.

### Target Users

- **Attendees / Visitors**: Users who browse events, view event details, follow organizers, receive notifications, and RSVP to events.
- **Organizers**: Users who create events, track RSVP activity, and send announcements to followers or participants.
- **Admins**: Platform managers who approve or reject events, manage users, and send general announcements.

## 2. Goals & Objectives

### Business and Product Goals

- Provide a centralized platform for discovering and managing events.
- Ensure that published events meet platform quality standards through admin approval.
- Improve communication between organizers and interested users through follows, announcements, and notifications.
- Give organizers visibility into event interest through RSVP tracking.
- Allow admins to maintain platform safety and content quality through moderation and user management tools.

### User Goals by Role

#### Attendee / Visitor

- Find relevant events using filters such as category and date.
- View complete event information before deciding whether to participate.
- Follow organizers and receive updates about new approved events.
- RSVP to events and cancel participation when needed.
- Keep track of RSVPed events through an internal list or calendar.

#### Organizer

- Create and submit events through a clear event creation process.
- Have events reviewed and approved before they become publicly visible.
- Monitor RSVP activity for active and past events.
- Send announcements to followers or event participants.

#### Admin

- Review pending events before publication.
- Approve or reject submitted events.
- Send announcements to all registered users or selected user roles.
- Search, filter, view, and update registered user accounts.

## 3. User Roles

### Attendee / Visitor

An Attendee / Visitor can:

- Browse and search public events.
- Filter events by category and date.
- View event detail pages, including as a guest user.
- Create an account as an Attendee.
- Log in and log out.
- Follow or unfollow organizers.
- Receive and view notifications.
- RSVP to events when available.
- Cancel an RSVP.
- View events added to their internal list or calendar after RSVP.

### Organizer

An Organizer can:

- Create an account as an Organizer.
- Log in and log out.
- Submit new events for admin approval.
- Define event information, including optional capacity.
- View active and past events in an RSVP dashboard.
- Filter dashboard events by category or status.
- View RSVP counts for each event.
- Create, edit, and delete announcements.
- Send announcements to followers or participants.

### Admin

An Admin can:

- View all pending events.
- Search pending events by organizer name.
- View full details of proposed events.
- Approve events and make them public.
- Reject events with an optional reason.
- Send platform-wide or role-specific announcements.
- View and update registered Attendee and Organizer accounts.
- Search users by email.
- Filter users by role.


## 4. Functional Requirements

### 4.1 Authentication & Account Management

- The home page must provide visible options for user signup and login.
- During signup, the user must select a role from a dropdown: Attendee or Organizer.
- Signup must require a valid email address and password.
- The password must be validated against basic security criteria, such as a minimum length.
- The system must prevent account creation when the submitted email already exists.
- Login must authenticate users using email and password.
- After successful login, the system must redirect the user to the appropriate page based on their role.
- Failed login attempts must display a clear error message.
- Logged-in users must have access to a logout option.

### 4.2 Event Search & Filtering

- Attendees and visitors must be able to search for public events.
- The platform must provide filters for categories, such as Music and Sports.
- The platform must provide date-based filters.
- Search results must update automatically or after the user applies the selected filters.
- If no events match the selected criteria, the platform must display a clear empty-state message.
- A clear filters button must allow users to remove all selected filters.

### 4.3 Event Details Page

- The event details page must display the following required information:
  - Event title
  - Event description
  - Organizer
  - Location
  - Date and time
  - Price
  - Availability, when attendee capacity is limited
  - Event status
- The event details page must be accessible to unregistered users.
- The page must provide enough information for an attendee to decide whether to RSVP.

### 4.4 RSVP Management

- Each eligible event must include an RSVP button.
- The RSVP button must allow an Attendee to express interest in attending an event.
- The same control or related action must allow an Attendee to cancel their RSVP.
- When an Attendee RSVPs, the event must be automatically added to the user's internal event list or calendar.
- When an Attendee cancels an RSVP, the event must be automatically removed from the user's internal event list or calendar.
- If an event has a capacity limit and the capacity is reached, the RSVP button must be disabled automatically.

### 4.5 Follow & Notifications

- Each organizer profile must include a Follow/Unfollow button.
- Attendees must be able to follow and unfollow organizers.
- When a followed organizer publishes a new approved event, followers must receive a notification.
- Users must have access to a Notifications panel.
- The Notifications panel must show the user's notification history.

### 4.6 Organizer Event Creation

- Organizers must have access to an event creation form.
- The form must include fields for all required event details.
- The system must prevent submission when required fields are missing.
- When submitted, the event must receive the status Pending.
- Pending events must not be publicly visible until approved by an Admin.
- Organizers must be able to define optional capacity for events with limited availability.
- When an event reaches capacity, RSVP must be disabled automatically.

### 4.7 Organizer RSVP Dashboard

- Organizers must have access to an RSVP dashboard.
- The dashboard must display all active and past events owned by the organizer.
- The dashboard must allow filtering by event category.
- The dashboard must allow filtering by event status.
- For each event, the dashboard must display the total number of users who have RSVPed.

### 4.8 Organizer Announcements

- Organizers must be able to write announcement text.
- Organizer announcements must generate notifications automatically.
- Organizer announcement notifications must be sent to followers.
- The platform must provide an announcement management panel.
- The announcement management panel must support editing announcements.
- The announcement management panel must support deleting announcements.

### 4.9 Admin Event Approval

- Admins must be able to view a list of all events with Pending status.
- Admins must be able to search pending events by organizer name.
- Admins must be able to view all details of a proposed event.
- Admins must have a clear Approve action.
- When an event is approved, it must become public.
- Approval must trigger relevant notifications.
- Admins must have a clear Reject action.
- Rejection must support an optional reason field.

### 5.10 Admin Announcements

- Admins must be able to create general announcements.
- Admins must be able to send an announcement to all registered users.
- Admins must be able to send an announcement to a specific role, such as Organizers only.
- Admin announcements must generate notifications for the selected recipients.

### 5.11 Admin User Management

- Admins must have read and write access to the list of all registered accounts.
- The user list must include Attendees and Organizers.
- The user list must include a search bar, such as search by email.
- The user list must include role filters for Attendee and Organizer.
- Admins must be able to update user records within the permissions defined for admin user management.

## 6. Acceptance Criteria

### 6.1 Authentication & Account Management

- Given a user is on the home page, when they view the page, then signup and login options must be available.
- Given a user opens the signup form, when they create an account, then they must select either Attendee or Organizer from a role dropdown.
- Given a user submits the signup form, when the email is invalid, then the system must show a validation error.
- Given a user submits the signup form, when the password does not meet basic security criteria, then the system must show a validation error.
- Given a user submits an email that already exists, when the system checks account data, then it must show a clear duplicate email error.
- Given a registered user enters valid login credentials, when they submit the login form, then they must be logged in and redirected based on their role.
- Given a user enters an incorrect email or password, when they submit the login form, then the system must show a clear error message.
- Given a user is logged in, when they access account controls, then a logout option must be available.

### 6.2 Attendee / Visitor: Event Search & Filtering

- Given an Attendee or visitor is viewing event search, when the filter panel is displayed, then category filters such as Music and Sports must be available.
- Given an Attendee or visitor is viewing event search, when the filter panel is displayed, then date filters must be available.
- Given a user selects a filter, when results are refreshed automatically or by pressing an apply button, then the results must match the selected criteria.
- Given no events match the selected filters, when results are displayed, then the system must show a relevant message.
- Given one or more filters are selected, when the user clicks the clear filters button, then all filters must be removed.

### 6.3 Attendee / Visitor: Event Details

- Given a user opens an event details page, when the page loads, then it must display title, organizer, location, date and time, price, availability if capacity is limited, and event status.
- Given a user is not registered or not logged in, when they open an event details page, then the page must still be accessible.

### 6.4 Attendee / Visitor: Follow & Notifications

- Given a user views an organizer profile, when the page loads, then a Follow or Unfollow button must be available.
- Given a user follows an organizer, when that organizer publishes a new approved event, then the user must receive a notification.
- Given a user opens the Notifications panel, when notifications exist, then the panel must show the user's notification history.

### 6.5 Attendee / Visitor: RSVP and Cancellation

- Given an event is eligible for RSVP, when an Attendee views the event, then an RSVP button must be available.
- Given an Attendee clicks RSVP, when the request is accepted, then the event must be added automatically to the user's internal list or calendar.
- Given an Attendee has already RSVPed, when they cancel the RSVP, then the event must be removed automatically from the user's internal list or calendar.
- Given an event has limited capacity, when the event reaches capacity, then the RSVP button must become disabled automatically.

### 6.6 Organizer: Event Creation

- Given an Organizer is logged in, when they access event creation, then a form must be available with fields for all required event details.
- Given required fields are missing, when the Organizer submits the form, then the system must prevent submission.
- Given the Organizer submits a valid event form, when the event is created, then the event status must be Pending.
- Given an event is Pending, when a public user searches or browses events, then the event must not be visible.
- Given an Organizer defines optional capacity, when the event reaches that capacity, then RSVP must be disabled automatically.

### 6.7 Organizer: RSVP Dashboard

- Given an Organizer opens the dashboard, when the dashboard loads, then it must display all active and past events owned by that Organizer.
- Given the dashboard is displayed, when the Organizer applies a category filter, then the event list must be filtered by category.
- Given the dashboard is displayed, when the Organizer applies a status filter, then the event list must be filtered by event status.
- Given an event appears in the dashboard, when the Organizer views it, then the total number of RSVPed users must be shown.

### 6.8 Organizer: Announcements

- Given an Organizer opens the announcement creation panel, when they enter announcement text, then they must be able to create an announcement.
- Given an Organizer creates an announcement, when the announcement is sent, then notifications must be generated automatically for followers.
- Given an Organizer opens the announcement management panel, when announcements exist, then edit and delete actions must be available.

### 6.9 Admin: Event Approval

- Given an Admin opens the event moderation area, when the page loads, then all Pending events must be listed.
- Given the Pending event list is displayed, when the Admin searches by organizer name, then matching pending events must be shown.
- Given an Admin selects a proposed event, when the details view opens, then all event details must be visible.
- Given an Admin approves an event, when the approval is confirmed, then the event must become public and relevant notifications must be sent.
- Given an Admin rejects an event, when rejection is submitted, then the event must be marked as Rejected.
- Given an Admin rejects an event, when they provide an optional reason, then the reason must be stored with the rejection.

### 6.10 Admin: Announcements & User Management

- Given an Admin creates an announcement, when they select all registered users as recipients, then the announcement must be visible or notified to all registered users.
- Given an Admin creates an announcement, when they select a specific role such as Organizers, then only users in that role must receive the announcement.
- Given an Admin opens user management, when the user list loads, then all registered Attendees and Organizers must be available for read and write management.
- Given the user list is displayed, when the Admin searches by email, then matching users must be shown.
- Given the user list is displayed, when the Admin applies a role filter, then only users with the selected role must be shown.

## 7. Event Statuses

### Pending

The event has been submitted by an Organizer and is waiting for Admin review. Pending events are not publicly visible.

### Approved / Public

The event has been approved by an Admin and is publicly visible on the platform. Approved events may appear in search results and event listings.

### Rejected

The event has been reviewed by an Admin and rejected. A rejection may include an optional reason.

### Upcoming

The event is approved/public and scheduled for a future date or time.

### Completed

The event date and time have passed. Completed events may still appear in organizer dashboards as past events.

### Cancelled

The event has been cancelled and should no longer accept new RSVPs.

## 8. Notification Rules

- When an Admin approves an event, relevant notifications must be generated.
- When an Organizer publishes a newly approved event, users who follow that Organizer must receive a notification.
- When an Organizer sends an announcement, followers must receive notifications.
- If Organizer announcements are targeted to participants, users who RSVPed to the relevant event must receive notifications.
- When an Admin sends a general announcement, all selected recipients must receive notifications.
- When an Admin targets a role-specific announcement, only users in the selected role must receive notifications.
- When a user follows an Organizer, the platform must store the follow relationship so future eligible organizer updates can generate notifications for that user.
- Notifications are assumed to be in-app and visible through the Notifications panel unless another delivery channel is requested later.

## 9. RSVP Rules

### RSVP Button Behavior

- The RSVP button must be available on events that are eligible for RSVP.
- Clicking RSVP must register the Attendee's interest or participation request.
- After successful RSVP, the event must be added to the Attendee's internal event list or calendar.

### Cancel RSVP Behavior

- An Attendee who has RSVPed must be able to cancel their RSVP.
- After cancellation, the event must be removed from the Attendee's internal event list or calendar.

### Capacity Handling

- Event capacity is optional.
- If no capacity is defined, RSVP availability is not limited by attendee count.
- If capacity is defined, the platform must track the number of accepted RSVPs.
- When the number of RSVPs reaches capacity, the RSVP button must be disabled automatically.

### Full Event Behavior

- Users must not be able to RSVP to an event after capacity has been reached.
- The event details page should indicate availability when the number of attendees is limited.

## 10. Admin Moderation Flow

1. The Admin opens the event moderation area.
2. The system displays a list of all events with Pending status.
3. The Admin can search the pending list by organizer name.
4. The Admin selects an event from the list.
5. The system displays all event details submitted by the Organizer.
6. The Admin chooses one of two actions:
   - **Approve**: The event becomes Approved/Public and relevant notifications are generated.
   - **Reject**: The event becomes Rejected, with an optional rejection reason.
7. The event is removed from the Pending review list after approval or rejection.

## 11. Non-Functional Requirements

### Security

- Passwords must be handled securely and never stored in plain text.
- Authentication must protect role-specific areas such as Organizer dashboards and Admin tools.
- Users must not be able to access actions outside their role permissions.
- Error messages must be clear but must not expose sensitive system details.

### Usability

- Signup, login, event search, RSVP, and event creation flows must be understandable for first-time users.
- Required fields and validation errors must be clearly indicated.
- Empty states must explain when no search results, notifications, or dashboard items are available.
- Role-specific navigation must make each user's available actions easy to find.

### Performance

- Event search and filtering should return results quickly enough to support interactive browsing.
- Dashboards and lists should support efficient loading for active and past events.
- Notifications and RSVP count updates should be reflected consistently after user actions.

### Accessibility

- Core user flows should be usable with keyboard navigation.
- Forms, buttons, and filters should have clear labels.
- Error messages should be readable and associated with the relevant fields.
- Text and controls should maintain sufficient contrast and legibility.

### Data Validation

- Required event creation fields must be validated before submission.
- Email addresses must be validated during signup and login.
- Passwords must be checked against basic security requirements.
- Capacity values, when provided, must be valid numeric values.
- Role selection during signup must be required.

### Reliability

- RSVP state, event status, follow relationships, and notifications must remain consistent after user actions.
- Admin approval and rejection actions must reliably update event visibility.
- Announcement delivery should create notifications for the intended recipient group.
- The platform should prevent duplicate account creation by email.

## 12. Out of Scope

The following features are not explicitly required and are outside the current scope:

- Online payment processing.
- Ticket purchase workflows.
- Refund processing or cancellation refund handling.
- Ticket QR code generation or QR scanning.
- Chat or direct messaging between users.
- External calendar integrations, such as Google Calendar or Outlook Calendar.
- Email, SMS, or push notification delivery unless requested later.
- Advanced recommendation algorithms.
- Seating selection or venue map management.

## 13. Open Questions / Assumptions

### Assumptions

- RSVP is treated as a participation request or booking intent, not as a paid ticket transaction.
- Events may be free or paid, but payment handling is outside the MVP scope.
- Guest users can view event details but cannot RSVP or follow organizers.
- Notifications are in-app only unless email, SMS, or push delivery is requested later.
- Automatic add/remove behavior refers to an internal platform list or calendar, not an external calendar integration.
- Event cancellation is represented by a Cancelled status, but the detailed cancellation workflow is not specified.

### Open Questions

- Are events always free, or can organizers publish paid events?
- Is RSVP equivalent to a confirmed booking, or only a declaration of interest?
- If paid events are introduced later, will cancellation refunds be handled inside the platform?
- Should guest users be allowed to RSVP, or must RSVP require login?
- Should notifications remain in-app only, or should email and push notifications be added later?
- Should Organizer announcements be sent only to followers, only to participants, or allow both recipient groups?
- What admin write actions are allowed in user management, such as edit profile fields, deactivate account, or change role?

## 14. Suggested MVP Scope

### Must-Have for MVP

- Signup, login, role selection, role-based redirect, and logout.
- Event search with category and date filters.
- Public event details page.
- Attendee RSVP and RSVP cancellation.
- Internal attendee event list or calendar update after RSVP changes.
- Follow/unfollow organizers.
- In-app notifications panel.
- Organizer event creation with Pending status.
- Admin event approval and rejection.
- Organizer RSVP dashboard with RSVP counts.
- Admin user list with search and role filters.

### Should-Have

- Organizer announcements to followers.
- Organizer announcement management with edit/delete.
- Admin general announcements to all users or selected roles.
- Event capacity handling with automatic RSVP disabling.
- Dashboard filtering by category and event status.
- Optional rejection reason when Admin rejects an event.

### Could-Have Later

- Email or push notifications.
- Paid events and payment processing.
- Refund management.
- QR ticket scanning.
- External calendar integrations.
- Chat or direct messaging.
- Advanced event recommendations.
- More detailed admin moderation history and audit logs.

## 15. Optional Data Entities

### User

Suggested fields:

- `id`
- `email`
- `passwordHash`
- `role` with values Attendee, Organizer, Admin
- `name`
- `createdAt`
- `updatedAt`

### Event

Suggested fields:

- `id`
- `title`
- `description`
- `organizerId`
- `location`
- `dateTime`
- `price`
- `category`
- `status`
- `capacity`
- `createdAt`
- `updatedAt`

### RSVP

Suggested fields:

- `id`
- `eventId`
- `userId`
- `status`
- `createdAt`
- `cancelledAt`

### Follow

Suggested fields:

- `id`
- `attendeeId`
- `organizerId`
- `createdAt`

### Notification

Suggested fields:

- `id`
- `recipientUserId`
- `type`
- `title`
- `message`
- `relatedEventId`
- `relatedOrganizerId`
- `readAt`
- `createdAt`

### Announcement

Suggested fields:

- `id`
- `authorUserId`
- `authorRole`
- `message`
- `targetAudience`
- `relatedEventId`
- `createdAt`
- `updatedAt`

### AdminApproval

Suggested fields:

- `id`
- `eventId`
- `adminId`
- `decision` with values Approved or Rejected
- `reason`
- `createdAt`

