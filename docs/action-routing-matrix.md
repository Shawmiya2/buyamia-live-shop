# Action Routing Matrix

Audit date: 2026-06-22

| Source page | Visible label/control | Previous behavior | Correct behavior | Target route or backend action | Authorized roles | Implementation status | Automated test |
|---|---|---|---|---|---|---|---|
| `/dashboard/main` | Generate RFQ | Quick action was routed by broad matching and could land on a generic dashboard/live fallback | Open persistent RFQ creation workflow | `/dashboard/main/rfqs/new`, `POST /api/rfqs` | `main_admin` | Implemented | `backend.test.ts` RFQ persistence, quick action route guard, `check:links`, build |
| `/dashboard/main` | Rank suppliers | Quick action could fall through to broad sourcing/live behavior | Open supplier ranking from stored provider data | `/dashboard/main/suppliers/rank`, `GET /api/suppliers/rank` | `main_admin` | Implemented | `backend.test.ts` supplier ranking filters, `check:links`, build |
| `/dashboard/main` | Open negotiation | Quick action could route to a generic dashboard | Open persistent negotiation workspace | `/dashboard/main/negotiations`, `POST/PATCH /api/negotiations` | `main_admin` | Implemented | `backend.test.ts` negotiation create/update, `check:links`, build |
| `/dashboard/main` | Review risk | Quick action could route to hotel review/generic dashboard behavior | Open deterministic risk review queue | `/dashboard/main/risk`, `GET/PATCH /api/risk-reviews` | `main_admin` | Implemented | `backend.test.ts` risk persistence, `check:links`, build |
| `/dashboard/main` | View calendar | Missing from procurement quick actions | Open stored operations calendar | `/dashboard/main/calendar`, `GET /api/calendar-events` | `main_admin` | Implemented | `backend.test.ts` calendar events, `check:links`, build |
| `/dashboard/main/rfqs/new` | Create RFQ | Missing page | Validate and persist RFQ | `POST /api/rfqs` | `main_admin` | Implemented | `backend.test.ts` RFQ creation |
| `/dashboard/main/rfqs` | Generate RFQ | Missing page | Navigate to RFQ creation | `/dashboard/main/rfqs/new` | `main_admin` | Implemented | `check:links`, build |
| `/dashboard/main/rfqs` | View details | Missing route | Open real RFQ detail | `/dashboard/main/rfqs/[id]` | `main_admin` | Implemented | `check:links`, build |
| `/dashboard/main/rfqs/[id]` | Open negotiation workspace | Missing route | Continue RFQ into negotiation workflow | `/dashboard/main/negotiations` | `main_admin` | Implemented | `check:links`, build |
| `/dashboard/main/suppliers/rank` | Search/filter/sort controls | Missing page | Query stored providers by search, category, verification, location, and stored metrics | `GET /api/suppliers/rank` | `main_admin` | Implemented | `backend.test.ts` supplier ranking filters |
| `/dashboard/main/suppliers/rank` | Supplier details | Missing route | Open stored provider detail | `/dashboard/main/suppliers/[id]` | `main_admin` | Implemented | `check:links`, build |
| `/dashboard/main/negotiations` | Create negotiation | Missing page/action | Persist negotiation linked to provider/RFQ | `POST /api/negotiations` | `main_admin` | Implemented | `backend.test.ts` negotiation create/update |
| `/dashboard/main/negotiations` | Update negotiation | Missing page/action | Persist status and message | `PATCH /api/negotiations/[id]` | `main_admin` | Implemented | `backend.test.ts` negotiation create/update |
| `/dashboard/main/negotiations` | Negotiation list item | Missing route | Open detail workspace for selected negotiation | `/dashboard/main/negotiations/[id]` | `main_admin` | Implemented | `check:links`, build |
| `/dashboard/main/risk` | Risk filters | Missing page | Filter deterministic provider/RFQ risk indicators | `GET /api/risk-reviews` | `main_admin` | Implemented | `backend.test.ts` risk derivation |
| `/dashboard/main/risk` | Save risk review | Missing action | Persist admin review decision/note | `PATCH /api/risk-reviews` | `main_admin` | Implemented | `backend.test.ts` risk persistence |
| `/dashboard/main/risk` | Open detail | Missing route | Open provider or RFQ detail | `/dashboard/main/suppliers/[id]` or `/dashboard/main/rfqs/[id]` | `main_admin` | Implemented | `check:links`, build |
| `/dashboard/main/calendar` | Today | Missing page | Return calendar view to current month | Local state | `main_admin` | Implemented | build |
| `/dashboard/main/calendar` | Previous / Next | Missing page | Navigate month view | Local state | `main_admin` | Implemented | build |
| `/dashboard/main/calendar` | List view / Month view | Missing page | Toggle date-grouped list vs month-filtered view | Local state | `main_admin` | Implemented | build |
| `/dashboard/main/calendar` | Category/role/status filters | Missing page | Filter stored live request, live, replay, and verification dates | `GET /api/calendar-events` | `main_admin` | Implemented | `backend.test.ts` calendar events |
| `/dashboard/main/calendar` | Event link | Missing page | Open real live detail, RFQ/provider risk page, or request focus URL | `/live/[id]`, `/dashboard/main/risk`, calendar focus URL | `main_admin`, public for live detail | Implemented | `backend.test.ts` no generic `/live`, `check:links` |
| Dashboard platform shortcuts | Open hotel dashboard | Broad fallback could land on `/dashboard/main` | Open hotel dashboard | `/dashboard/hotel` | `hotel`, `main_admin` | Implemented | `check:links` |
| Dashboard platform shortcuts | Open services dashboard | Broad fallback could land on `/dashboard/main` | Open services dashboard | `/dashboard/services` | `service_provider`, `main_admin` | Implemented | `check:links` |
| Dashboard platform shortcuts | Open supplier dashboard | Broad fallback could land on `/dashboard/main` | Open supplier dashboard | `/dashboard/supplier` | `supplier`, `main_admin` | Implemented | `check:links` |
| Dashboard platform shortcuts | Open AI Procurement | Broad fallback | Open main admin dashboard | `/dashboard/main` | `main_admin` | Implemented | `check:links` |
| Hotel dashboard quick actions | Open live room | `/live` | Genuine live discovery | `/live` | Public/live users | Implemented | Existing e2e live navigation, `check:links` |
| Hotel dashboard quick actions | Create booking push | Broad hotel/live fallback | Hotel workspace | `/dashboard/hotel` | `hotel`, `main_admin` | Implemented | `check:links` |
| Hotel dashboard quick actions | Schedule stream | Could match stream and go to `/live` | Hotel live request workspace | `/dashboard/hotel` | `hotel`, `main_admin` | Implemented | `check:links` |
| Hotel dashboard quick actions | Generate review brief | Could match review and route too broadly | Hotel workspace | `/dashboard/hotel` | `hotel`, `main_admin` | Implemented | `check:links` |
| Restaurant dashboard quick actions | Open chef live | `/live` | Genuine live discovery | `/live` | Public/live users | Implemented | Existing e2e live navigation, `check:links` |
| Restaurant dashboard quick actions | Pin menu highlight | Broad restaurant fallback | Restaurant workspace | `/dashboard/restaurant` | `restaurant`, `main_admin` | Implemented | `check:links` |
| Restaurant dashboard quick actions | Create tasting | Broad restaurant fallback | Restaurant workspace | `/dashboard/restaurant` | `restaurant`, `main_admin` | Implemented | `check:links` |
| Restaurant dashboard quick actions | Adjust reservations | Broad restaurant fallback | Restaurant workspace | `/dashboard/restaurant` | `restaurant`, `main_admin` | Implemented | `check:links` |
| Supplier dashboard quick actions | Generate quote | Supplier dashboard fallback | RFQ generation workflow | `/dashboard/main/rfqs/new` | `main_admin` | Implemented | quick action route guard, `check:links` |
| Supplier dashboard quick actions | Open sourcing stream | Could match stream and go to `/live` | Supplier ranking/sourcing workspace | `/dashboard/main/suppliers/rank` | `main_admin` | Implemented | quick action route guard, `check:links` |
| Supplier dashboard quick actions | Update escrow | Supplier dashboard fallback | Negotiation workspace | `/dashboard/main/negotiations` | `main_admin` | Implemented | quick action route guard, `check:links` |
| Supplier dashboard quick actions | Launch overstock live | `/live` | Genuine live launch/discovery path remains live | `/live` | Public/live users | Implemented | `check:links` |
| Services dashboard quick actions | Set up a live for my service | Could match live and go to `/live` | Service provider dashboard setup panel | `/dashboard/services` | `service_provider`, `main_admin` | Implemented | `check:links` |
| Services dashboard quick actions | Review verification | Could match review and go to unrelated dashboard | Main risk/verification review | `/dashboard/main/risk` | `main_admin` | Implemented | `check:links` |
| Services dashboard quick actions | Extend replay availability | Services dashboard | Service replay policy panel | `/dashboard/services` | `service_provider`, `main_admin` | Implemented | `check:links` |
| Services dashboard quick actions | Request pinned placement | Services dashboard | Service pinned placement panel | `/dashboard/services` | `service_provider`, `main_admin` | Implemented | `check:links` |
| Viewer dashboard quick actions | Compare hotels | Broad fallback | Viewer dashboard | `/dashboard/viewer` | `viewer` | Implemented | `check:links` |
| Viewer dashboard quick actions | Open replay | `/live` | Genuine live/replay discovery | `/live` | Public/viewer | Implemented | Existing e2e live navigation, `check:links` |
| Viewer dashboard quick actions | Update wishlist | Broad fallback | Viewer dashboard | `/dashboard/viewer` | `viewer` | Implemented | `check:links` |
| Viewer dashboard quick actions | Check booking | Broad fallback | Viewer dashboard | `/dashboard/viewer` | `viewer` | Implemented | `check:links` |
| `/live` catalogue cards | View details / Watch live | Real live details | Open persisted live detail | `/live/[id]` | Public | Existing | Existing e2e live detail, `check:links` |
| `/live/[id]` | Follow provider | API action | Persist follow/unfollow | `POST /api/follows` | `viewer` | Existing | Existing e2e follow, backend tests |
| `/live/[id]` | Copy live link | Clipboard action | Copy current live URL | Clipboard API | Public | Existing | Existing e2e copy link |
| `/dashboard/main` admin panels | Approve/reject/request info | API action | Persist live request review | `PATCH /api/admin/live-requests/[id]/review` | `main_admin` | Existing | Backend tests, e2e admin review |
| `/dashboard/main` admin panels | Schedule approved live | API action | Persist scheduled live | `PATCH /api/admin/live-requests/[id]/schedule` | `main_admin` | Existing | Backend tests |
| `/dashboard/main` admin panels | Pin/unpin live | API action | Persist pin state | `PATCH /api/lives/[id]/pin` | `main_admin` | Existing | Backend tests |
| `/dashboard/main` admin panels | Extend replay | API action | Persist replay expiration | `PATCH /api/lives/[id]/replay-expiration` | `main_admin` | Existing | Backend tests |
| Auth pages | Login / Create account / Logout | API action | Persist session or clear session | `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout` | Public/authenticated | Existing | Backend tests, e2e auth |

Static guard: `npm run check:links` scans App Router pages, internal links, invalid `href="#"`, placeholder click handlers, console-only actions, and enabled buttons without meaningful behavior.
