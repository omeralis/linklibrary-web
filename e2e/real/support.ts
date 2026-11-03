import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';

/**
 * Helpers for the REAL-backend suite. Nothing here talks to a mock: requests go to the Laravel API,
 * e-mails are read from the API's mail log (MAIL_MAILER=log), and local-only artisan commands are used
 * exactly as a developer would.
 */
export const FRONTEND = process.env.E2E_FRONTEND_URL ?? 'http://localhost:3000';
export const API = process.env.E2E_API_URL ?? 'http://localhost:8000';
export const BACKEND_DIR = resolve(process.env.E2E_BACKEND_DIR ?? '../LinkLibrary');
export const PHP = process.env.E2E_PHP ?? 'php';
export const PASSWORD = 'E2e-Passw0rd-2026';
const LOG = join(BACKEND_DIR, 'storage', 'logs', 'laravel.log');

export const runId = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export interface TestUser {
  name: string;
  username: string;
  email: string;
  password: string;
}

export function newUser(label: string): TestUser {
  const slug = `${label}_${runId}`
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30);
  return { name: `E2E ${label}`, username: slug, email: `${slug}@e2e.example.com`, password: PASSWORD };
}

// ───────────────────────────────────────── API access sharing the browser's cookie jar

function xsrfFrom(cookies: { name: string; value: string }[]): string {
  const c = cookies.find((x) => x.name === 'XSRF-TOKEN');
  return c ? decodeURIComponent(c.value) : '';
}

/** A Sanctum SPA client that uses the browser context's cookies (same session as the UI). */
export class Api {
  constructor(
    private readonly context: BrowserContext,
    private readonly request: APIRequestContext = context.request,
  ) {}

  private async headers(mutating: boolean) {
    const h: Record<string, string> = { Accept: 'application/json', Origin: FRONTEND, Referer: `${FRONTEND}/`, 'Accept-Language': 'en' };
    if (mutating) {
      let token = xsrfFrom(await this.context.cookies(API));
      if (!token) {
        await this.request.get(`${API}/sanctum/csrf-cookie`, { headers: { Origin: FRONTEND, Referer: `${FRONTEND}/` } });
        token = xsrfFrom(await this.context.cookies(API));
      }
      h['X-XSRF-TOKEN'] = token;
    }
    return h;
  }

  async call(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, data?: unknown) {
    let res = await this.request.fetch(`${API}/api/v1${path}`, { method, headers: await this.headers(method !== 'GET'), data });
    // The API's per-user limiter (120/min) is real; test helpers wait for it instead of failing.
    for (let i = 0; i < 3 && res.status() === 429; i++) {
      await new Promise((r) => setTimeout(r, (Number(res.headers()['retry-after']) || 10) * 1000 + 250));
      res = await this.request.fetch(`${API}/api/v1${path}`, { method, headers: await this.headers(method !== 'GET'), data });
    }
    let body: { success?: boolean; data?: unknown; meta?: Record<string, unknown>; code?: string; message?: string; errors?: Record<string, string[]> } = {};
    try {
      body = await res.json();
    } catch {
      /* non-JSON */
    }
    return { status: res.status(), body };
  }
  get = (p: string) => this.call('GET', p);
  post = (p: string, d?: unknown) => this.call('POST', p, d);
  patch = (p: string, d?: unknown) => this.call('PATCH', p, d);
  del = (p: string, d?: unknown) => this.call('DELETE', p, d);
}

// ───────────────────────────────────────── mail log

function mailsTo(email: string): string[] {
  if (!existsSync(LOG)) throw new Error(`Mail log not found at ${LOG} (set E2E_BACKEND_DIR, MAIL_MAILER=log)`);
  const log = readFileSync(LOG, 'utf8');
  return log
    .split(/\] [a-z]+\.DEBUG: From: /)
    .filter((chunk) => new RegExp(`^To: ${email.replace(/[.+]/g, '\\$&')}\\s*$`, 'm').test(chunk))
    .map((chunk) => chunk.replace(/&amp;/g, '&').replace(/=\r?\n/g, ''));
}

type MailPath = '/verify-email' | '/reset-password' | '/invitations/accept';
const mailRe = (path: MailPath) => new RegExp(`${FRONTEND.replace(/[.:/]/g, '\\$&')}${path}\\?[^"'\\s<]+`, 'g');

/** All links of kind `path` e-mailed to `email` so far (oldest first). */
export function mailLinks(email: string, path: MailPath): string[] {
  if (!existsSync(LOG)) return [];
  return mailsTo(email).flatMap((m) => m.match(mailRe(path)) ?? []);
}

/**
 * Waits for the newest e-mail to `email` containing a frontend link with `path` and returns that URL.
 * Pass `seen` (links that existed before the action) to wait for a NEW e-mail.
 */
