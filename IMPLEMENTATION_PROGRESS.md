# IMPLEMENTATION_PROGRESS — LinkLibrary Web (frontend)

> Source of truth for the frontend's status. Backend: `E:\Dev\LinkLibrary` / `omeralis/linklibrary-api`.
> Read `docs/FRONTEND_ARCHITECTURE.md` and `docs/FRONTEND_API_INTEGRATION.md` before changing code.

## 1. Summary

| Item | Status |
|---|---|
| Location | `E:\Dev\linklibrary-web` |
| Stack | Next.js 16.4.3 (App Router, Turbopack) · React 19.3 · TypeScript strict · Tailwind v4 · shadcn/ui · next-intl 4 · TanStack Query 5 · RHF + Zod 4 |
| Build | ✅ `next build` passes (47 static pages + dynamic public routes) |
| Typecheck / lint | ✅ `tsc --noEmit` clean · ✅ ESLint clean (0 errors, 0 warnings) |
| Unit + component tests | ✅ 81 / 81 (Vitest, 8 files) |
| E2E (mock contract double) | ✅ 22 / 22 (Playwright, `e2e/mock`) — not proof of integration |
| E2E (**real Laravel + PostgreSQL**, cloud sandbox) | ✅ 42 / 42 (`e2e/real`); Windows run NOT VERIFIED — see `docs/REAL_BACKEND_INTEGRATION_REPORT.md` |
| i18n | ✅ 1 083 keys in `ar.json` and `en.json`, parity + usage check |
| Dependency audit | ✅ 0 vulnerabilities in production dependencies; 18 moderate in ESLint's dev-only toolchain (`minimatch` via eslint-plugin-*) |
| GitHub | ⏳ Local repo on `main`, commit ready; **remote not yet created** — needs the owner's GitHub authorization (see §7) |

## 2. Completed features

### Public website
- Landing: hero, value proposition, features, how it works, security & privacy (status ladder), AI, public discovery (real latest public links), FAQ, CTA, footer.
- Explore (SSR): full-text public search, category chips with counts, type/language/sort filters, tag filter, crawlable pagination.
- Public link page `/l/{id}` (SSR + Open Graph) with client upgrade to owner/viewer view; public collection `/c/{id}`; public profile `/u/{username}` (links / collections tabs).
- About, Privacy (draft), Terms (draft) — legal copy marked "Draft — pending legal review"; Contact (env-configured e-mail).
- SEO: localized metadata, hreflang alternates, canonical URLs, sitemap.xml, robots.txt, icon.

### Authentication (Sanctum SPA cookies)
- Register, login (remember me), logout (clears all cached data), current session bootstrap, guest-only and protected routes, `?next=` return with open-redirect protection.
- E-mail verification page (signed params, works signed in/out), resend, verify banner; forgot/reset password.
- CSRF cookie handshake, 419 refresh-and-retry, session-expiry and suspended-account handling.

### Dashboard
- Responsive sidebar (sheet on mobile), top bar with global search (Ctrl/⌘K palette), add link, notifications bell (polled), language & theme switchers, user menu.
- Overview: real statistics from API totals (links, favorites, public, collections, shared, unread), pending-invitation banner, recently saved, processing/attention list, quick actions, tips.

### Links
- Add (URL normalisation + validation, duplicate detection via `already_saved`, optional title/notes/category/tags/collections).
- Library: grid/list (remembered), search, filters (category, tag, type, visibility, security), sorting, pagination, trash with restore/permanent delete, favorites page.
- Detail: Overview (description, AI panel, notes, tags add/remove, metadata), Edit (manual overrides with "use original", source type, category, tags, image URL, cover upload/remove), Security (status, disclaimer, rescan, appeal, history, capabilities), Sharing.
- Processing: live pipeline status with polling, failure/partial/blocked explanations and re-analysis.
- Security rules respected: publish/share only when `permissions.can_publish/can_share` and e-mail verified, with explanations for PENDING/UNKNOWN/SUSPICIOUS/MALICIOUS; MALICIOUS cannot be opened; warning interstitial for unverified destinations.

### Collections
- Create/edit/delete, visibility (public requires verified e-mail), cover URL, search (backend), detail with add/remove links, drag-and-drop + keyboard reordering, copy public link, public view.

### Sharing
- Invite by e-mail (owner, and viewers when resharing is allowed), invitations list + revoke, allow-resharing toggle, access tree (owner sees all, viewer sees own grants) with recursive-revocation confirmation showing dependent count.
- Accept via e-mail token page (with sign-in round-trip) or in-app pending invitations; shared-with-me list with filters; read-only viewer page.

### Search, notifications, settings, admin, AI
- Library search page (scope own/shared/all, links/collections, filters, sort) — Arabic/English via backend FTS.
- Notifications page (all/unread, mark read, mark all, navigation per kind) + bell with unread badge.
- Settings: profile (name, username, bio, public profile, avatar upload/remove), e-mail change, password, sessions (revoke one/others), API tokens, language & theme (saved to account), delete account.
- Admin (role-gated): appeals review/resolve, categories (create, activate/deactivate), audit log.
- AI: labelled suggestions (summary, detailed summary, title, category, tags) applied only on user action; disabled/pending/failed/skipped states; fully functional without AI.

## 3. API integrations

76 of the 80 backend routes are used by the UI; the remaining four are typed (`GET /me` duplicated by `/auth/me`, `GET /public/tags`, `PATCH /admin/security/links/{id}`, `GET docs/openapi.yaml` used at build time). Full matrix: `docs/FRONTEND_API_INTEGRATION.md` §2.

