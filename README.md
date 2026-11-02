# LinkLibrary — Web

Bilingual (Arabic RTL / English LTR) Next.js frontend for **LinkLibrary**, the AI-assisted link library
with security-checked sharing. It talks to the Laravel 13 API in
[`omeralis/linklibrary-api`](https://github.com/omeralis/linklibrary-api) (local copy: `E:\Dev\LinkLibrary`).

| | |
|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack), React 19, TypeScript (strict) |
| UI | Tailwind CSS v4, shadcn/ui components (Radix primitives), Lucide icons, design tokens in `src/app/globals.css` |
| i18n | next-intl 4 — `/ar` (default, RTL) and `/en` (LTR) |
| Data | Native `fetch` client + TanStack Query 5 (cache, mutations, polling) |
| Forms | React Hook Form + Zod (mirrors backend validation; server 422s mapped onto fields) |
| Auth | Laravel Sanctum **SPA cookies** + XSRF (no tokens in the browser) |
| Tests | Vitest + Testing Library (81 unit/component tests), Playwright + axe: 22 mock-contract E2E tests + 42 **real-backend** E2E tests |

More detail: [`docs/FRONTEND_ARCHITECTURE.md`](docs/FRONTEND_ARCHITECTURE.md),
[`docs/FRONTEND_API_INTEGRATION.md`](docs/FRONTEND_API_INTEGRATION.md),
[`IMPLEMENTATION_PROGRESS.md`](IMPLEMENTATION_PROGRESS.md).

---

## 1. Prerequisites

- Node.js **20.9+** (22 LTS recommended) and npm 10
- The backend running locally (PHP 8.4+/8.5, PostgreSQL 18) — see `E:\Dev\LinkLibrary\README.md`

## 2. Run the backend (from `E:\Dev\LinkLibrary`)

Open **three** terminals:

```powershell
cd E:\Dev\LinkLibrary
php artisan serve                                              # → http://localhost:8000
php artisan queue:work --queue=security,extraction,ai,default  # without it links stay PENDING and no e-mails are sent
php artisan schedule:work                                      # rescans, invitation expiry, cleanup
```

Backend `.env` values that must match this frontend (already set in the local `.env`, verified on 2026-11-01):

```dotenv
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000,127.0.0.1:3000
CORS_ALLOWED_ORIGINS=http://localhost:3000
SESSION_DOMAIN=null
SESSION_DRIVER=database
```

Useful local helpers:

```powershell
php artisan linklibrary:doctor                            # readiness report
php artisan linklibrary:dev-mark-clear --all-unknown      # without a threat-intel key links stay UNKNOWN (not publishable/shareable)
php artisan storage:link                                  # avatars & cover uploads
```

Seeded local accounts (APP_ENV=local): `admin@linklibrary.test` / `demo@linklibrary.test`, password `Password12345`.
E-mails (verification, reset, invitations) go to `storage/logs/laravel.log` with `MAIL_MAILER=log`, or use Mailpit.

## 3. Run the frontend

```powershell
cd E:\Dev\linklibrary-web
copy .env.example .env.local      # cp on macOS/Linux — edit if your API runs elsewhere
npm install
npm run dev                       # → http://localhost:3000 (redirects to /ar or /en)
```

> Always use **`localhost`** (not `127.0.0.1`) for both servers so the Sanctum session and `XSRF-TOKEN`
> cookies are shared between `:3000` and `:8000`.

Production build: `npm run build && npm start`.

### Environment variables (`.env.example`)

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | browser + server | API origin, e.g. `http://localhost:8000` (no `/api/v1`) |
| `NEXT_PUBLIC_SITE_URL` | browser + server | This site's origin (canonical URLs, sitemap, Open Graph) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | browser | Optional address on `/contact` |
| `API_INTERNAL_URL` | **server only** | Optional API origin reachable from the Next.js server |
| `FRONTEND_SERVER_KEY` | **server only** | Optional; must equal backend `FRONTEND_SERVER_KEY` so SSR rate limits use the visitor IP |

Secrets are never prefixed with `NEXT_PUBLIC_`. `.env.local` is git-ignored.

## 4. Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (includes the OpenAPI contract check) |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript + React Compiler rules) |
| `npm test` | Vitest unit + component tests |
| `npm run test:e2e` | Mock-contract E2E (builds the app, starts it on :3100 against the in-memory contract double on :8787) |
| `npm run test:e2e:real` | **Real-backend** E2E against the running Laravel API (see below) |
| `npm run i18n:check` | Arabic/English key parity + every key used in code exists |
| `npm run api:types` | Regenerate `src/lib/api/schema.d.ts` from `../LinkLibrary/docs/openapi.yaml` |
| `npm run check` | i18n + typecheck + lint + unit tests |

First E2E run on a new machine: `npx playwright install chromium`.

### Two separate E2E suites

