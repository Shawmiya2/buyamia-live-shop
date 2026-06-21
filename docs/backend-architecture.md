# Backend Architecture

## Stack

- Next.js 16 App Router route handlers.
- Prisma ORM with local SQLite for development.
- HttpOnly opaque session cookie with hashed session tokens in the database.
- Zod validation for mutation payloads.
- Vitest backend tests against the local persistent database.

## Source Of Truth

The backend source of truth is Prisma models in `prisma/schema.prisma`. Static
mock objects, JSON files, in-memory arrays, and browser localStorage are not used
for authentication or backend persistence.

## Core Services

- `lib/backend/auth-service.ts`: signup, login, password hashing, sessions, safe user DTOs.
- `lib/backend/auth-context.ts`: current user, required auth, role checks, ownership helpers.
- `lib/backend/dashboard-service.ts`: per-role dashboard aggregation.
- `lib/backend/live-request-service.ts`: provider live request workflow and admin review/schedule.
- `lib/backend/live-service.ts`: lives, pinning, replay extension, replay status.
- `lib/backend/verification-service.ts`: metadata-only verification workflow.
- `lib/backend/subscription-service.ts`: viewer follows and feeds.
- `lib/backend/analytics-service.ts`: analytics derived from stored records/events.
- `lib/backend/admin-activity-service.ts`: admin operation audit trail.

## Authorization

All protected API routes call `requireAuthenticatedUser`, `requireRole`, or
`requireDashboardAccess`. Providers are scoped to their own `ProviderProfile.id`;
`main_admin` can access admin operations and every dashboard.

## API Shape

Success:

```json
{ "success": true, "data": {} }
```

Failure:

```json
{ "success": false, "error": { "code": "forbidden", "message": "..." } }
```

## Data Model Summary

- `User`: credentials, role, verification, onboarding.
- `ProviderProfile`: provider account data owned by a user.
- `Session`: hashed opaque session tokens.
- `VerificationRequest`: metadata-only verification submissions.
- `LiveRequest`: provider request workflow.
- `Live`: scheduled/active/completed lives, replay expiration, pin state.
- `Follow`: unique viewer/provider follows.
- `AnalyticsEvent`: stored events for analytics.
- `AdminActivity`: audit log for admin mutations.

## Placeholder Boundaries

No fake payment processing, identity-document storage, cloud object storage, or
livestream infrastructure is implemented. The local backend records workflow
state and metadata only; real providers should be added behind service adapters.
