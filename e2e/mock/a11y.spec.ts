import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login, resetApi } from './helpers';

test.beforeAll(resetApi);

async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const report = serious.map((v) => `${label}: [${v.impact}] ${v.id} — ${v.help}\n  ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n  ')}`).join('\n');
  expect(serious, report).toEqual([]);
}

for (const locale of ['en', 'ar'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`public pages have no serious a11y violations (${locale}, ${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      for (const path of ['', '/explore', '/login', '/register', '/about', '/privacy']) {
        await page.goto(`/${locale}${path}`);
        await page.waitForLoadState('networkidle');
        await audit(page, `/${locale}${path} ${theme}`);
      }
    });
  }
}

test('dashboard pages have no serious a11y violations', async ({ page }) => {
  await login(page, 'demo@linklibrary.test');
  for (const path of ['/dashboard', '/dashboard/links', '/dashboard/collections', '/dashboard/shared', '/dashboard/search', '/dashboard/notifications', '/dashboard/settings']) {
    await page.goto(`/en${path}`);
    await page.waitForLoadState('networkidle');
    await audit(page, path);
  }
});

test('keyboard: skip link and dialog focus management', async ({ page }) => {
  await page.goto('/en');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await login(page, 'demo@linklibrary.test');
  await page.getByRole('button', { name: 'Add link' }).first().click();
  await expect(page.getByRole('dialog').getByLabel('Web address')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
