import { test, expect } from '@playwright/test';
import { login, resetApi, watchConsole } from './helpers';

test.beforeAll(resetApi);

test('Arabic is RTL and English is LTR, with localized metadata', async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto('/ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page).toHaveTitle(/روابطك منظّمة/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('مكان هادئ');
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);

  await page.goto('/en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page).toHaveTitle(/Your links, organized/);
  expect(problems).toEqual([]);
});

test('language switcher keeps the page and persists the choice', async ({ page, context }) => {
  await page.goto('/en/explore?sort=popular');
  await page.getByRole('button', { name: 'Language' }).first().click();
  await page.getByRole('menuitemradio', { name: 'العربية' }).click();
  await expect(page).toHaveURL(/\/ar\/explore\?sort=popular/);
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const cookie = (await context.cookies()).find((c) => c.name === 'NEXT_LOCALE');
  expect(cookie?.value).toBe('ar');
  // Unprefixed URLs now resolve to the saved locale.
  await page.goto('/about');
  await expect(page).toHaveURL(/\/ar\/about$/);
});

test('RTL dashboard: sidebar on the right, mirrored navigation', async ({ page }) => {
  await login(page, 'demo@linklibrary.test', undefined, 'ar');
  await page.goto('/ar/dashboard');
  const sidebar = page.locator('aside').first();
  await expect(sidebar).toBeVisible();
  const box = (await sidebar.boundingBox())!;
  const width = page.viewportSize()!.width;
  expect(box.x).toBeGreaterThan(width / 2);
  await expect(page.getByRole('navigation', { name: 'لوحة التحكم' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'مكتبتي' })).toBeVisible();

  await page.goto('/en/dashboard');
  const ltrBox = (await page.locator('aside').first().boundingBox())!;
  expect(ltrBox.x).toBeLessThan(10);
});

test('validation messages and API errors are localized', async ({ page }) => {
  await page.goto('/ar/login');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await expect(page.getByText('هذا الحقل مطلوب.').first()).toBeVisible();
  await page.getByLabel('البريد الإلكتروني').fill('nobody@example.com');
  await page.getByLabel('كلمة المرور', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  // The message comes from the API (localized by Accept-Language in the real backend).
  await expect(page.getByText(/These credentials|بيانات الاعتماد/)).toBeVisible();
});
