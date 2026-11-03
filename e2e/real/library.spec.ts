import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { API, Api, createLink, deleteAccount, markClear, newUser, runId, seededUser } from './support';

/**
 * Collections, search (English + Arabic), public pages, profile and admin authorization — all against
 * the real API with one owner, one admin and one ordinary outsider.
 */
const owner = newUser('lib');
const admin = newUser('adm');

interface Coll {
  public_id: string;
  name: string;
  items_count: number | null;
  visibility: string;
  items?: { public_id: string }[];
}

test.describe.serial('real API — collections, search, public pages, admin', () => {
  let ctx: BrowserContext;
  let page: Page;
  let api: Api;
  const links: Record<'en1' | 'en2' | 'ar' | 'priv', string> = { en1: '', en2: '', ar: '', priv: '' };
  let collectionId = '';
  const T = {
    en1: `Gardening handbook ${runId}`,
    en2: `Compost basics ${runId}`,
    ar: `دليل المكتبة العربية ${runId}`,
    priv: `Private diary ${runId}`,
  };

  test.beforeAll(async ({ browser }) => {
    ctx = await browser.newContext();
    page = await ctx.newPage();
    api = await seededUser(page, owner);
    links.en1 = (await createLink(api, `https://garden-${runId}.e2e-fixture.example.org/handbook`, { custom_title: T.en1, tags: ['garden'] })).public_id;
    links.en2 = (await createLink(api, `https://compost-${runId}.e2e-fixture.example.org/`, { custom_title: T.en2, tags: ['garden'] })).public_id;
    links.ar = (
      await createLink(api, `https://arabic-${runId}.e2e-fixture.example.org/`, { custom_title: T.ar, custom_description: 'مقالة عن المكتبات' })
    ).public_id;
    links.priv = (await createLink(api, `https://diary-${runId}.e2e-fixture.example.org/`, { custom_title: T.priv })).public_id;
    for (const id of Object.values(links)) {
      await expect
        .poll(async () => ((await api.get(`/links/${id}`)).body.data as { security: { status: string } }).security.status, { timeout: 30_000 })
        .not.toBe('PENDING');
    }
    for (const id of [links.en1, links.en2, links.ar]) markClear(id);
  });
  test.afterAll(async () => {
    await deleteAccount(ctx, owner);
    await ctx.close();
  });

  test('collections: create, add links, counts, keyboard reorder, remove, edit', async () => {
    await page.goto('/en/dashboard/collections');
    await page.getByRole('button', { name: 'New collection' }).first().click();
    await page.getByRole('dialog').getByLabel('Name').fill(`Garden ${runId}`);
    await page.getByRole('dialog').getByRole('button', { name: 'Create collection' }).click();
    await expect(page).toHaveURL(/\/en\/dashboard\/collections\/[0-9a-f-]{36}$/);
    collectionId = page.url().split('/').at(-1)!;
    await expect(page.getByText('This collection is empty')).toBeVisible();

    await page.getByRole('button', { name: 'Add links' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByText(T.en1).click();
    await dialog.getByText(T.en2).click();
    await dialog.getByText(T.priv).click();
    await dialog.getByRole('button', { name: 'Add 3' }).click();
    await expect(page.getByText('3 links added.')).toBeVisible();

    let c = (await api.get(`/collections/${collectionId}`)).body.data as Coll;
    expect(c.items_count).toBe(3);
    const before = c.items!.map((i) => i.public_id);

    // Keyboard reordering (dnd-kit): focus the first handle, Space, ArrowDown, Space.
    const firstTitle = before[0] === links.en1 ? T.en1 : before[0] === links.en2 ? T.en2 : T.priv;
    const handle = page.getByRole('button', { name: `Reorder ${firstTitle}` });
    await expect(handle).toBeVisible();
    await handle.focus();
    await expect(handle).toBeFocused();
    // dnd-kit's keyboard sensor: pick up, move one slot, drop (short pauses let it measure the list).
    await page.keyboard.press('Space');
    await page.waitForTimeout(250);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(250);
    await page.keyboard.press('Space');
    await expect(page.getByText('Order saved.')).toBeVisible();
    c = (await api.get(`/collections/${collectionId}`)).body.data as Coll;
    expect(c.items!.map((i) => i.public_id)).toEqual([before[1], before[0], before[2]]);

    await page.getByRole('button', { name: `Remove ${T.en2} from this collection` }).click();
    await expect(page.getByText('Removed from the collection.')).toBeVisible();
    await expect.poll(async () => ((await api.get(`/collections/${collectionId}`)).body.data as Coll).items_count).toBe(2);
    // Removing from a collection never deletes the link itself.
    expect((await api.get(`/links/${links.en2}`)).status).toBe(200);

    await page.goto('/en/dashboard/collections');
    await expect(
      page
        .getByRole('article')
        .filter({ hasText: `Garden ${runId}` })
        .getByText('2 links'),
    ).toBeVisible();
  });

  test('public collection shows only public links; private collection is 404 for everyone else', async ({ browser }) => {
    const anonCtx = await browser.newContext();
    const anon = anonCtx.request;
    expect((await anon.get(`${API}/api/v1/public/collections/${collectionId}`, { headers: { Accept: 'application/json' } })).status()).toBe(404);

    expect((await api.patch(`/collections/${collectionId}`, { visibility: 'PUBLIC' })).status).toBe(200);
    expect((await api.patch(`/links/${links.en1}/visibility`, { visibility: 'PUBLIC' })).status).toBe(200);
    // The private diary stays private and must not leak through the public collection.
    const res = await anon.get(`${API}/api/v1/public/collections/${collectionId}`, { headers: { Accept: 'application/json' } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const ids = (body.data as { public_id: string }[]).map((l) => l.public_id);
    expect(ids).toEqual([links.en1]);
    expect(JSON.stringify(body)).not.toContain(T.priv);

    const anonPage = await anonCtx.newPage();
    await anonPage.goto(`/en/c/${collectionId}`);
    await expect(anonPage.getByRole('heading', { level: 1, name: `Garden ${runId}` })).toBeVisible();
    await expect(anonPage.getByRole('link', { name: T.en1 })).toBeVisible();
    await expect(anonPage.getByText(T.priv)).toHaveCount(0);

    // Public link page and owner profile (SSR, anonymous).
    await anonPage.goto(`/en/l/${links.en1}`);
    await expect(anonPage.getByRole('heading', { level: 1, name: T.en1 })).toBeVisible();
    await expect(anonPage.getByText('No threats found').first()).toBeVisible();
    await anonPage.goto(`/en/u/${owner.username}`);
    await expect(anonPage.getByRole('heading', { name: owner.name })).toBeVisible();
    await expect(anonPage.getByRole('link', { name: T.en1 })).toBeVisible();
    await expect(anonPage.getByText(T.priv)).toHaveCount(0);
    // A private link is not reachable publicly.
    expect((await anon.get(`${API}/api/v1/public/links/${links.priv}`, { headers: { Accept: 'application/json' } })).status()).toBe(404);
    await anonCtx.close();
  });

  test('library search in English and Arabic (with letter-form folding)', async () => {
    await expect
      .poll(async () => ((await api.get(`/search?q=${encodeURIComponent('handbook ' + runId)}&type=links`)).body.data as unknown[]).length, { timeout: 20_000 })
      .toBe(1);

    await page.goto('/en/dashboard/search');
    await page.getByPlaceholder(/Search by words/).fill(`handbook ${runId}`);
    await expect(page.getByText('1 result')).toBeVisible();
    await expect(page.getByRole('link', { name: T.en1 })).toBeVisible();

    // "المكتبه" (hā') must match "المكتبة" (tā' marbūṭa); "العربيه" likewise.
    await page.getByPlaceholder(/Search by words/).fill(`المكتبه العربيه ${runId}`);
    await expect(page.getByText('1 result')).toBeVisible();
    await expect(page.getByRole('link', { name: T.ar })).toBeVisible();

    await page.getByPlaceholder(/Search by words/).fill(`nothing-matches-${runId}`);
    await expect(page.getByText('No results')).toBeVisible();

    // Arabic UI: same search, RTL document.
    await page.goto(`/ar/dashboard/search?q=${encodeURIComponent('المكتبه ' + runId)}`);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('link', { name: T.ar })).toBeVisible();
  });

  test('explore search finds published links (public FTS)', async ({ browser }) => {
    const anonCtx = await browser.newContext();
    const anonPage = await anonCtx.newPage();
    await expect
      .poll(
        async () => {
          const r = await anonCtx.request.get(`${API}/api/v1/public/search?q=${encodeURIComponent('gardening ' + runId)}`, {
            headers: { Accept: 'application/json' },
          });
          return ((await r.json()).data as unknown[]).length;
        },
        { timeout: 45_000 },
      )
      .toBe(1);
    await anonPage.goto(`/en/explore?q=${encodeURIComponent('gardening ' + runId)}`);
    await expect(anonPage.getByRole('link', { name: T.en1 })).toBeVisible();
    await anonCtx.close();
  });

  test('profile settings update and public profile toggle', async ({ browser }) => {
    await page.goto('/en/dashboard/settings');
    await page.getByLabel('Bio').fill(`Gardener ${runId}`);
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Profile updated.')).toBeVisible();
    const me = (await api.get('/me')).body.data as { bio: string };
    expect(me.bio).toBe(`Gardener ${runId}`);

    expect((await api.patch('/me', { profile_public: false })).status).toBe(200);
    const anonCtx = await browser.newContext();
    const r = await anonCtx.request.get(`${API}/api/v1/public/users/${owner.username}`, { headers: { Accept: 'application/json' } });
    expect(r.status()).toBe(404);
    await anonCtx.close();
    expect((await api.patch('/me', { profile_public: true })).status).toBe(200);
  });

  test('admin area: ordinary users are refused by the API and the UI; admins can use it', async ({ browser }) => {
    for (const path of ['/admin/security/appeals', '/admin/categories', '/admin/audit-logs']) {
      expect((await api.get(path)).status, path).toBe(403);
    }
    await page.goto('/en/dashboard/admin');
    await expect(page.getByRole('heading', { name: 'Administrators only' })).toBeVisible();

    const actx = await browser.newContext();
    const apage = await actx.newPage();
    const aapi = await seededUser(apage, admin, 'ADMIN');
    try {
      expect((await aapi.get('/admin/categories')).status).toBe(200);
      await apage.goto('/en/dashboard/admin');
      await expect(apage.getByRole('heading', { level: 1, name: 'Administration' })).toBeVisible();
      await apage.getByRole('tab', { name: 'Audit log' }).click();
      await expect(apage.getByRole('table')).toBeVisible();
      await apage.getByRole('tab', { name: 'Categories' }).click();
      await expect(apage.getByRole('table')).toBeVisible();
    } finally {
      await deleteAccount(actx, admin);
      await actx.close();
    }
  });

  test('deleting a collection keeps its links', async () => {
    await page.goto(`/en/dashboard/collections/${collectionId}`);
    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete collection' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /Delete/ })
      .click();
    await expect(page.getByText('Collection deleted.')).toBeVisible();
    expect((await api.get(`/collections/${collectionId}`)).status).toBe(404);
    expect((await api.get(`/links/${links.en1}`)).status).toBe(200);
  });
});
