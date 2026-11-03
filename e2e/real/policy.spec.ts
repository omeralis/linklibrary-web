import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { API, Api, createLink, deleteAccount, newUser, runId, seededUser, waitProcessed } from './support';

/**
 * Temporary policy ("Security Scanning — Coming Soon" + unverified sharing), against the real API.
 * Runs only when the backend has SECURITY_SCANNING_COMING_SOON=true and SECURITY_ALLOW_UNVERIFIED_SHARING=true
 * (GET /public/features); security.spec.ts covers the strict policy and is skipped in that mode.
 * An UNKNOWN link needs processed metadata, so the fixture is a real page fetched through the SSRF-safe client.
 */
const owner = newUser('pol');
const REAL_PAGE = 'https://pypi.org/project/six/';
const MALICIOUS = `https://malware-fixture.example.net/policy-${runId}`;

interface Body {
  public_id: string;
  visibility: string;
  security: { status: string; verified: boolean; scanning: string };
  permissions: { can_publish: boolean; can_share: boolean };
}

test.describe.serial('real API — temporary unverified-sharing policy', () => {
  let ctx: BrowserContext;
  let page: Page;
  let api: Api;
  let id = '';
  let enabled = false;

  test.beforeAll(async ({ browser }) => {
    const features = await (await fetch(`${API}/api/v1/public/features`)).json();
    enabled = features.data.unverified_sharing === true && features.data.security_scanning === 'COMING_SOON';
    if (!enabled) return;
    ctx = await browser.newContext();
    page = await ctx.newPage();
    api = await seededUser(page, owner);
  });
  test.afterAll(async () => {
    if (!enabled) return;
    await deleteAccount(ctx, owner);
    await ctx.close();
  });
  test.beforeEach(() => test.skip(!enabled, 'backend is running the strict policy (flags off)'));

  test('new links stay PRIVATE and UNKNOWN (never CLEAR); publishing waits for processed metadata', async () => {
    const created = await createLink(api, REAL_PAGE);
    id = created.public_id;
    expect(created.visibility).toBe('PRIVATE');
    await waitProcessed(api, id);
    const link = (await api.get(`/links/${id}`)).body.data as Body;
    expect(link.visibility).toBe('PRIVATE');
    expect(link.security.status).toBe('UNKNOWN');
    expect(link.security.verified).toBe(false);
    expect(link.permissions.can_publish).toBe(true);
    expect(link.permissions.can_share).toBe(true);
  });

  test('security tab says "Security Scanning — Coming Soon" and rescan is disabled (UI and API), en + ar', async () => {
    await page.goto(`/en/dashboard/links/${id}?tab=security`);
    await expect(page.getByTestId('scanning-coming-soon')).toContainText('Security Scanning — Coming Soon');
    await expect(page.getByRole('button', { name: 'Rescan now' })).toBeDisabled();
    await expect(page.getByTestId('unverified-warning')).toBeVisible();
    await expect(page.getByText('Not verified').first()).toBeVisible();
    await expect(page.getByTestId('scanning-coming-soon').getByText(/no threats found|\bsafe\b/i)).toHaveCount(0);

    const res = await api.post(`/links/${id}/security/rescan`);
    expect(res.status).toBe(422);
    expect((res.body as { code: string }).code).toBe('SECURITY_SCANNING_COMING_SOON');

    await page.goto(`/ar/dashboard/links/${id}?tab=security`);
    await expect(page.getByTestId('scanning-coming-soon')).toContainText('الفحص الأمني — قريبًا');
  });

  test('owner publishes through the UI with a visible "not security-verified" warning; status stays UNKNOWN', async () => {
    await page.goto(`/en/dashboard/links/${id}?tab=sharing`);
    await expect(page.getByTestId('unverified-sharing-warning')).toContainText('not been security-verified');
    await page.getByRole('switch', { name: /make this link public/i }).click();
    await expect.poll(async () => ((await api.get(`/links/${id}`)).body.data as Body).visibility, { timeout: 15_000 }).toBe('PUBLIC');
    expect(((await api.get(`/links/${id}`)).body.data as Body).security.status).toBe('UNKNOWN');
  });

  test('anonymous visitors can see the published link, with the warning', async ({ browser }) => {
    const anon = await browser.newContext();
    const p = await anon.newPage();
    await p.goto(`/en/l/${id}`);
    await expect(p.getByTestId('unverified-notice')).toContainText('not been security-verified');
    const pub = await anon.request.get(`${API}/api/v1/public/links/${id}`, { headers: { Accept: 'application/json' } });
    expect(pub.status()).toBe(200);
    expect((await pub.json()).data.security.verified).toBe(false);
    await anon.close();
  });

  test('private invitations work for UNKNOWN links, but only the owner may invite (others get 404)', async ({ browser }) => {
    const res = await api.post(`/links/${id}/invitations`, { email: `invitee-${runId}@e2e.example.com` });
    expect(res.status, JSON.stringify(res.body)).toBe(201);

    const other = newUser('pol2');
    const octx = await browser.newContext();
    const opage = await octx.newPage();
    const oapi = await seededUser(opage, other);
    try {
      expect((await oapi.post(`/links/${id}/invitations`, { email: `x-${runId}@e2e.example.com` })).status).toBe(404);
      expect((await oapi.patch(`/links/${id}/visibility`, { visibility: 'PRIVATE' })).status).toBe(404);
    } finally {
      await deleteAccount(octx, other);
      await octx.close();
    }
  });

  test('blocklisted (MALICIOUS) links remain blocked for publishing and sharing', async () => {
    const created = await createLink(api, MALICIOUS);
    await expect.poll(async () => ((await api.get(`/links/${created.public_id}`)).body.data as Body).security.status, { timeout: 30_000 }).toBe('MALICIOUS');
    const vis = await api.patch(`/links/${created.public_id}/visibility`, { visibility: 'PUBLIC' });
    expect(vis.status).toBe(422);
    expect((vis.body as { code: string }).code).toBe('LINK_NOT_PUBLISHABLE');
    const inv = await api.post(`/links/${created.public_id}/invitations`, { email: `m-${runId}@e2e.example.com` });
    expect(inv.status).toBe(422);
    expect((inv.body as { code: string }).code).toBe('LINK_NOT_SHAREABLE');
  });
});
