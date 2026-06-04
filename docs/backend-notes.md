# Backend Mock Notes

Buyamia dashboard backend logic is currently a mock backend foundation, not a
production backend.

## Current Mock Boundaries

- Auth/session: signup creates a demo session in browser `localStorage`. This is
  only for local role-routing demos and is not secure authentication.
- Persistence: users, providers, lives, subscriptions, replay history, and
  verification document metadata are in-memory mock arrays under `lib/backend`.
- Authorization: role guards validate demo roles for dashboard access, but real
  production authorization still needs a trusted server-side identity provider.
- Payments: replay extension and pinned placement labels are placeholders only.
  No real checkout, billing, webhooks, or payment provider is connected.
- Verification: document verification stores mock metadata only. It does not
  store real identity documents and does not call a real verification provider.

## Production Replacements Needed Later

- Real auth/session provider with server-verified user identity and roles.
- Real database for accounts, providers, lives, subscriptions, replay history,
  dashboard analytics, and verification metadata.
- Real payment provider for replay extensions, sponsored pins, invoices, and
  subscription billing.
- Real document verification provider and secure document storage policy.
- Server-side analytics pipeline for live viewers, replay watches, followers,
  conversions, and retention.
