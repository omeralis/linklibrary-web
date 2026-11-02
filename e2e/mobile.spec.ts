import { test, expect, type Page } from '@playwright/test';
import { login, resetApi } from './helpers';

test.beforeAll(resetApi);

async function noHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${label} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
}

test('public pages fit a phone screen and the menu works (en + ar)', async ({ page }) => {
  for (const locale of ['en', 'ar']) {
    for (const path of ['', '/explore', '/login', '/register', '/about', '/terms']) {
      await page.goto(`/${locale}${path}`);
      await noHorizontalOverflow(page, `/${locale}${path}`);
    }
  }
  await page.goto('/en');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Explore' }).click();
  await expect(page).toHaveURL(/\/en\/explore/);
});

test('dashboard is usable on a phone', async ({ page }) => {
  await login(page, 'demo@linklibrary.test');
  for (const path of ['/dashboard', '/dashboard/links', '/dashboard/collections', '/dashboard/shared', '/dashboard/search', '/dashboard/settings', '/dashboard/notifications']) {
    await page.goto(`/en${path}`);
    await noHorizontalOverflow(page, path);
  }
  await expect(page.locator('aside')).toBeHidden();
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Collections' }).click();
  await expect(page).toHaveURL(/\/en\/dashboard\/collections/);
  await page.getByRole('button', { name: 'Add link' }).click();
  await expect(page.getByRole('dialog').getByLabel('Web address')).toBeVisible();
});
