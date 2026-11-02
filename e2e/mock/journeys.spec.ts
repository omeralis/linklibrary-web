import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { PASSWORD, invitationToken, login, logout, resetApi, verificationQuery, watchConsole } from './helpers';

/**
 * Core user journeys from the brief, in order, sharing one browser session like a real user:
 * register → verify → log in → save → processing → edit → collection → share → accept → search →
 * explore → profile → log out.
 */
test.describe.serial('core user journeys', () => {
  let context: BrowserContext;
  let page: Page;
  let problems: string[];
  let linkUrl = '';

  test.beforeAll(async ({ browser }) => {
    await resetApi();
    context = await browser.newContext();
    page = await context.newPage();
    problems = watchConsole(page);
  });
  test.afterAll(async () => {
    expect(problems, problems.join('\n')).toEqual([]);
    await context.close();
  });

  test('1. register, verify the e-mail link, log out and log back in', async () => {
    await page.goto('/en/register');
    await page.getByLabel('Full name').fill('Alice Example');
    await page.getByLabel('Username').fill('alice');
    await page.getByLabel('E-mail').fill('alice@example.com');
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByLabel('Confirm password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/en\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Alice Example' })).toBeVisible();
    await expect(page.getByText(/Verify .*alice@example.com/)).toBeVisible();

    // E-mail links have no locale prefix: the proxy must redirect them.
    await page.goto(`/verify-email?${await verificationQuery('alice@example.com')}`);
    await expect(page).toHaveURL(/\/(en|ar)\/verify-email\?/);
    await expect(page.getByRole('heading', { name: /E-mail verified|تم تأكيد/ })).toBeVisible();

    await page.goto('/en/dashboard');
    await expect(page.getByText(/Verify .*alice@example.com/)).toHaveCount(0);
    await logout(page);
    await login(page, 'alice@example.com');
  });

  test('2. save a link and 3. watch its processing status', async () => {
    await page.getByRole('button', { name: 'Add link' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Web address').fill('docs.example.com/guide');
    await dialog.getByRole('button', { name: 'Save link' }).click();
    await expect(page.getByText('Link saved')).toBeVisible();

    await page.goto('/en/dashboard/links');
    await page.getByRole('link', { name: 'docs.example.com', exact: true }).first().click();
    await expect(page).toHaveURL(/\/en\/dashboard\/links\/[0-9a-f-]{36}$/);
    linkUrl = page.url();
    // PENDING → PROCESSING → COMPLETED via GET /links/{id}/processing-status polling.
    await expect(page.getByRole('status').filter({ hasText: /Processing this link|Queued|Processing/ }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Page at docs.example.com' })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText('Ready', { exact: true })).toBeVisible();
    await expect(page.getByText('No threats found').first()).toBeVisible();
  });

  test('4. edit link metadata (manual override)', async () => {
    await page.getByRole('tab', { name: 'Edit' }).click();
    await page.getByLabel('Title', { exact: true }).fill('Example Guide');
    await page.getByLabel('Private notes').fill('Read before Monday');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Changes saved.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Example Guide' })).toBeVisible();
  });

  test('5. create a collection and 6. add the link to it', async () => {
    await page.goto('/en/dashboard/collections');
    await page.getByRole('button', { name: 'New collection' }).first().click();
    await page.getByRole('dialog').getByLabel('Name').fill('Reading list');
    await page.getByRole('dialog').getByRole('button', { name: 'Create collection' }).click();
    await expect(page).toHaveURL(/\/en\/dashboard\/collections\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { name: 'Reading list' })).toBeVisible();

    await page.getByRole('button', { name: 'Add links' }).first().click();
    await page.getByRole('dialog').getByText('Example Guide').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Add (1)' }).or(page.getByRole('dialog').getByRole('button', { name: 'Add 1' })).click();
    await expect(page.getByText('1 link added.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Example Guide' })).toBeVisible();
  });

  test('7. share a safe private link (and publish it); unverified links stay restricted', async () => {
    await page.goto(`${linkUrl}?tab=sharing`);
    await page.getByPlaceholder('name@example.com').fill('omar@example.com');
    await page.getByRole('button', { name: 'Invite' }).click();
    await expect(page.getByText('Invitation sent.')).toBeVisible();
    await expect(page.getByText('omar@example.com')).toBeVisible();
    await expect(page.getByText('Pending', { exact: true })).toBeVisible();

    const publish = page.getByRole('switch', { name: 'Make this link public' });
    await expect(publish).toBeEnabled();
    await publish.click();
    await expect(page.getByText('Visibility updated.')).toBeVisible();
    await expect(publish).toHaveAttribute('aria-checked', 'true');

    // A link the security providers cannot verify (UNKNOWN) must not be publishable or shareable.
    await page.getByRole('button', { name: 'Add link' }).first().click();
    await page.getByRole('dialog').getByLabel('Web address').fill('https://unknown-site.example.org/');
    await page.getByRole('dialog').getByRole('button', { name: 'Save link' }).click();
    await expect(page.getByText('Link saved')).toBeVisible();
    await page.goto('/en/dashboard/links');
    await page.getByRole('link', { name: 'unknown-site.example.org', exact: true }).first().click();
    await expect(page.getByText('Not verified').first()).toBeVisible({ timeout: 25_000 });
    await page.getByRole('tab', { name: 'Sharing' }).click();
    await expect(page.getByRole('switch', { name: 'Make this link public' })).toBeDisabled();
    await expect(page.getByPlaceholder('name@example.com')).toBeDisabled();
    await expect(page.getByText(/couldn't be verified by a security provider/).first()).toBeVisible();
  });

  test('8. accept an invitation as the recipient', async () => {
    const token = await invitationToken('omar@example.com');
    await logout(page);
    await page.goto(`/en/invitations/accept?token=${token}`);
    await expect(page.getByRole('link', { name: 'Sign in to accept' })).toBeVisible();
    await page.getByRole('link', { name: 'Sign in to accept' }).click();
    await page.getByLabel('E-mail').fill('omar@example.com');
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/invitations\/accept\?token=/);
    await page.getByRole('button', { name: 'Accept invitation' }).click();
    await expect(page).toHaveURL(/\/en\/l\/[0-9a-f-]{36}$/);
    await expect(page.getByText('Shared with you by Alice Example')).toBeVisible();
    await expect(page.getByText('You have read-only access.')).toBeVisible();
    // Notes are owner-only and must never reach a viewer.
    await expect(page.getByText('Read before Monday')).toHaveCount(0);

    await page.goto('/en/dashboard/shared');
    await expect(page.getByRole('link', { name: 'Example Guide' })).toBeVisible();
    await logout(page);
  });

  test('9. search the library (and the command palette)', async () => {
    await login(page, 'alice@example.com');
    await expect(page.getByRole('button', { name: 'Notifications, 1 unread' })).toBeVisible();
    await page.goto('/en/dashboard/search');
    await page.getByPlaceholder(/Search by words/).fill('guide');
    await expect(page.getByText('1 result')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Example Guide' })).toBeVisible();

    await page.keyboard.press('Control+k');
    await page.getByPlaceholder('Search links, collections or pages…').fill('reading');
    await expect(page.getByRole('option', { name: /Reading list/ })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('10. explore public links (server-rendered) and open the public page', async () => {
    // Public listings are ISR-cached for 30 s (matching the API's Cache-Control), so a freshly published
    // link can take up to one revalidation window to appear.
    await expect(async () => {
      await page.goto('/en/explore');
      await expect(page.getByRole('heading', { level: 1, name: 'Explore' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Example Guide' })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 50_000, intervals: [2_000, 5_000] });
    await page.getByRole('searchbox', { name: /Search public links/ }).fill('guide');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page).toHaveURL(/q=guide/);
    await expect(page.getByText('1 public link')).toBeVisible();
    await page.getByRole('link', { name: 'Example Guide' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Example Guide' })).toBeVisible();
  });

  test('11. update the profile', async () => {
    await page.goto('/en/dashboard/settings');
    await page.getByLabel('Name', { exact: true }).fill('Alice Updated');
    await page.getByLabel('Bio').fill('Curating good links.');
    await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByText('Profile updated.')).toBeVisible();
    await page.getByRole('button', { name: 'Account menu' }).click();
    await expect(page.getByRole('menu').getByText('Alice Updated')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('12. log out; protected routes then redirect to sign-in', async () => {
    await logout(page);
    await page.goto('/en/dashboard/links');
    await expect(page).toHaveURL(/\/en\/login\?next=%2Fdashboard%2Flinks/);
  });
});
