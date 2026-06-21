# Buyamia Functional Matrix

Last verified: 2026-06-21 with `npm run qa:full`.

| Source page | Component/control | Current action | Expected action | Target page or API | Authorized roles | Status | Automated test |
|---|---|---|---|---|---|---|---|
| `/` | Buyamia logo/sidebar brand | Navigates home | Navigate to public discovery | `/` | Public | Implemented | `check:links`, e2e route health |
| `/` | Explore live streams | Navigates to catalogue | Open live catalogue | `/live` | Public | Implemented | e2e public homepage |
| `/` | Create account | Navigates to signup | Open signup | `/signup` | Public | Implemented | e2e signup |
| `/` | Browse category chips | Navigates with query | Filter live catalogue by category | `/live?category=...` | Public | Implemented | e2e category navigation |
| `/` | Live cards: Watch live/View details | Navigates with query | Open useful filtered catalogue | `/live?category=...` | Public | Implemented | `check:links` |
| `/` | Login to follow | Navigates to login | Prompt auth before viewer follow | `/login` | Public | Implemented | e2e auth |
| `/live` | Stored live catalogue cards | Navigates to persisted detail | Open real live detail | `/live/[id]` | Public | Implemented | e2e live detail |
| `/live` | Category filters | Updates URL and visible results | Filter persisted lives | `/live?category=...` | Public | Implemented | e2e category navigation |
| `/live` | Clear filters | Removes filters | Show all persisted lives | `/live` | Public | Implemented | `check:links` |
| `/live` | RFQ / Request stream RFQ | Navigates to supplier dashboard | Require supplier/admin login for RFQ workflow | `/dashboard/supplier` | Supplier/main_admin via guard | Implemented | `check:links`, e2e route health |
| `/live` | View calendar | Navigates to scheduled filter | Show scheduled lives | `/live?status=scheduled` | Public | Implemented | `check:links` |
| `/live` | Remind me | Navigates to login | Auth prompt for reminders | `/login` | Public | Implemented | `check:links` |
| `/live/[id]` | Demo player | Displays labelled demo/unavailable state | Never imply real streaming provider | Page UI | Public | Implemented | e2e live detail |
| `/live/[id]` | Follow provider | Calls follow API or shows auth error | Persist viewer/provider follow | `POST /api/follows` | viewer | Implemented | e2e viewer follow |
| `/live/[id]` | Copy live link | Writes URL to clipboard | Copy and confirm | Clipboard API | Public | Implemented | e2e copy link |
| `/live/[id]` | Share | Opens social share URL | Share real live URL | Twitter intent URL | Public | Implemented | `check:links` |
| `/signup` | Role buttons | Selects role | Public roles only, no main_admin | Local UI, `POST /api/auth/signup` | Public | Implemented | e2e signup, backend tests |
| `/signup` | Signup form | Validates and creates account | Persist user, provider profile where needed, session cookie | `POST /api/auth/signup` | Public roles | Implemented | e2e signup, backend tests |
| `/login` | Login form | Authenticates | Persist server session and role redirect | `POST /api/auth/login` | Existing users | Implemented | e2e login, backend tests |
| All dashboards | Logout | Invalidates session | Clear session and redirect login | `POST /api/auth/logout` | Authenticated users | Implemented | e2e logout, backend tests |
| Dashboard access gate | Go to your dashboard | Navigates to allowed dashboard | Role-aware safe redirect | Role dashboard | Authenticated users | Implemented | e2e role guard |
| Dashboard access gate | Logout on denied page | Invalidates session | Let forbidden user switch accounts | `POST /api/auth/logout` | Authenticated users | Implemented | e2e role guard |
| `/dashboard/hotel` | Create a live request | Opens form and submits | Persist provider-owned request | `POST /api/live-requests` | hotel/main_admin scoped | Implemented | e2e provider workflow, backend tests |
| `/dashboard/restaurant` | Create a live request | Opens form and submits | Persist restaurant request | `POST /api/live-requests` | restaurant/main_admin scoped | Implemented | backend tests |
| `/dashboard/supplier` | Create a live request | Opens form and submits | Persist supplier request | `POST /api/live-requests` | supplier/main_admin scoped | Implemented | backend tests |
| `/dashboard/services` | Create a live request | Opens form and submits | Persist service request with demo metadata/payment note | `POST /api/live-requests` | service_provider/main_admin scoped | Implemented | backend tests |
| Provider dashboards | Verification controls | Submit/review metadata status | Persist metadata-only status | `/api/verification/*` | Provider or main_admin by route | Implemented | backend tests |
| Provider dashboards | Live request list | Displays own requests | Provider cannot read another provider private request | `GET /api/live-requests` | Provider owner/main_admin | Implemented | backend tests |
| Provider dashboards | Edit/cancel APIs | PATCH/DELETE request | Persist allowed draft/pending changes | `/api/live-requests/[id]` | Provider owner | Implemented | backend tests |
| `/dashboard/main` | Approve/reject/request info | Admin review mutation | Persist status, note, activity | `PATCH /api/admin/live-requests/[id]/review` | main_admin | Implemented | e2e admin review, backend tests |
| `/dashboard/main` | Schedule approved live | Admin schedule mutation | Persist Live and scheduled request | `PATCH /api/admin/live-requests/[id]/schedule` | main_admin | Implemented | backend tests |
| `/dashboard/main` | Pin/unpin live | Admin pin mutation | Persist pin reason/expiration/activity | `PATCH /api/lives/[id]/pin` | main_admin | Implemented | backend tests |
| `/dashboard/main` | Extend replay | Admin replay mutation | Persist replay expiration/activity | `PATCH /api/lives/[id]/replay-expiration` | main_admin | Implemented | backend tests |
| `/dashboard/viewer` | Follow provider | Calls follow mutation | Persist unique follow pair | `POST /api/subscriptions/follow` | viewer | Implemented | e2e viewer follow, backend tests |
| `/dashboard/viewer` | Unfollow provider | Calls unfollow mutation | Delete follow pair | `DELETE /api/subscriptions/follow` | viewer | Implemented | e2e viewer follow, backend tests |
| `/dashboard/viewer` | Upcoming/replay links | Opens live detail | Navigate to persisted live | `/live/[id]` | Public detail, viewer feeds | Implemented | `check:links` |
| Compatibility pages | Old dashboard routes | Render canonical dashboard shell | Preserve old route access | `/hotel-dashboard`, `/restaurant-dashboard`, `/supplier-dashboard`, `/traveler-dashboard`, `/ai-procurement-dashboard` | Guarded through API panels | Implemented | build route inventory |
| All route handlers | API responses | Normalized envelope | Safe success/error shape | `/api/*` | Route-specific | Implemented | backend tests |
| `/api/health` | Health check | Reports app/db availability | No secrets | `/api/health` | Public safe | Implemented | build route inventory |

## External Integrations

Payments, identity documents, object storage, transactional email, insurance underwriting, and cloud video streaming are local demo/placeholders only. Related controls either navigate to internal flows or display labelled "Demo", "Provider not configured", "Payment placeholder", or metadata-only copy. No flow claims real charges, legal verification, contracts, or broadcasts.
