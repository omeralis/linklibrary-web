import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createLink, deleteAccount, markClear, newUser, pacer, runId, seededUser } from './support';

/** WCAG 2.1 A/AA (axe) on dashboard pages filled with REAL API data, in ar/en × light/dark. */
const user = newUser('a11y');

async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page: page as never }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const report = serious
    .map(
      (v) =>
        `${label}: [${v.impact}] ${v.id} — ${v.help}\n  ${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(' '))
          .join('\n  ')}`,
    )
    .join('\n');
  expect(serious, report).toEqual([]);
}

test('dashboard pages with real data have no serious/critical axe violations (ar/en × light/dark)', async ({ page }) => {
  test.setTimeout(900_000);
  const api = await seededUser(page, user);
  try {
    const clear = (
      await createLink(api, `https://a11y-${runId}.e2e-fixture.example.org/`, { custom_title: `Accessible page ${runId}`, tags: ['a11y'], notes: 'notes' })
    ).public_id;
    const unknown = (await createLink(api, `https://a11y-unknown-${runId}.e2e-fixture.example.org/`)).public_id;
    await expect
      .poll(async () => ((await api.get(`/links/${clear}`)).body.data as { security: { status: string } }).security.status, { timeout: 30_000 })
      .not.toBe('PENDING');
    markClear(clear);
    const coll = (await api.post('/collections', { name: `A11y ${runId}`, visibility: 'PRIVATE' })).body.data as { public_id: string };
    await api.post(`/collections/${coll.public_id}/links`, { links: [clear, unknown] });

    const paths = [
      '/dashboard',
      '/dashboard/links',
      `/dashboard/links/${clear}`,
      `/dashboard/links/${clear}?tab=security`,
      `/dashboard/links/${clear}?tab=sharing`,
      `/dashboard/links/${unknown}?tab=sharing`,
      `/dashboard/links/${clear}?tab=edit`,
      '/dashboard/collections',
      `/dashboard/collections/${coll.public_id}`,
      '/dashboard/shared',
      `/dashboard/search?q=${encodeURIComponent('Accessible ' + runId)}`,
      '/dashboard/notifications',
      '/dashboard/settings',
    ];
    const pace = pacer();
    for (const locale of ['en', 'ar'] as const) {
      for (const theme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: theme });
        for (const path of paths) {
          await pace();
          await page.goto(`/${locale}${path}`);
          await expect(page.locator('main')).toBeVisible();
          await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 15_000 });
          await audit(page, `/${locale}${path} ${theme}`);
        }
      }
    }
  } finally {
    await deleteAccount(page.context(), user);
  }
});
