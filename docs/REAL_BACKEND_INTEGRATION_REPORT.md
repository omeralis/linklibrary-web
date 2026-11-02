# Real-backend integration report — LinkLibrary

Date: 2026-11-02 · Scope: Next.js frontend ⇄ real Laravel 13 API + PostgreSQL.

> **Honest scope statement.** Everything marked ✅ below was executed against the **real Laravel code and a
> real PostgreSQL database**, but in the **cloud Linux sandbox** (PHP 8.5.12, PostgreSQL **16.15**), not on
> the owner's Windows machine (PostgreSQL 18). Windows-specific checks are marked **NOT VERIFIED**.
> Mock-API results are listed separately and are never counted as real integration.

## 1. Environment

| Item | Value |
|---|---|
| PHP / Laravel | 8.5.12 / 13.39.0 (same versions as the Windows install) |
| Database | PostgreSQL 16.15 (cloud). Isolated DB `linklibrary_e2e` for E2E; `linklibrary_test` for PHPUnit. The development DB `linklibrary` was **never touched** (it exists only on the owner's machine). |
| Services | `php artisan serve` :8000, `queue:work` (security, extraction, ai, default), `schedule:work`, Next.js production build on :3000 |
| Config | `APP_ENV=local`, `MAIL_MAILER=log`, `SECURITY_PROVIDERS=heuristic`, `SECURITY_BLOCKLIST_HOSTS=malware-fixture.example.net`, `AI_PROVIDER=null` |
| Sanctum/CORS | `localhost:3000` stateful, CORS origin allowed with credentials, `SameSite=Lax`, XSRF cookie readable, session cookie HttpOnly — verified by tests |

`php artisan linklibrary:doctor --network` (cloud): PHP/app key/DB/migrations/queue/scheduler/mail/CA bundle/CORS/Sanctum/cookies/storage link ✓.
**1 failure:** outbound HTTPS probe (`DNS_FAILURE`) — sandbox DNS policy for the probe host; real extraction of `pypi.org` through the SSRF-pinned fetcher **did** succeed (see §3). **2 warnings (expected):** mail goes to the log; no authoritative threat-intelligence provider.

## 2. Test results

| Suite | Result |
|---|---|
| Backend PHPUnit (`linklibrary_test`) | ✅ **231 passed**, 0 failed, 0 skipped (1245 assertions) |
| Backend PHPStan (level 5) / Pint | ✅ no errors / ✅ passed |
| Backend OpenAPI contract tests (`FrontendContractTest`, `ApiConventionsTest`) | ✅ passed (now also cover revocation response) |
| Frontend typecheck / ESLint / i18n parity (1083 keys) | ✅ / ✅ / ✅ |
| Frontend unit + component (Vitest) | ✅ **81 passed** |
| Production build | ✅ |
| **Real-backend E2E** (`e2e/real`, Chromium desktop + Pixel 7) | ✅ **42 passed**, 0 failed, 1 opt-in screenshot test skipped |
| Mock-contract E2E (`e2e/mock`, in-memory double) — *not integration proof* | ✅ 22 passed, 1 opt-in skipped |

Real E2E coverage (file → what it proves against the real API):

* `auth.spec` (8): CSRF cookie + 419 on missing token; register via UI → e-mailed verification link; tampered signature refused; invalid credentials, login, session persistence, logout; protected-route redirect with `next`; expired session; **CSRF 419 → refresh → single retry**; forgot-password uniform answer + reset link.
* `links.spec` (8): create + canonical normalisation + duplicate; SSRF validation error on field; **real extraction** (pypi.org) with polling; failure/retry state (`ROBOTS_UNAVAILABLE` with back-off); override edit/restore; tags; favorite; trash/restore/permanent delete; pagination, search, tag filter, sort.
* `security.spec` (8): PENDING at creation; heuristic UNKNOWN / SUSPICIOUS / MALICIOUS (blocklist) verdicts; **backend** rejects publish (`LINK_NOT_PUBLISHABLE`) and invite (`LINK_NOT_SHAREABLE`) for all non-CLEAR links; MALICIOUS `open` → 403; UNKNOWN/SUSPICIOUS open only with `warning:true`; CLEAR (local manual review fixture) can be published; UI never says "safe"; rescan; appeal.
* `sharing.spec` (9): outsider 404; invite → e-mail → accept; viewer representation has no notes and cannot mutate (404); resharing refused (403) until enabled; reshare chain; **recursive revocation with independent path** (owner→bob→{carol,dave}, owner→dave: revoking bob removes bob+carol, dave keeps access); invitation revoke; notifications and mark-read.
* `library.spec` (7): collection CRUD, counts, keyboard reorder, remove, delete keeps links; public collection shows only public links and never leaks private ones; English + Arabic (letter-folding) search; public explore search; profile update + public-profile toggle; admin authorization (403 ×3 for users, admin UI works).
* `a11y.spec` (1 test, 13 pages × ar/en × light/dark): no serious/critical axe violations with real data. `responsive.spec` (1): phone + tablet, ar RTL / en LTR, no horizontal overflow, RTL sheet menu.

All tests use disposable users (`…@e2e.example.com`) and delete them; a global teardown removes any leftovers (it reported 0–1 stragglers per run, all test accounts).

## 3. Bugs found and fixes

| # | Finding | Layer | Fix |
|---|---|---|---|
| 1 | Recursive revocation counted and **notified** users who kept access via an independent path ("your access was removed" sent to someone who still had access) | Backend | `AccessGraphService::revokeGrant` returns only users with no remaining valid grant; regression test added. Frontend confirmation dialog uses the same rule (`revocationImpact`) and says when the target keeps access elsewhere. |
| 2 | OpenAPI `Envelope.data` emitted as `[]` (invalid schema) | Backend source | Fixed in `scripts/build-openapi.php`; spec regenerated; frontend generator no longer patches it (it now fails if the defect returns). |
| 3 | `DELETE …/access/{grantId}` documented as message-only; returns `{revoked_users}` | Backend docs | Documented + contract-tested. |
| 4 | Trash view briefly rendered **library items** (TanStack `placeholderData`) with the wrong action menu | Frontend | Placeholder kept only within the same view (trash/favorites). |
| 5 | Hydration error (React #418) on dashboard routes (session query resolved before a deferred boundary hydrated) | Frontend | `RequireAuth` renders the skeleton until hydrated. |
| 6 | Select triggers without accessible name (axe critical) on add/edit forms | Frontend | `aria-label`. |
| 7 | Technical error code mixed into a sentence; low-contrast code line | Frontend | Code shown on its own line, contrast fixed. |
| 8 | Mixed Arabic/Latin text ordering in cards (e.g. a trailing "." or `#tag`) | Frontend | `<bdi>` isolation for titles, descriptions, notes, tags. |

## 4. UI/UX changes (identity, navigation and theme preserved)

* **Library:** `auto-fill` grid (1/2/many links without stretched cards); image-less cards no longer show an empty band; consistent skeletons; content width capped.
* **Link detail:** preview ≤ 16 rem, whole image visible (`object-contain`, never distorted), hidden if it fails to load; two-column layout with preview/tags/details on the side; label/value rows rebalanced, long addresses stacked.
* **Processing vs security** are separate labelled facts (`Processing: Ready` · `Security check: Not verified`); a **"ready ≠ cleared"** notice appears when extraction finished but the verdict is not CLEAR.
* **Sharing:** one explanation when publish and share are blocked for the same reason; "Owner · full access" row; "Read-only" badge on grants; viewers are told whether they may reshare; revocation dialog states exactly who loses access.
* Verified visually in light/dark, ar/en, desktop and 412 px (screenshots reviewed).

## 5. Security findings

* No frontend-only workaround: every restriction was verified by calling the API directly (422/403/404).
* No security control was disabled; CSRF, auth, SSRF pinning, rate limits (real limiters are respected by the test helpers, which wait instead of bypassing) all remained active.
* The only way to obtain CLEAR locally is the audited, `APP_ENV=local`-only `linklibrary:dev-mark-clear` command (fixtures only).
* **Limitation:** no authoritative threat-intelligence provider is configured here, so in a real deployment every link stays UNKNOWN (not publishable/shareable) until Web Risk / Safe Browsing is configured.
* Secret scan of both repositories: clean; `.env*` (except `.env.example`) ignored and untracked.

## 6. Remaining limitations / NOT VERIFIED

* **NOT VERIFIED on Windows:** PHP 8.5 extensions, PostgreSQL 18, `doctor --network` result, missing `public/storage` symlink (seen earlier on the owner's machine: run `php artisan storage:link`), Windows CA bundle. Reproduce: see README "E2E against the real API".
* Live AI providers and live threat-intel providers: not exercised (no credentials).
* E-mail delivery (SMTP) not exercised; e-mails are read from the log mailer.
* Docker images: not built.
* Backend has no endpoints for declining an invitation / leaving a share / bulk actions (documented in `FRONTEND_API_INTEGRATION.md`).

## 7. GitHub status

See the final summary: this session cannot create repositories under `omeralis` and the owner's machine has no GitHub credentials. Nothing has been pushed; local commits only. Commands to publish are in `IMPLEMENTATION_PROGRESS.md` §7.

## 8. Reproduce

README § "Two separate E2E suites". Cloud sandbox helper used here: start PostgreSQL, `php artisan serve`, `queue:work`, `schedule:work`, `next start`, then
`E2E_BACKEND_DIR=<backend> npm run test:e2e:real`. Leftover disposable accounts: `php e2e/real/fixtures/cleanup-users.php <backend>`.