| Suite | Config | Backend | What it proves |
|---|---|---|---|
| `e2e/mock/` (`npm run test:e2e`) | `playwright.config.ts` | `e2e/mock-api/server.mjs` (in-memory contract double) | UI behaviour against the documented contract. **Not** proof of real integration. |
| `e2e/real/` (`npm run test:e2e:real`) | `playwright.real.config.ts` | The real Laravel API + PostgreSQL | Auth/CSRF/sessions, links, extraction, security statuses and backend enforcement, collections, sharing graph, search (ar/en), notifications, public pages, admin authorization, axe and responsive layouts with real data. |

The real suite creates disposable users (`…@e2e.example.com`) and deletes them at the end. Run it only
against an **isolated database** (never the development database `linklibrary`):

```powershell
# Backend (E:\Dev\LinkLibrary) — one-time: an isolated database for E2E
psql -U postgres -c "CREATE DATABASE linklibrary_e2e"
$env:DB_DATABASE="linklibrary_e2e"; php artisan migrate --force; php artisan db:seed --class=DemoSeeder
# `artisan serve` drops custom env vars, so serve the isolated instance with PHP's built-in server:
$env:DB_DATABASE="linklibrary_e2e"; $env:MAIL_MAILER="log"; $env:SECURITY_BLOCKLIST_HOSTS="malware-fixture.example.net"
php -S localhost:8000 -t public vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php
# second terminal (same env vars): php artisan queue:work --queue=security,extraction,ai,default

# Frontend (E:\Dev\linklibrary-web)
$env:E2E_BACKEND_DIR="..\LinkLibrary"; npm run test:e2e:real
```

Requirements: `APP_ENV=local` (fixtures use `linklibrary:dev-mark-clear`, which refuses elsewhere),
`MAIL_MAILER=log` (e-mails are read from `storage/logs/laravel.log`), outbound HTTPS for the extraction
test (`E2E_EXTRACT_URL`, default a PyPI page). Full details and the last results:
`docs/REAL_BACKEND_INTEGRATION_REPORT.md`.

## 5. Project layout

```
src/
  app/[locale]/(public)      landing, explore, /l/[id], /c/[id], /u/[username], about, privacy, terms, contact
  app/[locale]/(auth)        login, register, forgot/reset password, verify-email, invitations/accept
  app/[locale]/dashboard     overview, links, links/[id], favorites, collections(/[id]), shared, search, notifications, settings, admin
  components/ui              shadcn/ui primitives (button, dialog, select, tabs, …)
  components/<feature>       links, collections, sharing, search, notifications, settings, admin, auth, layout, public, marketing
  hooks/                     TanStack Query hooks (links, collections, sharing, notifications, session…)
  lib/api/                   fetch client, errors, endpoints, query keys, types, OpenAPI schema + contract check, server fetcher
  lib/validation/            Zod schemas + translatable messages
  messages/{ar,en}.json      all UI strings
  i18n/                      next-intl routing / request config / navigation
  proxy.ts                   locale negotiation (Next 16 "proxy", formerly middleware)
e2e/mock/ · e2e/mock-api/   mock-contract E2E suite + in-memory API double
e2e/real/                    real-backend E2E suite (Laravel API + PostgreSQL)
tests/                       Vitest unit & component tests
```

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| Every request after login returns **401** | Use `http://localhost:3000` and `http://localhost:8000` (not 127.0.0.1); check `SANCTUM_STATEFUL_DOMAINS=localhost:3000` and `SESSION_DOMAIN=null`, then `php artisan config:clear`. |
| **419 CSRF token mismatch** | The client refreshes the cookie and retries once automatically. If it persists, clear cookies for `localhost` and make sure `sanctum/csrf-cookie` is in the backend CORS `paths`. |
| CORS error in the console | `CORS_ALLOWED_ORIGINS` must contain the exact frontend origin (`http://localhost:3000`), credentials enabled. |
| “Can't reach the server” | The API isn't running at `NEXT_PUBLIC_API_URL`. Restart `npm run dev` after editing `.env.local` (public vars are inlined at build time). |
| Links stay **Queued/Checking** forever | Start `php artisan queue:work --queue=security,extraction,ai,default`. |
| Links stay **Not verified** (can't publish/share) | No threat-intel provider configured locally — run `php artisan linklibrary:dev-mark-clear --all-unknown`. |
| A newly published link isn't on Explore yet | Public pages are cached for 30 s (same as the API's `Cache-Control`); reload after a moment. |
| Avatars/covers 404 | `php artisan storage:link` (Windows: Developer Mode or an elevated terminal). |
| Corporate TLS inspection blocks `npm install` | Point npm at your proxy CA: `npm config set cafile <path-to-ca.pem>`. |
| AI summaries never appear | Expected while `AI_PROVIDER=null`; the UI says “AI enrichment is turned off”. |
