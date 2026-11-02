import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { Api, createLink, deleteAccount, newUser, seededUser, waitProcessed } from './support';

/**
 * Link management against the real API. Extraction uses a real public page reachable from the test
 * machine (E2E_EXTRACT_URL, default a PyPI project page) and a host that cannot resolve (failure path).
 */
const EXTRACT_URL = process.env.E2E_EXTRACT_URL ?? 'https://pypi.org/project/requests/';
const owner = newUser('links');

test.describe.serial('real API — link management', () => {
  let ctx: BrowserContext;
  let page: Page;
  let api: Api;
  let extractedId = '';
  let failingId = '';

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    page = await ctx.newPage();
    api = await seededUser(page, owner);
    await page.goto('/en/dashboard');
  });
  test.afterAll(async () => {
    await deleteAccount(ctx, owner);
    await ctx.close();
  });

  test('create a link through the UI; canonical normalisation and duplicate detection', async () => {
    await page.getByRole('button', { name: 'Add link' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Web address').fill(EXTRACT_URL.replace('https://pypi.org', 'HTTPS://PyPI.ORG') + '#history');
    await dialog.getByRole('button', { name: 'Save link' }).click();
    await expect(page.getByText('Link saved', { exact: true })).toBeVisible();

    const list = await api.get('/links?per_page=50');
    const items = list.body.data as { public_id: string; hostname: string; url: string }[];
    expect(items).toHaveLength(1);
    expect(items[0].hostname).toBe('pypi.org'); // host lower-cased by the backend normaliser
    extractedId = items[0].public_id;

    // Same resource with different case/fragment → duplicate.
    await page.getByRole('button', { name: 'Add link' }).first().click();
    await page.getByRole('dialog').getByLabel('Web address').fill(EXTRACT_URL);
    await page.getByRole('dialog').getByRole('button', { name: 'Save link' }).click();
    await expect(page.getByText("You've already saved this link.")).toBeVisible();
    expect(((await api.get('/links')).body.data as unknown[]).length).toBe(1);
  });

  test('URL validation errors from the backend are shown on the field', async () => {
    await page.getByRole('button', { name: 'Add link' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Web address').fill('http://127.0.0.1/admin');
    await dialog.getByRole('button', { name: 'Save link' }).click();
    await expect(dialog.getByText(/not allowed/i)).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('processing status is polled until metadata extraction settles', async () => {
    await page.goto(`/en/dashboard/links/${extractedId}`);
    const status = await waitProcessed(api, extractedId, 60_000);
    expect(['COMPLETED', 'PARTIAL']).toContain(status);
    // The page refreshes itself (no reload): extracted title replaces the hostname.
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('pypi.org', { timeout: 20_000 });
    const link = (await api.get(`/links/${extractedId}`)).body.data as { title: string; extracted: { title: string }; security: { status: string } };
    expect(link.extracted.title).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(link.title);
    // Ready ≠ safe: with only the heuristic provider the verdict stays UNKNOWN and the page says so.
    expect(link.security.status).toBe('UNKNOWN');
    await expect(page.getByTestId('processing-state')).toContainText(/Ready|Partial/);
    await expect(page.getByTestId('security-state')).toContainText('Not verified');
  });

  test('extraction failure is explained and can be retried', async () => {
    const link = await createLink(api, 'https://does-not-exist-e2e.example.org/page');
    failingId = link.public_id;
    await page.goto(`/en/dashboard/links/${failingId}`);
    // The backend retries unreachable sites with back-off; the UI must say it is retrying, not hang silently.
    await expect(page.getByText(/Still trying to reach this page|We couldn't fetch/).first()).toBeVisible({ timeout: 30_000 });
    const res = await api.post(`/links/${failingId}/reanalyze`);
    expect(res.status).toBe(202);
  });

  test('edit title and description (overrides) and restore the original', async () => {
    await page.goto(`/en/dashboard/links/${extractedId}?tab=edit`);
    await page.getByLabel('Title', { exact: true }).fill('Requests — HTTP for Humans');
    await page.getByLabel('Description').fill('My own description.');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Changes saved.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Requests — HTTP for Humans');
    let body = (await api.get(`/links/${extractedId}`)).body.data as { overrides: { title: string; description: string } };
    expect(body.overrides).toMatchObject({ title: 'Requests — HTTP for Humans', description: 'My own description.' });

    await page.getByRole('button', { name: 'Use original' }).first().click();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Changes saved.')).toBeVisible();
    body = (await api.get(`/links/${extractedId}`)).body.data as { overrides: { title: string; description: string } };
    expect(body.overrides.title).toBeNull();
  });

  test('add and remove tags; toggle favorite', async () => {
    await page.goto(`/en/dashboard/links/${extractedId}`);
    await page.getByPlaceholder('New tag').fill('python');
    await page.getByRole('button', { name: 'Add tag' }).click();
    await expect(page.getByText('#python')).toBeVisible();
    await page.getByRole('button', { name: 'Remove tag python' }).click();
    await expect(page.getByText('#python')).toHaveCount(0);

    await page.getByRole('button', { name: 'Add to favorites' }).click();
    await expect(page.getByRole('button', { name: 'Remove from favorites' })).toBeVisible();
    await expect.poll(async () => ((await api.get(`/links/${extractedId}`)).body.data as { is_favorite: boolean }).is_favorite).toBe(true);
    await page.goto('/en/dashboard/favorites');
    await expect(page.getByRole('article')).toHaveCount(1);
  });

  test('trash, restore and permanent deletion', async () => {
    await page.goto('/en/dashboard/links');
    const card = page.getByRole('article').filter({ hasText: 'does-not-exist-e2e.example.org' });
    await card.getByRole('button', { name: /^Actions for/ }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Link moved to the trash.')).toBeVisible();
    await expect(card).toHaveCount(0);

    await page.getByRole('button', { name: 'Trash' }).click();
    // Only the trashed link may be listed under Trash (never the previous view's items as placeholder).
    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(page.getByRole('article')).toContainText('does-not-exist-e2e.example.org');
    await page.getByRole('article').getByRole('button', { name: /^Actions for/ }).click();
    await page.getByRole('menuitem', { name: 'Restore' }).click();
    await expect(page.getByText('Link restored.')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);

    expect((await api.del(`/links/${failingId}`)).status).toBe(200);
    expect((await api.del(`/links/${failingId}?permanent=1`)).status).toBe(200);
    expect((await api.get(`/links/${failingId}`)).status).toBe(404);
  });

  test('search, filters, sorting and pagination use the API', async ({ browser }) => {
    // A separate user keeps this under the per-user link-create limit (30/min).
    const pager = newUser('pager');
    const pctx = await browser.newContext();
    const ppage = await pctx.newPage();
    const papi = await seededUser(ppage, pager);
    try {
      for (let i = 1; i <= 25; i++) {
        await createLink(papi, `https://pagination-${i}.e2e-fixture.example.org/`, { custom_title: `Fixture ${String(i).padStart(2, '0')}`, tags: i % 2 ? ['odd'] : ['even'] });
      }
      await ppage.goto('/en/dashboard/links');
      await expect(ppage.getByText('Page 1 of 2')).toBeVisible();
      await ppage.getByRole('button', { name: 'Next' }).click();
      await expect(ppage).toHaveURL(/page=2/);
      await expect(ppage.getByText('Page 2 of 2')).toBeVisible();
      await expect(ppage.getByRole('article')).toHaveCount(1);

      await ppage.getByRole('searchbox').fill('Fixture 07');
      await expect(ppage).toHaveURL(/q=Fixture(\+|%20)07/);
      await expect(ppage.getByRole('article')).toHaveCount(1);
      await expect(ppage.getByRole('link', { name: 'Fixture 07' })).toBeVisible();

      await ppage.goto('/en/dashboard/links?tag=even&sort=title');
      await expect(ppage.getByRole('article')).toHaveCount(12);
      const titles = await ppage.getByRole('article').getByRole('heading').allInnerTexts();
      expect(titles).toEqual([...titles].sort());
    } finally {
      await deleteAccount(pctx, pager);
      await pctx.close();
    }
  });
});