export async function mailLink(email: string, path: MailPath, timeout = 20_000, seen: string[] = []): Promise<string> {
  let found: string | undefined;
  await expect
    .poll(
      () => {
        const links = mailLinks(email, path).filter((l) => !seen.includes(l));
        found = links.at(-1);
        return !!found;
      },
      { timeout, intervals: [500, 1000] },
    )
    .toBe(true);
  return found!;
}

// ───────────────────────────────────────── artisan (local-only developer tools)

export function artisan(...args: string[]): string {
  return execFileSync(PHP, ['artisan', ...args], { cwd: BACKEND_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * Records a manual CLEAR review for ONE fixture link (php artisan linklibrary:dev-mark-clear, refuses
 * outside APP_ENV=local). This is how a developer exercises publish/share without a threat-intel key;
 * it is never used for production data.
 */
export function markClear(publicId: string) {
  const out = artisan('linklibrary:dev-mark-clear', publicId);
  // "0" when the (global) link already carries a CLEAR manual review from an earlier run.
  expect(out).toMatch(/[01] link\(s\) marked CLEAR/);
}

// ───────────────────────────────────────── account lifecycle

/**
 * Creates a verified disposable user straight in the isolated E2E database (fixtures/create-user.php)
 * and signs the browser context in through the real API. Registration UI is covered by auth.spec.ts.
 */
export async function seededUser(page: Page, user: TestUser, role: 'USER' | 'ADMIN' = 'USER'): Promise<Api> {
  execFileSync(PHP, [resolve(__dirname, 'fixtures', 'create-user.php'), BACKEND_DIR, user.email, user.username, user.name, user.password, role], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const api = new Api(page.context());
  const res = await api.post('/auth/login', { email: user.email, password: user.password });
  expect(res.status, JSON.stringify(res.body)).toBe(200);
  return api;
}

/** Registers through the API (SPA session), then opens the e-mailed verification link through the UI. */
export async function registerVerified(page: Page, user: TestUser, { verify = true } = {}) {
  const api = new Api(page.context());
  const res = await api.post('/auth/register', { ...user, password_confirmation: user.password, locale: 'en' });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  if (verify) {
    const link = await mailLink(user.email, '/verify-email');
    await page.goto(link);
    await expect(page.getByRole('heading', { name: 'E-mail verified' })).toBeVisible();
  }
  return api;
}

export async function uiLogin(page: Page, user: TestUser) {
  await page.goto('/en/login');
  await page.getByLabel('E-mail').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function uiLogout(page: Page) {
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login/);
}

/**
 * Deletes a disposable account (and with it everything it created) through DELETE /me. Uses the existing
 * session when it is still valid; signs in again only if needed (respecting the login rate limit).
 */
export async function deleteAccount(context: BrowserContext, user: TestUser) {
  const api = new Api(context);
  const body = { password: user.password, confirmation: 'DELETE' };
  let res = await api.del('/me', body);
  if (res.status === 401 || res.status === 419) {
    await context.clearCookies();
    for (let attempt = 0; attempt < 3; attempt++) {
      const login = await api.post('/auth/login', { email: user.email, password: user.password });
      if (login.status !== 429) break;
      await new Promise((r) => setTimeout(r, 20_000));
    }
    res = await api.del('/me', body);
  }
  // Strict: a silently failed cleanup would leave disposable accounts behind.
  expect(res.status, `cleanup of ${user.email}: ${JSON.stringify(res.body)}`).toBe(200);
}

export async function createLink(api: Api, url: string, extra: Record<string, unknown> = {}) {
  const res = await api.post('/links', { url, ...extra });
  expect([200, 201], JSON.stringify(res.body)).toContain(res.status);
  return res.body.data as { public_id: string; [k: string]: unknown };
}

/** Waits until the asynchronous pipeline settles (queue worker must be running). */
export async function waitProcessed(api: Api, id: string, timeout = 45_000) {
  let last = '';
  await expect
    .poll(
      async () => {
        const r = await api.get(`/links/${id}/processing-status`);
        last = String((r.body.data as { status?: string } | undefined)?.status);
        return !['PENDING', 'PROCESSING'].includes(last);
      },
      { timeout, intervals: [1000, 2000] },
    )
    .toBe(true);
  return last;
}

export function consoleProblems(page: Page) {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (/MISSING_MESSAGE|hydrat/i.test(msg.text())) problems.push(msg.text());
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

/**
 * Spaces out full page loads so a long sweep stays under the API's per-user rate limit (each dashboard
 * page issues several requests). Returns a function to await before each navigation.
 */
export function pacer(minGapMs = 2500) {
  let last = 0;
  return async () => {
    const wait = last + minGapMs - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
  };
}
