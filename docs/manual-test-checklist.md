# Manual Test Checklist

Run first:

```bash
npm install
npm run backend:setup
npm run qa:full
npm run dev
```

Open `http://localhost:3000`.

## Public

- Open `/`, click Explore live streams, Create account, and several category chips.
- Open `/live`, use Rooms, Hotels, Spa, Food & Brunch, Facilities, Beach Side, Services, Experiences, and Offers category filters.
- Open a live card detail at `/live/[id]`.
- Confirm the page shows provider, category, pin state, replay expiration, and labelled demo player.
- Click Copy live link and Share.
- Try Follow provider while logged out and confirm a friendly auth message or login path.
- Click demo payment, sourcing, AI, and flash-deal controls in the public concept sections; confirm each toggles state or shows a provider-not-configured/demo status message.

## Authentication

- Submit `/signup` empty and confirm friendly field errors.
- Create one account for each public role: hotel, restaurant, supplier, service_provider, viewer.
- Confirm main_admin is not available on public signup.
- Log out, log in again, refresh, and confirm the session remains active.
- Try duplicate signup email and confirm the friendly duplicate-email message.

## Roles

- Log in as `viewer@example.test` / `Password123!` and visit `/dashboard/supplier`; confirm Access denied, current role, required role, Go to your dashboard, and Logout.
- Log in as `admin@example.test` / `ChangeMe123!` and open every dashboard route.
- Confirm normal provider roles only reach their own dashboard, while main_admin reaches all.

## Provider Workflow

- Log in as each provider demo account.
- Open the provider dashboard.
- Create a live request with title, category, description, and future preferred date.
- Confirm the success message and that the request appears immediately.
- Refresh the page and confirm the request persists.
- Submit verification metadata/status from the dashboard controls.

## Admin Workflow

- Log in as main admin.
- Open `/dashboard/main`.
- Confirm totals, pending live requests, verification queue/activity, pinned lives, and replay stats are visible.
- Approve and reject pending requests.
- Schedule an approved live.
- Pin and unpin a live with a pin reason.
- Extend replay availability and confirm days remaining updates.

## Viewer Workflow

- Log in as viewer.
- Follow an available provider.
- Refresh and confirm the provider appears under Following.
- Unfollow and confirm it returns to available providers.
- Open upcoming lives and replays from followed providers.

## Mobile

- Use browser responsive mode around Pixel 5 width.
- Open `/`, `/live`, `/signup`, `/login`, and `/dashboard/viewer`.
- Confirm links/buttons are reachable, text does not overlap, and the live catalogue is usable.
