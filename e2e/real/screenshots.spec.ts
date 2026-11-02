import { test, expect } from '@playwright/test';
import { createLink, deleteAccount, markClear, newUser, runId, seededUser, waitProcessed } from './support';

/** Opt-in visual review (E2E_SCREENSHOTS=1): library, link detail and sharing with real data. */
test.skip(!process.env.E2E_SCREENSHOTS, 'set E2E_SCREENSHOTS=1');
const user = newUser('shots');

test('visual review screenshots', async ({ page }) => {
  test.setTimeout(600_000);
  const api = await seededUser(page, user);
  const dir = 'test-results/real/screenshots';
  try {
    const real = (await createLink(api, process.env.E2E_SHOTS_URL ?? 'https://pypi.org/project/urllib3/', { tags: ['python', 'http'], notes: 'Use for the API client.' })).public_id;
    const unknown = (await createLink(api, `https://unknown-${runId}.e2e-fixture.example.org/`, { custom_title: 'Team handbook draft' })).public_id;
    await createLink(api, `https://a.b.c.d.e.sus-${runId}.example.org/login`, { custom_title: 'Suspicious login page' });
    await waitProcessed(api, real, 60_000);
    markClear(real);
    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      for (const locale of ['en', 'ar'] as const) {
        for (const [name, path] of [
          ['library', '/dashboard/links'],
          ['detail', `/dashboard/links/${real}`],
          ['detail-unknown', `/dashboard/links/${unknown}`],
          ['sharing-unknown', `/dashboard/links/${unknown}?tab=sharing`],
          ['sharing-clear', `/dashboard/links/${real}?tab=sharing`],
        ] as const) {
          await page.goto(`/${locale}${path}`);
          await expect(page.locator('main')).toBeVisible();
          await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 15_000 });
          await page.waitForTimeout(600);
          await page.screenshot({ path: `${dir}/${name}-${locale}-${theme}.png`, fullPage: true });
          await page.waitForTimeout(1500);
        }
      }
    }
    await page.setViewportSize({ width: 412, height: 915 });
    for (const [name, path] of [['m-library', '/ar/dashboard/links'], ['m-detail', `/ar/dashboard/links/${real}`], ['m-detail-en', `/en/dashboard/links/${real}`]] as const) {
      await page.goto(path);
      await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 15_000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    }
  } finally {
    await deleteAccount(page.context(), user);
  }
});
