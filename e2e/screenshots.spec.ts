import { test } from '@playwright/test';
import { login, resetApi } from './helpers';

/** Captures reference screenshots (light/dark, ar/en, desktop) into test-results/screens for visual review. */
test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to capture');

test('capture key screens', async ({ page }) => {
  await resetApi();
  const shot = (name: string) => page.screenshot({ path: `test-results/screens/${name}.png`, fullPage: true });
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme });
    for (const locale of ['en', 'ar']) {
      await page.goto(`/${locale}`);
      await shot(`landing-${locale}-${theme}`);
      await page.goto(`/${locale}/login`);
      await shot(`login-${locale}-${theme}`);
    }
  }
  await page.emulateMedia({ colorScheme: 'light' });
  await login(page, 'demo@linklibrary.test');
  await page.getByRole('button', { name: 'Add link' }).first().click();
  await page.getByRole('dialog').getByLabel('Web address').fill('docs.example.com/guide');
  await page.getByRole('dialog').getByRole('button', { name: 'Save link' }).click();
  await page.waitForTimeout(500);
  await page.goto('/en/dashboard');
  await page.waitForTimeout(8000);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await shot('dashboard-en');
  await page.goto('/en/dashboard/links');
  await page.waitForLoadState('networkidle');
  await shot('library-en');
  await page.getByRole('link', { name: /docs.example.com|Page at/ }).first().click();
  await page.waitForLoadState('networkidle');
  await shot('link-detail-en');
  await page.getByRole('tab', { name: 'Sharing' }).click();
  await shot('link-sharing-en');
  await page.goto('/ar/dashboard');
  await page.waitForLoadState('networkidle');
  await shot('dashboard-ar');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/ar/dashboard/links');
  await page.waitForLoadState('networkidle');
  await shot('library-ar-dark');
  await page.goto('/en/explore');
  await shot('explore-en');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ar/dashboard');
  await page.waitForLoadState('networkidle');
  await shot('dashboard-ar-mobile');
  await page.goto('/ar');
  await shot('landing-ar-mobile');
});
