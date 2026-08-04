# Deletion Lifecycle

This document explains how automatic cleanup and hard deletion work in `EventQR`.

## Goals

- save server resources by removing unused organization-scoped data
- preserve user accounts even when an organization is deleted
- warn before destructive cleanup
- keep the logic predictable and auditable

## Scope

The deletion lifecycle applies to **organizations** and all data owned by an organization.

It does **not** delete:

- global user accounts
- user credentials
- user profile/account data
- memberships in other organizations

## Lifecycle states

Organizations move through these states:

1. `ACTIVE`
2. `INACTIVE`
3. hard deleted

There is no recycle-bin restore after hard deletion. Once purge happens, the organization-scoped data is removed permanently.

## Activity tracking

Each organization has these lifecycle fields:

- `status`
- `lastActivityAt`
- `inactiveSinceAt`
- `scheduledDeletionAt`

The system updates `lastActivityAt` and restores `ACTIVE` status when meaningful activity happens.

## What counts as activity

The backend currently treats these actions as organization activity:

- user login into an organization
- `GET /api/auth/me` when an active organization exists
- switching active organization
- creating an organization invite
- accepting an organization invite
- updating organization settings
- regenerating join code
- updating member roles
- removing members
- creating an attendee
- updating an attendee
- deleting an attendee
- creating an event series
- creating an event session
- attendance check-in
- generating a public scanner share link

When any of those actions happen, the organization:

- gets `lastActivityAt = now`
- is set back to `ACTIVE`
- clears `inactiveSinceAt`
- clears `scheduledDeletionAt`

## Timing

Cleanup timing is controlled by backend environment variables:

- `ORGANIZATION_INACTIVE_WARNING_DAYS`
- `ORGANIZATION_HARD_DELETE_DAYS`
- `ORGANIZATION_CLEANUP_INTERVAL_MINUTES`

Default values:

- warning threshold: `75` days
- hard delete threshold: `90` days
- cleanup job interval: `60` minutes

## Inactive warning behavior

When `lastActivityAt` is older than `ORGANIZATION_INACTIVE_WARNING_DAYS`, the cleanup job marks the organization as:

- `status = INACTIVE`
- `inactiveSinceAt = now`
- `scheduledDeletionAt = lastActivityAt + ORGANIZATION_HARD_DELETE_DAYS`

This means the delete deadline is based on the **last real organization activity**, not on when the cleanup job happened to run.

## Hard deletion behavior

When the cleanup job sees that an organization has passed its hard-delete threshold, it permanently deletes all organization-scoped data.

Deletion is organization-wide.

### Purged data

The purge removes:

- attendance records for sessions in that organization
- event sessions
- event series
- attendees
- attendee profile image files
- organization invites
- organization memberships for that organization
- the organization row itself

### Preserved data

The purge keeps:

- `users`
- passwords / auth credentials
- user account settings
- memberships in other organizations

## Invite cleanup

Expired invites are also cleaned up automatically by the same cleanup routine.

That cleanup is immediate once the invite is expired.

## Uploaded file cleanup

Before attendees are deleted during organization purge, the system removes their stored local profile image files from `backend/uploads`.

This keeps the filesystem aligned with database deletion.

## Job execution

The cleanup routine runs:

1. once on backend startup
2. repeatedly on an interval using `ORGANIZATION_CLEANUP_INTERVAL_MINUTES`

Implementation entry point:

- [backend/src/server.ts](</D:/mattc/Documents/Projects/EventQrAttendance/backend/src/server.ts:1>)

Cleanup logic:

- [backend/src/modules/organizations/organizations.cleanup.ts](</D:/mattc/Documents/Projects/EventQrAttendance/backend/src/modules/organizations/organizations.cleanup.ts:1>)

Activity touch logic:

- [backend/src/modules/organizations/organizations.activity.ts](</D:/mattc/Documents/Projects/EventQrAttendance/backend/src/modules/organizations/organizations.activity.ts:1>)

## Current product behavior

The organization settings page exposes lifecycle information so admins can see:

- last activity time
- warning threshold
- hard delete threshold
- scheduled deletion date when inactive

UI reference:

- [frontend/src/pages/organization-settings-page.tsx](</D:/mattc/Documents/Projects/EventQrAttendance/frontend/src/pages/organization-settings-page.tsx:1>)

## Operational notes

- this is an automatic hard-delete policy
- there is no soft-deleted organization restore path after purge
- if you want notifications, email warnings should be added before relying on this in production
- if you want stricter safety, require owner confirmation before allowing final purge

## Recommended future improvements

1. send warning emails to owners/admins when an organization becomes `INACTIVE`
2. add an explicit “keep organization active” action in the UI
3. log purge events to an audit table before deletion
4. add a dry-run admin report that shows upcoming purge candidates
