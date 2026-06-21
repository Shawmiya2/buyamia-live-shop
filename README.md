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

Reset only the local development database:

```bash
BACKEND_RESET_CONFIRM=RESET_LOCAL_DATABASE npm run backend:reset
npm run backend:setup
```

Seeded demo users use `Password123!`:

- `hotel@example.test`
- `restaurant@example.test`
- `supplier@example.test`
- `service@example.test`
- `viewer@example.test`

The main admin uses `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`; without a local
`.env`, the documented `.env.example` defaults are used for local development.

## Demo Workflow

1. Sign up at `/signup` or log in at `/login`.
2. Providers submit verification metadata and live requests from dashboards or `/api/live-requests`.
3. Main admin reviews verification and live requests, schedules approved lives, pins/unpins lives, and extends replay expiration.
4. Viewers follow/unfollow providers and see followed-provider live/replay feeds.

## External Integrations

Payments, identity verification, object storage, and livestream/video streaming
remain adapter/placeholders until real providers and credentials are selected.
The local backend stores workflow state and verification metadata only; it does
not process fake payments or store real identity documents.

## Notes

Production migration should move Prisma to PostgreSQL, configure managed secrets,
and connect payment, identity, object storage, and livestream providers behind
the service boundaries.

The live commerce strategy document is available at `docs/live-commerce-strategy.md`.
Backend architecture is documented in `docs/backend-architecture.md`.
