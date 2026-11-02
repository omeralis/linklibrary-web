import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { Api, createLink, deleteAccount, markClear, newUser, runId, seededUser } from './support';

/**
 * Security statuses against the real API. Verdicts come from the backend's heuristic provider
 * (SECURITY_PROVIDERS=heuristic): a blocklisted host → MALICIOUS, a host with ≥ 6 dots → SUSPICIOUS,
 * anything else → UNKNOWN (no reputation provider can vouch for it). CLEAR is produced by the local-only
 * manual review command for one fixture link. Every restriction is checked twice: in the UI *and* by
 * calling the API directly, so the backend — not the UI — is shown to enforce it.
 */
const owner = newUser('sec');

// Links are global (shared between users), so each run uses fresh hosts to observe the initial PENDING verdict.
const FIXTURES = {
  unknown: `https://unknown-${runId}.e2e-fixture.example.org/article`,
  suspicious: `https://a.b.c.d.e.sus-${runId}.example.org/login`,
  malicious: `https://malware-fixture.example.net/${runId}`,
  clear: `https://clear-${runId}.e2e-fixture.example.org/doc`,
} as const;
type Kind = keyof typeof FIXTURES;

interface LinkBody {
  public_id: string;
  visibility: string;
  security: { status: string; signals?: string[] };
  permissions: { can_publish: boolean; can_share: boolean; can_open?: boolean };
}

async function settledSecurity(api: Api, id: string) {
  let status = 'PENDING';
  await expect
    .poll(
      async () => {
        status = ((await api.get(`/links/${id}`)).body.data as LinkBody).security.status;
        return status;
      },
      { timeout: 30_000, intervals: [500, 1000] },
    )
    .not.toBe('PENDING');
  return status;
}

