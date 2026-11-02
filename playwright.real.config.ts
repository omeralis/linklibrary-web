import { defineConfig, devices } from '@playwright/test';

/**
 * REAL-BACKEND E2E SUITE — the production build of this app against a running Laravel API.
 *
 * Requirements (see docs/REAL_BACKEND_INTEGRATION_REPORT.md → "Reproduce"):
 *  - The API on E2E_API_URL (default http://localhost:8000) backed by an ISOLATED database
 *    (e.g. linklibrary_e2e — never the development database), APP_ENV=local, MAIL_MAILER=log,
 *    a queue worker, and SECURITY_BLOCKLIST_HOSTS=malware-fixture.example.net.
 *  - E2E_BACKEND_DIR pointing at the Laravel project (default ../LinkLibrary) so the suite can read
 *    e-mails from storage/logs/laravel.log and run `php artisan linklibrary:dev-mark-clear` for the
 *    fixture links it creates (local-only manual review; never used in production).
 * Every test creates its own disposable users (…@e2e.example.com) and deletes them at the end.
 */
const FRONTEND = process.env.E2E_FRONTEND_URL ?? 'http://localhost:3000';
const API = process.env.E2E_API_URL ?? 'http://localhost:8000';
const port = new URL(FRONTEND).port || '3000';

export default defineConfig({
  testDir: './e2e/real',
  globalSetup: './e2e/real/global-setup.ts',
  globalTeardown: './e2e/real/global-teardown.ts',
  outputDir: './test-results/real',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/real/results.json' }], ['html', { open: 'never', outputFolder: 'playwright-report/real' }]],
  use: {
    baseURL: FRONTEND,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-US',
    timezoneId: 'Asia/Riyadh',
  },
  projects: [
    { name: 'real-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } }, testIgnore: /responsive\.spec/ },
    { name: 'real-mobile', use: { ...devices['Pixel 7'] }, testMatch: /responsive\.spec/ },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    url: `${FRONTEND}/en`,
    timeout: 300_000,
    reuseExistingServer: true,
    env: { NEXT_PUBLIC_API_URL: API, NEXT_PUBLIC_SITE_URL: FRONTEND, NEXT_TELEMETRY_DISABLED: '1' },
  },
});
