# Backend Architecture

## Stack

- Next.js 16 App Router route handlers.
- Prisma ORM with local SQLite for development.
- HttpOnly opaque session cookie with hashed session tokens in the database.
- Zod validation for mutation payloads.
- Vitest backend tests for service/API behavior.
- Playwright e2e tests with an isolated SQLite `test.db`.

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

## Route Inventory

Public/pages:

- `/`
- `/live`
- `/live/[id]`
- `/signup`
- `/login`
- `/dashboard/main`
- `/dashboard/hotel`
- `/dashboard/restaurant`
- `/dashboard/supplier`
- `/dashboard/services`
- `/dashboard/viewer`
- `/hotel-dashboard`
- `/restaurant-dashboard`
- `/supplier-dashboard`
- `/services-dashboard`
- `/traveler-dashboard`
- `/viewer-dashboard`
- `/ai-procurement-dashboard`

API:

- `/api/health`
- `/api/auth/signup`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/account/create`
- `/api/dashboard/[type]`
- `/api/analytics/[dashboardType]`
- `/api/live-requests`
- `/api/live-requests/[id]`
- `/api/admin/live-requests/[id]/review`
- `/api/admin/live-requests/[id]/schedule`
- `/api/lives`
- `/api/lives/[id]/pin`
- `/api/lives/[id]/replay-expiration`
- `/api/follows`
- `/api/follows/[providerId]`
- `/api/subscriptions/follow`
- `/api/subscriptions/viewer`
- `/api/verification/status`
- `/api/verification/submit`
- `/api/verification/[userId]`
- `/api/services/live-requests`

## Test Database

`npm run test:e2e` creates `test.db`, runs Prisma migrations, seeds deterministic local accounts, starts Next on `127.0.0.1:3106`, and tears the server down after tests. It does not delete or modify the normal development database.
