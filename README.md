# buyamia-live-shop

Buyamia Live Shop is an AI-native live commerce prototype for premium B2B procurement, B2C shopping, seller livestreams, restaurant experiences, logistics, rewards, and seller analytics.

## Getting Started

Install dependencies and run the local Next.js app:

```bash
npm install
npm run backend:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the main experience and [http://localhost:3000/live](http://localhost:3000/live) for the live room.

## Scripts

```bash
npm run dev
npm run lint
npm run backend:setup
npm run test:backend
npm run check:links
npm run test:e2e
npm run qa:full
npm run build
```

## Local Backend

The backend source of truth is Prisma with a persistent local SQLite database.
The default development database is `prisma/dev.db` via:

```bash
DATABASE_URL="file:./dev.db"
SEED_ADMIN_EMAIL="admin@example.test"
SEED_ADMIN_PASSWORD="ChangeMe123!"
```

Use `.env.example` as the template. Do not commit real secrets.

Run setup:

```bash
npm run backend:setup
```

Open Prisma Studio for manual database access:

```bash
npm run db:studio
```

Prisma Studio opens a browser UI where you can view every table, inspect rows,
and edit local development data. Use it only for local development data. Do not
manually edit `passwordHash`, `tokenHash`, real credentials, or session records
unless you are intentionally invalidating local sessions. The project stores
verification metadata only and should not be used to store real identity
documents, real payments, or real streaming credentials.

Reset only the local development database:

```bash
BACKEND_RESET_CONFIRM=RESET_LOCAL_DATABASE npm run backend:reset
npm run backend:setup
```

Reseed demo data without deleting the local database:

```bash
npm run db:seed
```

Seeded demo users use `Password123!`:

- `hotel@example.test`
- `restaurant@example.test`
- `supplier@example.test`
- `service@example.test`
- `viewer@example.test`

The main admin uses `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`; without a local
`.env`, the documented `.env.example` defaults are used for local development.

## Test Database And QA

Automated tests do not intentionally reset the normal development database.
Playwright e2e tests create an isolated `test.db`, run Prisma migrations, seed
local demo accounts, and start Next on `http://127.0.0.1:3101`.

Full local verification:

```bash
npm run qa:full
```

This runs, in order:

- `npm run test:backend`
- `npm run check:links`
- `npm run test:e2e`
- `npm run lint`
- `npm run build`

If Playwright browsers are missing after a fresh install, run:

```bash
npx playwright install chromium
```

## Demo Workflow

1. Sign up at `/signup` or log in at `/login`.
2. Providers submit verification metadata and live requests from dashboards or `/api/live-requests`.
3. Main admin reviews verification and live requests, schedules approved lives, pins/unpins lives, and extends replay expiration.
4. Viewers follow/unfollow providers and see followed-provider live/replay feeds.

## External Integrations

Payments, identity verification, object storage, transactional email, insurance,
and livestream/video streaming remain adapter/placeholders until real providers
and credentials are selected.
The local backend stores workflow state and verification metadata only; it does
not process fake payments or store real identity documents.

Provider boundaries still required for production:

- real payment processing;
- real identity document verification;
- real cloud video streaming;
- real object storage;
- transactional email;
- insurance underwriting.

## Notes

Production migration should move Prisma to PostgreSQL, configure managed secrets,
and connect payment, identity, object storage, and livestream providers behind
the service boundaries.

The live commerce strategy document is available at `docs/live-commerce-strategy.md`.
Backend architecture is documented in `docs/backend-architecture.md`.
Manual database editing is documented in `docs/database-guide.md`.
Functional coverage and the dead-button/link inventory are documented in
`docs/functional-matrix.md`.
Manual verification steps are documented in `docs/manual-test-checklist.md`.
