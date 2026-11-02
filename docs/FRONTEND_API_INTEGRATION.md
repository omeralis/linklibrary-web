# Frontend ↔ API integration

Contract sources: `E:\Dev\LinkLibrary\docs\FRONTEND_INTEGRATION_HANDOFF.md`, `docs/openapi.yaml`
(vendored in `openapi/openapi.yaml`), and the backend routes/resources (`routes/api.php`,
`app/Http/Resources/*`), inspected on 2026-11-01 (backend commit `73c9389`).

## 1. Conventions implemented

| Contract | Frontend |
|---|---|
| Base URL `/api/v1`, JSON envelope `{ success, message, data, meta? }` | `lib/api/client.ts` → `ApiEnvelope<T>`; `requestPage()` → `{ items, pagination, meta }` |
| Errors `{ success:false, message, errors, code }` | `ApiError(status, code, message, errors, retryAfter)`; client codes `NETWORK_ERROR`, `TIMEOUT`, `ABORTED`, `INVALID_RESPONSE` |
| Pagination `meta.pagination { current_page, per_page, has_more, total?, last_page? }` | `PaginationBar` (client) / `PublicPagination` (SSR, crawlable links) |
| Localized messages (`?locale` > user locale > `Accept-Language`) | `Accept-Language` = `<html lang>` on every request; SSR adds `?locale=` |
| Sanctum SPA cookies + `XSRF-TOKEN` | `ensureCsrfCookie()` before the first mutation, `X-XSRF-TOKEN` header, refresh + single retry on 419 |
| 404 for anything not visible | Rendered as "Not available" (no distinction from non-existent) |
| Public `Cache-Control: public, max-age=30`; never cache authenticated | Server fetch `revalidate: 30`; browser `cache: 'no-store'` |
| SSR rate limits (`X-Frontend-Key`, `X-Client-IP`) | Sent from `server-only` code when `FRONTEND_SERVER_KEY` is set |
| Arrays as `key[]` | `toQueryString()` |

### Error handling matrix

| Status / code | UI behaviour |
|---|---|
| 401 `UNAUTHENTICATED` | Session cleared, toast "session expired", redirect to `/login?next=<current>` |
| 403 `ACCOUNT_SUSPENDED` | Session cleared, toast |
| 403 `EMAIL_NOT_VERIFIED` | Message + verify banner with "resend" (dashboard), disabled publish/share/accept controls |
| 403 `LINK_SECURITY_BLOCKED` / `FORBIDDEN` | Localized explanation; open button disabled for blocked links |
| 403 `INVALID_SIGNATURE` / `INVALID_VERIFICATION_LINK` | Verify page error state + resend |
| 404 `NOT_FOUND` / `INVITATION_NOT_FOUND` | "Not available"; invitation page adds a wrong-account hint |
| 409 (`ALREADY_SHARED`, `GRANT_CYCLE`, `INVITATION_NOT_PENDING`, `APPEAL_ALREADY_PENDING`, `NOT_DELETED`, …) | Field error (invite form) or toast with the dedicated translation |
| 410 `INVITATION_EXPIRED` | Message asking for a new invitation |
| 419 `CSRF_TOKEN_MISMATCH` | Transparent cookie refresh and one retry |
| 422 `VALIDATION_ERROR` | `errors.<field>[0]` mapped onto the form field (`applyServerErrors`) |
| 422 `INVALID_URL` / `URL_NOT_ALLOWED` | Shown under the URL field |
| 422 `LINK_NOT_PUBLISHABLE` / `LINK_NOT_SHAREABLE` | Prevented up front from `permissions.can_publish/can_share`; explained if returned |
| 429 `RATE_LIMITED` | "Wait N seconds" from `Retry-After`; queries retry once after that delay |
| 5xx / non-JSON | Generic localized error + retry button; no payload details shown |
| Network failure / 20 s timeout | "Can't reach the server" state with retry |

## 2. Endpoint coverage (80 routes)

✅ used by the UI · ◻️ typed in `endpoints.ts`, no UI (reason given)

