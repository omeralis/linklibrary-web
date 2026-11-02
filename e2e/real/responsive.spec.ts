import { test, expect, type Page } from '@playwright/test';
import { createLink, deleteAccount, markClear, newUser, pacer, runId, seededUser } from './support';

/** Phone (Pixel 7) and tablet layouts with REAL API data, Arabic (RTL) and English (LTR). */
const user = newUser('resp');

async function noHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${label} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
}

test('dashboard pages fit phone and tablet widths in ar and en', async ({ page }) => {
  test.setTimeout(300_000);
  const api = await seededUser(page, user);
  try {
    const id = (await createLink(api, `https://responsive-${runId}.e2e-fixture.example.org/a/very/long/path/that/should/never/overflow/the/viewport?with=query&and=more`, {
      custom_title: `A deliberately long title to check wrapping on small screens ${runId} — ${'word '.repeat(12)}`,
      tags: ['mobile', 'layout', 'rtl'],
    })).public_id;
    await expect.poll(async () => ((await api.get(`/links/${id}`)).body.data as { security: { status: string } }).security.status, { timeout: 30_000 }).not.toBe('PENDING');
    markClear(id);
    const paths = ['/dashboard', '/dashboard/links', `/dashboard/links/${id}`, `/dashboard/links/${id}?tab=security`, `/dashboard/links/${id}?tab=sharing`, '/dashboard/collections', '/dashboard/search?q=layout', '/dashboard/notifications', '/dashboard/settings', `/l/${id}`];
    const pace = pacer();
    for (const size of [null, { width: 820, height: 1180 }]) {
      if (size) await page.setViewportSize(size);
      for (const locale of ['ar', 'en'] as const) {
        for (const path of paths) {
          await pace();
          await page.goto(`/${locale}${path}`);
          // Pages with links still processing poll every few seconds, so wait for content, not network idle.
          await expect(page.locator('main')).toBeVisible();
          await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 15_000 });
          await expect(page.locator('html')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
          await noHorizontalOverflow(page, `${size ? 'tablet' : 'phone'} /${locale}${path}`);
        }
      }
    }
    // Mobile navigation: the sidebar opens as a sheet from the logical start side.
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/ar/dashboard/links');
    await page.getByRole('button', { name: 'فتح القائمة' }).first().click();
    const nav = page.getByRole('dialog');
    await expect(nav.getByRole('link', { name: 'مكتبتي' })).toBeVisible();
    const box = await nav.boundingBox();
    expect(box!.x + box!.width).toBeGreaterThan(412 - 2); // RTL: anchored to the right edge
  } finally {
    await deleteAccount(page.context(), user);
  }
});
