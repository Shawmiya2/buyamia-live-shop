# buyamia-live-shop

Buyamia Live Shop is an AI-native live commerce prototype for premium B2B procurement, B2C shopping, seller livestreams, restaurant experiences, logistics, rewards, and seller analytics.

## Getting Started

Install dependencies and run the local Next.js app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the main experience and [http://localhost:3000/live](http://localhost:3000/live) for the live room.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Notes

This is currently a product prototype with a mock backend foundation. Dashboard
role guards, demo session handling, in-memory mock persistence, replay policy,
pinned live logic, and subscription data are present for local testing, but they
are not production auth, database, payment, or verification systems.

The live commerce strategy document is available at `docs/live-commerce-strategy.md`.
Backend mock boundaries are documented in `docs/backend-notes.md`.