### Auth & account
| Route | Where |
|---|---|
| ✅ `POST /auth/register` | `/register` |
| ✅ `POST /auth/login` | `/login` (`remember`) |
| ✅ `POST /auth/logout` | user menu |
| ✅ `GET /auth/me` | `useSession` (app bootstrap, guards) |
| ✅ `POST /auth/email/verification-notification` | verify banner, verify page, invitation page |
| ✅ `GET /auth/email/verify/{id}/{hash}` | `/verify-email` (passes `expires` then `signature` unchanged) |
| ✅ `POST /auth/forgot-password` | `/forgot-password` (same response for every address) |
| ✅ `POST /auth/reset-password` | `/reset-password?token&email` |
| ◻️ `GET /me` | equivalent to `/auth/me`, which the app already uses |
| ✅ `PATCH /me` | profile, e-mail change (with `current_password`), locale & theme sync |
| ✅ `PATCH /me/password` | Settings → Security |
| ✅ `POST /me/avatar`, `DELETE /me/avatar` | Settings → Profile |
| ✅ `DELETE /me` | Settings → Account (password + `DELETE`) |
| ✅ `GET /me/sessions`, `DELETE /me/sessions/{id}`, `POST /me/sessions/revoke-others` | Settings → Security |
| ✅ `GET /me/tokens`, `DELETE /me/tokens/{id}` | Settings → Security |

### Links & security
| Route | Where |
|---|---|
| ✅ `GET /links` (q, favorite, visibility, category, tag, source_type, security_status, trashed, sort, page, per_page) | library, favorites, trash, overview counts, add-links picker |
| ✅ `POST /links` (+ `already_saved`) | add-link dialog (URL, title, notes, category, tags, collections) |
| ✅ `GET /links/{id}` | owner detail, `/l/{id}` upgrade for owner/viewer |
| ✅ `PATCH /links/{id}` | Edit tab (overrides, `null` clears), AI "use suggestion" |
| ✅ `DELETE /links/{id}` (`?permanent=1`) / `POST …/restore` | actions menu, trash |
| ✅ `POST …/favorite` | star buttons (optimistic) |
| ✅ `PATCH …/visibility` | Sharing tab switch (gated by `can_publish` + verified e-mail) |
| ✅ `PATCH …/sharing-settings` | allow-resharing switch |
| ✅ `POST …/tags`, `DELETE …/tags/{slug}` | Overview tag chips, AI suggested tags |
| ✅ `POST …/cover`, `DELETE …/cover` | Edit tab |
| ✅ `POST …/reanalyze` | processing panel (FAILED/PARTIAL) |
| ✅ `GET …/processing-status` | polled every 3 s while PENDING/PROCESSING |
| ✅ `GET …/open` | warning interstitial before opening non-CLEAR links |
| ✅ `GET …/security`, `POST …/security/rescan`, `POST …/security/appeal` | Security tab |

### Sharing
| Route | Where |
|---|---|
| ✅ `POST /links/{id}/invitations` | owner Sharing tab; viewer reshare card on `/l/{id}` |
| ✅ `GET /links/{id}/invitations`, `DELETE …/invitations/{inv}` | invitations list + revoke |
| ✅ `GET /links/{id}/access`, `DELETE …/access/{grant}` | access tree with recursive-revocation confirmation |
| ✅ `POST /invitations/{token}/accept` | `/invitations/accept?token=` |
| ✅ `GET /me/invitations`, `POST /me/invitations/{id}/accept` | Shared → Invitations, overview banner |
| ✅ `GET /shared-with-me` | Shared → Links, overview count |

### Collections, taxonomy, search, notifications
| Route | Where |
|---|---|
| ✅ `GET/POST /collections`, `GET/PATCH/DELETE /collections/{id}` | collections pages and dialogs |
| ✅ `POST /collections/{id}/links`, `DELETE …/links/{linkId}` | add-links dialog, add-to-collection dialog, remove buttons |
| ✅ `PATCH /collections/{id}/reorder` | drag & drop / keyboard reordering (optimistic) |
| ✅ `GET /categories`, `GET /tags?q=` | category selects, tag autocomplete |
| ✅ `GET /search` (scope, type=links|collections, filters, sort) | `/dashboard/search`, Ctrl/⌘K palette, collections search |
| ✅ `GET /notifications`, `GET …/unread-count`, `PATCH …/{id}/read`, `POST …/read-all` | bell popover (polled), notifications page |

