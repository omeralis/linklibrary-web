# Frontend architecture — LinkLibrary Web

## 1. Principles

1. **The backend is the source of truth.** Every request, field and rule comes from
   `docs/FRONTEND_INTEGRATION_HANDOFF.md` and `docs/openapi.yaml` of the API. The UI only *explains*
   restrictions (e.g. why a link can't be published); the API enforces them.
2. **Private by default, no secrets in the browser.** Authentication uses HttpOnly Sanctum session
   cookies; nothing sensitive is stored in localStorage. Only per-viewer conveniences (theme, grid/list
   layout) are kept in the browser.
3. **Server Components for public, crawlable pages; Client Components for the authenticated app.**
4. **Bilingual from the first line.** No UI string lives in code; layout uses logical CSS properties.

## 2. Routing

```
/                       → proxy redirects to /ar or /en (Accept-Language, then NEXT_LOCALE cookie)
/[locale]
  (public)              SiteHeader + SiteFooter
    /                   landing (ISR 30 s, shows real latest public links)
    /explore            SSR, URL-driven filters → /public/links or /public/search
    /l/[id]             SSR public view + client upgrade to owner/viewer view when signed in
    /c/[id]             SSR public collection
    /u/[username]       SSR public profile (?tab=collections)
    /about /privacy /terms /contact
  (auth)                centered card layout, noindex
    /login /register /forgot-password      guest-only (GuestOnly)
    /reset-password /verify-email          work signed in or out
    /invitations/accept                    explicit accept; sign-in round-trip via ?next=
  /dashboard            DashboardShell (RequireAuth + sidebar + topbar), noindex
    /, /links, /links/[id], /favorites, /collections, /collections/[id],
    /shared, /search, /notifications, /settings, /admin
  /[...rest]            localized 404
```

Backend e-mails link to un-prefixed paths (`/verify-email`, `/reset-password`, `/invitations/accept`,
`/l/{id}`, `/c/{id}`, `/u/{username}`). The next-intl proxy (`src/proxy.ts`) redirects them to the
visitor's locale, preserving the query string — so `FRONTEND_PATH_*` on the backend need no change.

Route groups keep URLs clean while giving each area its own layout. Error boundary
(`[locale]/error.tsx`), `not-found.tsx` and `loading.tsx` files exist per area.

## 3. Rendering & caching

| Area | Rendering | Data |
|---|---|---|
| Landing | Static + ISR (`revalidate = 30`) | `serverPublicApi.links` (failure → section hidden) |
| Explore, public link/collection/profile | Dynamic SSR | `src/lib/api/server.ts` — `fetch(..., { next: { revalidate: 30 } })`, `Accept-Language` + `?locale=`; optional `X-Frontend-Key`/`X-Client-IP` |
| Auth pages, dashboard | Static shell + client rendering | Browser `fetch` with `credentials: 'include'`, `cache: 'no-store'`, TanStack Query |

**Cache Components is deliberately not enabled** (`next.config.ts`): authenticated data never touches
the Next.js server (the session cookie belongs to the API origin and authenticated responses must not be
cached — handoff §7), and public pages map 1:1 to the API's `Cache-Control: max-age=30` with time-based
revalidation. Enabling `cacheComponents` later only affects the public server fetchers.

## 4. Layers

```
components (feature UI) ──► hooks/ (TanStack Query) ──► lib/api/endpoints.ts ──► lib/api/client.ts ──► fetch
                                                                 ▲
                         lib/api/types.ts (domain types) ────────┘ ◄── contract-check.ts ◄── schema.d.ts (OpenAPI)
```

- **`lib/api/client.ts`** — single fetch wrapper: base URL, `/api/v1` prefix, JSON/FormData bodies,
  XSRF handshake, 419 refresh-and-retry, timeout (20 s) + caller cancellation (AbortSignal), envelope
  unwrapping and `ApiError` normalisation (also for non-JSON bodies and network failures).
- **`lib/api/endpoints.ts`** — one typed function per backend route (76 of the 80 routes are used by the UI; see the API
  integration doc), grouped by domain.
- **`lib/api/query-keys.ts`** — hierarchical keys so mutations invalidate by prefix.
- **`lib/query-client.ts`** — retry policy (no retries for 4xx except 408/429; network/5xx twice with
  backoff; honours `Retry-After`) and global 401/`ACCOUNT_SUSPENDED` handling (clears the session →
  `RequireAuth` redirects to `/login?next=…`, toast explains).
- **`hooks/`** — queries and mutations with optimistic updates where safe (favorite, collection reorder)
  and polling where the backend is asynchronous (processing status every 3 s while
  PENDING/PROCESSING; list refresh while any visible link is processing; notification badge every 45 s,
  paused in background tabs).

## 5. Authentication flow

1. App load: `GET /api/v1/auth/me` (`useSession`) → user or guest (401).
2. Mutations call `GET /sanctum/csrf-cookie` once (shared promise), then send `X-XSRF-TOKEN`
   (read from the readable `XSRF-TOKEN` cookie) with `credentials: 'include'`.
3. Login/register → session cookie set by Laravel; the response user seeds the cache; the app
   continues in the account's saved locale (`?next=` validated by `safeInternalPath`).
4. Logout → `POST /auth/logout`, then **every** cached query is cleared.
5. Expiry: any 401 from a non-session query clears the user and redirects with a "session expired" toast.

Token mode (`device_name`) is not used by the website — the cookie flow is the documented browser
integration and keeps credentials out of JavaScript. Tokens created by other clients can be listed and
revoked in Settings → Security.

## 6. Security measures

| Concern | Implementation |
|---|---|
| XSS | React escaping only; no `dangerouslySetInnerHTML`; external URLs/images pass `safeExternalUrl` (http/https only, no credentials). Rich translation tags are fixed components. |
| Open redirects | `?next=` only accepts same-origin relative paths (`safeInternalPath`). |
| External links | `target="_blank" rel="noopener noreferrer nofollow ugc"`; destinations come from the API's `open_url`; links with a security warning go through an interstitial that re-checks `GET /links/{id}/open`. MALICIOUS links have no open button. |
| Images | `<img referrerPolicy="no-referrer" loading="lazy">` with fallback; uploads limited client-side to JPEG/PNG/WebP/GIF ≤ 2 MB (server re-validates). |
| Clickjacking & headers | `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, strict referrer policy, restrictive Permissions-Policy. |
| Privacy | 404 is rendered as "not available" everywhere (same as non-existent). Viewer pages never show notes/settings because the viewer representation doesn't contain them. |
| Destructive actions | Confirmation dialogs (delete link/collection, permanent delete, revoke invitation, recursive grant revocation with dependent count, delete account with password + typed `DELETE`). |
| Secrets | Only `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL` are public; `FRONTEND_SERVER_KEY` is read only in `server-only` code. |

## 7. Design system

- Tokens (`src/app/globals.css`): neutral cool-grey surfaces, one accent ("library teal"),
  semantic soft/foreground pairs for success/warning/danger/info; light and dark themes (class-based,
  `next-themes`, follows the account's saved theme).
- Typography: Geist (Latin) + IBM Plex Sans Arabic (Arabic), both self-hosted via npm packages.
- Components: shadcn/ui (new-york style) in `components/ui`, written against the unified `radix-ui`
  package; `Direction.Provider` makes Radix menus, tabs and sliders RTL-aware. A `SegmentedControl` is
  used for filters that don't own tab panels.
- RTL: logical utilities (`ms-/me-/ps-/pe-/start-/end-`), `rtl-flip` for directional icons, sheets
  open from the logical start/end, toasts bottom-left in Arabic.
- Motion: short Radix enter/exit animations; `prefers-reduced-motion` disables them.
- Status never relies on colour alone: every security/processing badge has a text label; the word
  "safe" is never used (CLEAR = "No threats found").

## 8. Internationalisation

- `src/messages/{ar,en}.json` — 1 061 keys each; `npm run i18n:check` (also a unit test) verifies parity and
  that every statically referenced key exists.
- Validation messages are Zod keys (`v:required`, `v:max|300`) translated at render time; backend
  messages (already localized through `Accept-Language`) are shown verbatim; error codes map to
  dedicated translations (`errors.codes.*`).
- Dates/numbers through `Intl` with the active locale; time zone `Asia/Riyadh` for server rendering.
- Locale persistence: `NEXT_LOCALE` cookie (1 year) + `PATCH /me { locale }` when signed in.
- SEO: localized titles/descriptions, `hreflang` alternates, canonical URLs, `sitemap.xml`,
  `robots.txt` (dashboard/auth excluded), Open Graph for public links.

## 9. Testing strategy

| Layer | Tool | Coverage |
|---|---|---|
| Unit | Vitest | URL sanitisation, query serialisation, API client (CSRF, 419 retry, error mapping, timeouts, cancellation, FormData), retry policy, security/link rules, grant tree, formatting, Zod schemas, i18n parity |
| Component | Testing Library | security badges, open-link behaviour, sharing restrictions, login form (client + 422 mapping), add-link dialog (normalisation, duplicates, URL_NOT_ALLOWED, javascript: rejection), pagination |
| Contract | `tsc` | `contract-check.ts` asserts domain types ⊂ OpenAPI schemas |
| E2E | Playwright | 12 core journeys, RTL/LTR + locale persistence, axe (WCAG 2.1 AA, light/dark, ar/en), phone layouts |

E2E runs against `e2e/mock-api/server.mjs`, a test-only double of the API contract (enforces CSRF,
cookies, 404 privacy, publish/share rules, asynchronous processing). It is never imported by the app.
