import { expect, type Page } from '@playwright/test';

export const API = 'http://localhost:8787';
export const PASSWORD = 'Password12345';

export async function resetApi() {
  await fetch(`${API}/__test/reset`, { method: 'POST' });
}

/** Stand-in for opening the verification e-mail (the mock exposes the signed parameters). */
export async function verificationQuery(email: string): Promise<string> {
  const res = await fetch(`${API}/__test/verification/${encodeURIComponent(email)}`);
  const { data } = await res.json();
  return new URLSearchParams({ id: data.id, hash: data.hash, expires: data.expires, signature: data.signature }).toString();
}

export async function invitationToken(email: string): Promise<string> {
  const res = await fetch(`${API}/__test/invitation/${encodeURIComponent(email)}`);
  const { data } = await res.json();
  return data.token;
}

export async function login(page: Page, email: string, password = PASSWORD, locale = 'en') {
  await page.goto(`/${locale}/login`);
  await page.getByLabel(locale === 'ar' ? 'البريد الإلكتروني' : 'E-mail').fill(email);
  await page.getByLabel(locale === 'ar' ? 'كلمة المرور' : 'Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: locale === 'ar' ? 'تسجيل الدخول' : 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login/);
}

/** Collects console errors and next-intl MISSING_MESSAGE warnings so tests can assert none occurred. */
export function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (/MISSING_MESSAGE|Hydration|hydrat/i.test(text)) problems.push(text);
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message} @ ${page.url()}`));
  return problems;
}
