# Database Guide

Buyamia uses Prisma with a local SQLite database for development. The default
database URL is `file:./dev.db`, resolved by Prisma under the `prisma/`
directory.

## Open The Database

Run:

```bash
npm run db:studio
```

Prisma Studio opens a local browser UI. Select a model from the left sidebar to
view table rows, filter records, and edit local development data.

## Tables

Core foundation tables:

- `User`
- `Session`
- `ProviderProfile`
- `VerificationRequest`
- `LiveRequest`
- `Live`
- `Follow`
- `Rfq`
- `Negotiation`
- `NegotiationMessage`
- `RiskReview`
- `AnalyticsEvent`
- `AdminActivity`

Additional product tables support the existing app workflows, including seller
applications, AI sourcing requests, booking pushes, review briefs, tastings,
reservations, menu highlights, and pinned placement requests.

## Relationships

- `User` owns sessions, verification requests, follows, admin activity, RFQs,
  negotiations, negotiation messages, risk reviews, and analytics events.
- Provider users have one `ProviderProfile`.
- `ProviderProfile` owns live requests, lives, follows, analytics events,
  negotiations, and provider-specific product workflow records.
- `Live` can optionally reference the `LiveRequest` that produced it.
- `Follow` is unique by viewer and provider.
- `Rfq` can have negotiations and risk reviews.
- `Negotiation` has ordered `NegotiationMessage` rows.

## Manual Editing Rules

Safe local edits include demo roles, verification status, live request review
state, pin state, replay expiration, RFQ status, negotiation status, and risk
review notes.

Do not manually edit:

- `User.passwordHash`
- `Session.tokenHash`
- real secrets or credentials
- real identity document contents
- real payment or streaming provider data

To invalidate a local login, delete the matching `Session` row instead of
editing `tokenHash`.

## Common Manual Edits

Change a user role:

1. Open `User`.
2. Find the user by `email`.
3. Update `role`.
4. If changing to a provider role, ensure a matching `ProviderProfile` exists.

Update verification status:

1. Open `User`.
2. Set `verificationStatus`.
3. Optionally open `VerificationRequest` and update the latest request `status`,
   `reviewNote`, and `reviewedAt`.

Approve a live request:

1. Open `LiveRequest`.
2. Set `status` to `approved`.
3. Set `documentsStatus` to `verified` if appropriate.
4. Leave `paymentStatus` as `placeholder` or `not_required` for local demo data.

Pin a live:

1. Open `Live`.
2. Set `isPinned` to `true`.
3. Set `pinReason`, `pinExpiresAt`, and `priorityScore`.

Change replay expiration:

1. Open `Live`.
2. Update `replayExpiresAt`.
3. Use a future date for an available replay or a past date for an expired replay.

Inspect follows:

1. Open `Follow`.
2. Use `viewerId` to identify the viewer user.
3. Use `providerId` to identify the followed provider profile.

Inspect admin activity:

1. Open `AdminActivity`.
2. Sort by `createdAt`.
3. Use `adminId`, `targetType`, and `targetId` to trace what changed.

## Reset And Reseed

Reset only the local SQLite database:

```bash
BACKEND_RESET_CONFIRM=RESET_LOCAL_DATABASE npm run backend:reset
npm run backend:setup
```

Reseed without deleting existing local data:

```bash
npm run db:seed
```
