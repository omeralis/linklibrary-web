import { test, expect } from '@playwright/test';
import { API, Api, FRONTEND, consoleProblems, deleteAccount, mailLink, newUser, runId, uiLogin, uiLogout } from './support';

const alice = newUser('auth');

test.describe.serial('real API — authentication & session', () => {
  test.afterAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    await deleteAccount(ctx, alice);
    await ctx.close();
  });

  test('CSRF cookie is issued for the SPA origin and mutations without it are rejected', async ({ request }) => {
    const csrf = await request.get(`${API}/sanctum/csrf-cookie`, { headers: { Origin: FRONTEND, Referer: `${FRONTEND}/` } });
    expect(csrf.status()).toBe(204);
    const setCookie = csrf
      .headersArray()
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value);
    expect(setCookie.some((c) => c.startsWith('XSRF-TOKEN=') && !/httponly/i.test(c))).toBe(true);
    expect(setCookie.some((c) => /httponly/i.test(c) && /samesite=lax/i.test(c))).toBe(true);
    expect(csrf.headers()['access-control-allow-origin']).toBe(FRONTEND);
    expect(csrf.headers()['access-control-allow-credentials']).toBe('true');

    // A stateful (browser-origin) POST without the X-XSRF-TOKEN header must fail with 419.
    const login = await request.post(`${API}/api/v1/auth/login`, {
      headers: { Origin: FRONTEND, Referer: `${FRONTEND}/`, Accept: 'application/json' },
      data: { email: 'nobody@e2e.example.com', password: 'x' },
    });
    expect(login.status()).toBe(419);
    expect((await login.json()).code).toBe('CSRF_TOKEN_MISMATCH');
  });

  test('register through the UI, then verify through the e-mailed link', async ({ page }) => {
    const problems = consoleProblems(page);
    await page.goto('/en/register');
    await page.getByLabel('Full name').fill(alice.name);
    await page.getByLabel('Username').fill(alice.username);
    await page.getByLabel('E-mail').fill(alice.email);
    await page.getByLabel('Password', { exact: true }).fill(alice.password);
    await page.getByLabel('Confirm password').fill(alice.password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/en\/dashboard$/);
    await expect(page.getByText(new RegExp(`Verify ${alice.email}`))).toBeVisible();

    const api = new Api(page.context());
    const link = await mailLink(alice.email, '/verify-email');
    expect(link.startsWith(`${FRONTEND}/verify-email?`)).toBe(true); // backend builds unprefixed frontend URLs
    await page.goto(link);
    await expect(page).toHaveURL(/\/(ar|en)\/verify-email\?/);
    await expect(page.getByRole('heading', { name: /E-mail verified|تم تأكيد البريد/ })).toBeVisible();

    await page.goto('/en/dashboard');
    await expect(page.getByText(new RegExp(`Verify ${alice.email}`))).toHaveCount(0);
    const me = await api.get('/auth/me');
    expect((me.body.data as { email_verified: boolean }).email_verified).toBe(true);
    expect(problems).toEqual([]);
  });

  test('a tampered verification link is refused', async ({ page }) => {
    const link = await mailLink(alice.email, '/verify-email');
    await page.goto(link.replace(/signature=[0-9a-f]+/, 'signature=' + '0'.repeat(64)));
    await expect(page.getByRole('heading', { name: /Verification failed|تعذّر التأكيد/ })).toBeVisible();
  });

  test('logout, invalid credentials, login, session persists across reloads', async ({ page }) => {
    await page.goto('/en/login');
    await page.getByLabel('E-mail').fill(alice.email);
    await page.getByLabel('Password', { exact: true }).fill('wrong-password-123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('These credentials do not match our records.')).toBeVisible();

    await uiLogin(page, alice);
    await page.reload();
    await expect(page.getByRole('heading', { name: alice.name })).toBeVisible();
    await page.goto('/en/dashboard/settings');
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue(alice.name);

    await uiLogout(page);
    const me = await new Api(page.context()).get('/auth/me');
    expect(me.status).toBe(401);
  });

  test('protected routes redirect guests and return them after sign-in', async ({ page }) => {
    await page.goto('/en/dashboard/collections');
    await expect(page).toHaveURL(/\/en\/login\?next=%2Fdashboard%2Fcollections/);
    await page.getByLabel('E-mail').fill(alice.email);
    await page.getByLabel('Password', { exact: true }).fill(alice.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/en\/dashboard\/collections$/);
  });

  test('an expired session is detected and the user is sent to sign-in', async ({ page, context }) => {
    await uiLogin(page, alice);
    await page.waitForLoadState('networkidle'); // in-flight API responses would re-set the session cookie
    // Simulate server-side expiry: drop the session and "remember me" cookies (keep XSRF). With only the
    // session cookie removed, Laravel correctly re-authenticates from the remember cookie.
    const cookies = await context.cookies(API);
    const auth = cookies.filter((c) => /[-_]session$/.test(c.name) || c.name.startsWith('remember_web_'));
    expect(auth.length, 'session cookie').toBeGreaterThan(0);
    for (const c of auth) await context.clearCookies({ name: c.name });
    await page.goto('/en/dashboard/links');
    await expect(page).toHaveURL(/\/en\/login\?next=/);
  });

  test('CSRF recovery: a rejected XSRF token (419) is refreshed and the mutation retried once', async ({ page }) => {
    await uiLogin(page, alice);
    // Corrupt the X-XSRF-TOKEN header of the FIRST profile update only; the real API must answer 419 and
    // the client must fetch /sanctum/csrf-cookie and retry with a valid token.
    let tampered = false;
    await page.route('**/api/v1/me', async (route) => {
      if (route.request().method() === 'PATCH' && !tampered) {
        tampered = true;
        return route.continue({ headers: { ...route.request().headers(), 'x-xsrf-token': 'stale-token' } });
      }
      return route.continue();
    });
    const statuses: number[] = [];
    page.on('response', (r) => r.url().endsWith('/api/v1/me') && r.request().method() === 'PATCH' && statuses.push(r.status()));
    const csrfRefreshed = page.waitForResponse((r) => r.url().endsWith('/sanctum/csrf-cookie'));
    await page.goto('/en/dashboard/settings');
    await page.getByLabel('Bio').fill('CSRF recovery check');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Profile updated.')).toBeVisible();
    await csrfRefreshed;
    expect(statuses).toEqual([419, 200]);
  });

  test('forgot password answers identically for unknown and known addresses', async ({ page }) => {
    for (const email of [`nobody_${runId}@e2e.example.com`, alice.email]) {
      await page.goto('/en/forgot-password');
      await page.getByLabel('E-mail').fill(email);
      await page.getByRole('button', { name: 'Send reset link' }).click();
      await expect(page.getByText(/If an account exists for that address/)).toBeVisible();
    }
    const reset = await mailLink(alice.email, '/reset-password');
    await page.goto(reset);
    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
    await expect(page.getByLabel('E-mail')).toHaveValue(alice.email);
  });
});