### Public
| Route | Where |
|---|---|
| ✅ `GET /public/links` | landing "discovery", `/explore` |
| ✅ `GET /public/search` | `/explore?q=` |
| ✅ `GET /public/links/{id}` | `/l/{id}` (SSR + metadata) |
| ✅ `GET /public/categories` | explore category chips with counts |
| ◻️ `GET /public/tags` | typed; explore filters by tag from link chips instead of a tag cloud |
| ✅ `GET /public/users/{u}`, `…/links`, `…/collections` | `/u/{username}` |
| ✅ `GET /public/collections/{id}` | `/c/{id}` |

### Administration (role-gated)
| Route | Where |
|---|---|
| ✅ `GET /admin/security/appeals`, `POST …/appeals/{id}/resolve` | Admin → Review requests |
| ◻️ `PATCH /admin/security/links/{linkId}` | typed; needs the internal numeric link id, which only appears in appeal payloads — verdicts are applied through appeal resolution |
| ✅ `GET/POST /admin/categories`, `PATCH /admin/categories/{slug}`, `DELETE …/{slug}` | Admin → Categories (create, activate/deactivate) |
| ✅ `GET /admin/audit-logs` | Admin → Audit log |
| ◻️ `GET docs/openapi.yaml` | consumed at build time by `npm run api:types` |

## 3. Types

- `src/lib/api/schema.d.ts` — generated by `npm run api:types` (openapi-typescript 7).
- `src/lib/api/types.ts` — hand-curated, precise domain types (owner/viewer/public link variants with
  type guards). The OpenAPI document declares no `required` properties, so generated types are all
  optional; `src/lib/api/contract-check.ts` asserts at compile time that every curated type is assignable
  to its generated schema — a renamed field or changed enum in the backend spec fails `npm run typecheck`.

## 4. Backend observations (no backend changes were made)

| # | Observation | Impact / workaround |
|---|---|---|
| 1 | `components.schemas.Envelope.properties.data` is serialised as `[]` (empty PHP array) instead of `{}` in `openapi.yaml`. | openapi-typescript rejects it; the generator script patches it before generating. Suggested backend fix: emit `(object) []` / `new \stdClass` in `scripts/build-openapi.php`. |
| 2 | No endpoint for a recipient to **decline** an invitation. | Pending invitations can be accepted or left to expire; owners/inviters can revoke. |
| 3 | A viewer cannot see the id of their own grant (`GET …/access` lists only grants they issued), so "leave a shared link" (`DELETE …/access/{ownGrantId}`) can't be offered. | Not shown in the UI. Suggested: include `my_grant_id` in the viewer representation. |
| 4 | No bulk endpoints (bulk delete/favorite/visibility). | Per-item actions only; adding many links to a collection uses the existing batch endpoint (≤100). |
| 5 | No global listing of public collections. | Public collections are discoverable from profiles (`/u/{username}?tab=collections`) and direct links. |
| 6 | No contact endpoint. | `/contact` shows `NEXT_PUBLIC_CONTACT_EMAIL` when configured. |
| 7 | `overrides.image_url` doesn't say whether it is an uploaded file or a custom URL. | The edit form treats URLs under `/storage/` as uploads (offers "remove uploaded image"). Suggested: add `overrides.image_source`. |

## 5. Verified local configuration (2026-11-01)

From `E:\Dev\LinkLibrary\.env` and `config/cors.php`:
`APP_URL=http://localhost:8000`, `FRONTEND_URL=http://localhost:3000`,
`SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000`, `CORS_ALLOWED_ORIGINS=http://localhost:3000`,
`SESSION_DOMAIN=null`, `SESSION_SAME_SITE=lax`, `SESSION_DRIVER=database`; CORS paths `api/*` and
`sanctum/csrf-cookie`, credentials allowed, allowed headers include `X-XSRF-TOKEN`, `X-Requested-With`
and `Accept-Language`, `Retry-After` exposed. These match the frontend defaults in `.env.example`.
`AI_PROVIDER=null` (AI disabled) — the UI shows the "AI enrichment is turned off" state.