test.describe.serial('real API — security statuses', () => {
  let ctx: BrowserContext;
  let page: Page;
  let api: Api;
  const ids = {} as Record<Kind, string>;

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    page = await ctx.newPage();
    api = await seededUser(page, owner);
  });
  test.afterAll(async () => {
    await deleteAccount(ctx, owner);
    await ctx.close();
  });

  test('new links start PENDING and the backend refuses to publish/share them', async () => {
    const created = (await createLink(api, FIXTURES.unknown)) as unknown as LinkBody;
    ids.unknown = created.public_id;
    // At creation the scan has not run yet (it is queued), so the stored verdict is PENDING.
    expect(created.security.status).toBe('PENDING');
    expect(created.permissions.can_publish).toBe(false);
    expect(created.permissions.can_share).toBe(false);
    for (const kind of ['suspicious', 'malicious', 'clear'] as const) ids[kind] = (await createLink(api, FIXTURES[kind])).public_id;
  });

  test('heuristic verdicts: UNKNOWN, SUSPICIOUS (signals), MALICIOUS (blocklist)', async () => {
    expect(await settledSecurity(api, ids.unknown)).toBe('UNKNOWN');
    expect(await settledSecurity(api, ids.suspicious)).toBe('SUSPICIOUS');
    expect(await settledSecurity(api, ids.malicious)).toBe('MALICIOUS');
    const sus = (await api.get(`/links/${ids.suspicious}/security`)).body.data as { signals?: string[]; status: string };
    expect(sus.status).toBe('SUSPICIOUS');
    await settledSecurity(api, ids.clear);
    markClear(ids.clear);
    expect(((await api.get(`/links/${ids.clear}`)).body.data as LinkBody).security.status).toBe('CLEAR');
  });

  test('backend enforcement: only CLEAR can be published or shared; MALICIOUS cannot be opened', async () => {
    for (const kind of ['unknown', 'suspicious', 'malicious'] as const) {
      const link = (await api.get(`/links/${ids[kind]}`)).body.data as LinkBody;
      expect(link.permissions, kind).toMatchObject({ can_publish: false, can_share: false });
      const pub = await api.patch(`/links/${ids[kind]}/visibility`, { visibility: 'PUBLIC' });
      expect(pub.status, kind).toBe(422);
      expect(pub.body.code, kind).toBe('LINK_NOT_PUBLISHABLE');
      const inv = await api.post(`/links/${ids[kind]}/invitations`, { email: `nobody_${kind}@e2e.example.com` });
      expect(inv.status, kind).toBe(422);
      expect(inv.body.code, kind).toBe('LINK_NOT_SHAREABLE');
    }
    const blocked = await api.get(`/links/${ids.malicious}/open`);
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('LINK_SECURITY_BLOCKED');
    for (const kind of ['unknown', 'suspicious'] as const) {
      const open = await api.get(`/links/${ids[kind]}/open`);
      expect(open.status, kind).toBe(200);
      expect((open.body.data as { warning: boolean }).warning, kind).toBe(true);
    }

    const clear = (await api.get(`/links/${ids.clear}`)).body.data as LinkBody;
    expect(clear.permissions).toMatchObject({ can_publish: true, can_share: true });
    const open = await api.get(`/links/${ids.clear}/open`);
    expect((open.body.data as { warning: boolean }).warning).toBe(false);
  });

  test('UI: UNKNOWN is "Not verified", explains the restriction and opens only through a warning', async () => {
    await page.goto(`/en/dashboard/links/${ids.unknown}`);
    await expect(page.getByTestId('security-state')).toContainText('Not verified');
    await page.getByRole('button', { name: /^Open/ }).first().click();
    const dialog = page.getByRole('alertdialog').or(page.getByRole('dialog'));
    await expect(dialog.getByText('Open with caution')).toBeVisible();
    await dialog.getByRole('button', { name: 'Stay here' }).click();

    await page.getByRole('tab', { name: 'Sharing' }).click();
    await expect(page.getByRole('switch', { name: 'Make this link public' })).toBeDisabled();
    await expect(page.getByPlaceholder('name@example.com')).toBeDisabled();
    await expect(page.getByText(/couldn't be verified/).first()).toBeVisible();
  });

  test('UI: SUSPICIOUS shows the verdict, blocks publishing and accepts a review request', async () => {
    await page.goto(`/en/dashboard/links/${ids.suspicious}?tab=security`);
    await expect(page.getByTestId('security-state')).toContainText('Suspicious');
    await expect(page.getByText(/shows warning signs/).first()).toBeVisible();
    await page.getByLabel('Reason').fill('This is my own test domain used by the end-to-end suite.');
    await page.getByRole('button', { name: 'Submit review request' }).click();
    await expect(page.getByText('Your review request has been submitted.')).toBeVisible();
    await expect(page.getByText('Pending review').first()).toBeVisible();
    await page.getByRole('tab', { name: 'Sharing' }).click();
    await expect(page.getByRole('switch', { name: 'Make this link public' })).toBeDisabled();
  });

  test('UI: MALICIOUS cannot be opened, published or shared', async () => {
    await page.goto(`/en/dashboard/links/${ids.malicious}`);
    await expect(page.getByTestId('security-state')).toContainText('Dangerous');
    await expect(page.getByRole('link', { name: /^Open/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Open/ })).toHaveCount(0);
    await page.getByRole('tab', { name: 'Sharing' }).click();
    await expect(page.getByRole('switch', { name: 'Make this link public' })).toBeDisabled();
    await expect(page.getByPlaceholder('name@example.com')).toBeDisabled();
  });

  test('UI: CLEAR ("No threats found") can be published; status never says "safe"', async () => {
    await page.goto(`/en/dashboard/links/${ids.clear}?tab=sharing`);
    await expect(page.getByTestId('security-state')).toContainText('No threats found');
    const publish = page.getByRole('switch', { name: 'Make this link public' });
    await expect(publish).toBeEnabled();
    await publish.click();
    await expect(page.getByText('Visibility updated.')).toBeVisible();
    await expect(publish).toHaveAttribute('aria-checked', 'true');
    expect(((await api.get(`/links/${ids.clear}`)).body.data as LinkBody).visibility).toBe('PUBLIC');
    // The public page is reachable anonymously.
    const anon = await page.context().browser()!.newContext();
    const res = await anon.request.get(`${process.env.E2E_API_URL ?? 'http://localhost:8000'}/api/v1/public/links/${ids.clear}`, { headers: { Accept: 'application/json' } });
    expect(res.status()).toBe(200);
    await anon.close();
    await page.getByRole('tab', { name: 'Security' }).click();
    await expect(page.getByText(/doesn't guarantee the site is safe/)).toBeVisible();
    // The verdict label itself never claims safety.
    await expect(page.getByTestId('security-state')).not.toContainText(/safe/i);
  });

  test('rescan is queued by the backend and re-evaluates the verdict', async () => {
    await page.goto(`/en/dashboard/links/${ids.unknown}?tab=security`);
    await page.getByRole('button', { name: 'Rescan now' }).click();
    await expect(page.getByText('A security re-scan has been queued.')).toBeVisible();
    expect(await settledSecurity(api, ids.unknown)).toBe('UNKNOWN');
    const history = (await api.get(`/links/${ids.unknown}/security`)).body.data as { history?: unknown[]; scans?: unknown[] };
    expect((history.history ?? history.scans ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