## 4. Tests executed (2026-11-02, Linux sandbox, Node 22.23)

| Suite | Command | Result |
|---|---|---|
| i18n | `npm run i18n:check` | ✅ 1 061 keys/locale, 763 static references |
| Types | `npm run typecheck` | ✅ incl. OpenAPI contract assertions |
| Lint | `npm run lint` | ✅ |
| Unit/component | `npm test` | ✅ 80 passed |
| Build | `npm run build` | ✅ |
| E2E | `npm run test:e2e` | ✅ 22 passed (1.9 min) |

E2E content: 12 core journeys in one session (register → verify → login → save → processing → edit → collection → add link → share/publish + UNKNOWN link restriction → accept invitation as recipient (notes not leaked) → search + palette → explore + public page → profile → logout/redirect); RTL/LTR + localized metadata; language switch persistence (`NEXT_LOCALE`); RTL sidebar placement; localized validation; axe WCAG 2.1 A/AA with **no serious/critical violations** on public pages (ar/en × light/dark) and 7 dashboard pages; keyboard skip link + dialog focus; no horizontal overflow at 412 px on 12 public and 7 dashboard pages, mobile menus.

**Important:** E2E ran against `e2e/mock-api/server.mjs` (contract double), because the sandbox has no PHP 8.4 / PostgreSQL 18 and no network route to the Windows machine. **Not yet verified against the real Laravel API** — see §6.

## 5. Decisions

| Date | Decision | Why |
|---|---|---|
| 2026-11-01 | Cookie (SPA) auth only; no token mode in the browser | Handoff §2.1; keeps credentials out of JS. |
| 2026-11-01 | `cacheComponents` disabled; public SSR uses `revalidate: 30` | Matches the API's cache headers; authenticated data stays client-side (`no-store`). |
| 2026-11-01 | shadcn/ui components authored in-repo (registry unreachable from sandbox) | Same new-york source style on the unified `radix-ui` package; `components.json` kept for future `shadcn add`. |
| 2026-11-01 | Default locale `ar`, prefix always | Primary audience; unprefixed e-mail links are redirected by the proxy. |
| 2026-11-01 | Curated domain types + compile-time check against generated OpenAPI types | Spec lacks `required`; drift still fails the build. |
| 2026-11-01 | Acceptance of invitations is always an explicit click | Avoids accepting with the wrong account and gives consent. |
| 2026-11-02 | Filters without tab panels use `SegmentedControl` (aria-pressed) | Valid ARIA (axe). |

## 6. Known issues / remaining dependencies

| Item | Status |
|---|---|
| Real-backend checks | DONE in the cloud sandbox (42 E2E tests). Re-run on Windows (PG18, storage link, doctor --network): OPEN |
| OpenAPI `Envelope.data` emitted as `[]` | FIXED at the source (backend `build-openapi.php`, 2026-11-02); workaround removed |
| No API for: declining an invitation, viewer leaving a share (own grant id), bulk actions, listing all public collections, contact form | Documented; UI omits these |
| Uploaded-vs-URL cover detection uses `/storage/` heuristic | Backend field suggested |
| Public lists can lag up to 30 s after publishing | By design (ISR = API cache window) |
| Dev-only moderate advisories in the ESLint toolchain | Wait for upstream eslint-plugin updates |

## 7. GitHub publishing status

- Local git repository initialised on `main` with the first commit (no `.env*` files except `.env.example`; secret scan clean — see commit notes).
- The cloud session that built this project cannot create repositories under `omeralis` (its GitHub access is limited to pre-attached repositories), and the Linux VM on the Windows machine has no GitHub credentials.
- **To publish** (from `E:\Dev\linklibrary-web`, with GitHub CLI signed in as `omeralis`):

  ```powershell
  gh repo create omeralis/linklibrary-web --private --source . --remote origin --push
  git log origin/main --oneline -1   # verify
  ```

## 8. Next task

1. Publish to GitHub (§7) — needs the owner's `gh` authentication.
2. Re-run the real suite on Windows against an isolated DB (README "Two separate E2E suites"); run `php artisan storage:link` and `php artisan linklibrary:doctor --network`.
3. Configure a real threat-intel provider (Web Risk / Safe Browsing) so links can become CLEAR in production.

## 8b. 2026-11-02 — real-backend audit (summary)

Fixed: trash placeholder bug, hydration mismatch, select a11y names, status separation ("ready ≠ cleared"),
library/detail/sharing layout, revocation impact dialog (mirrors the backend rule), bidi isolation.
Backend (separate commit): recursive-revocation counting/notification fix, OpenAPI fixes. Details and
results: `docs/REAL_BACKEND_INTEGRATION_REPORT.md`.

## 9. Session history

| Date | Summary |
|---|---|
| 2026-11-02 | Real-backend integration audit: 42 real E2E tests, backend + frontend fixes, report written. |
| 2026-11-01 → 02 | Inspected backend handoff, OpenAPI, routes, resources and `.env`; built the complete frontend; 80 unit/component + 22 E2E tests passing; docs written; delivered to `E:\Dev\linklibrary-web`; GitHub push pending authorization. |

- 2026-11-03: AI panel shows a friendly bilingual notice when the free AI quota is exhausted (`processing.ai_wait`); API types regenerated; 1084 i18n keys per locale; checks and 81 unit tests pass.
- 2026-11-03: Security scanning shows "الفحص الأمني — قريبًا" / "Security Scanning — Coming Soon" (rescan disabled); UNKNOWN links can be published/shared with a visible "not security-verified" warning when the backend flag is on; new real-backend `policy.spec`; strict mode re-verified. 86 unit tests pass.
