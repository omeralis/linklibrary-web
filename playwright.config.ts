import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run the real production build of this app against e2e/mock-api/server.mjs, an
 * in-memory double of the Laravel API contract (the real backend needs PHP 8.4 + PostgreSQL 18).
 * Ports are dedicated (3100 / 8787) so a running dev setup on 3000 / 8000 is never touched.
 * To run against the real backend instead, see README → "E2E against the real API".
 */
const FRONTEND = 'http://localhost:3100';
const API = process.env.E2E_API_URL ?? 'http://localhost:8787';
const useMock = !process.env.E2E_API_URL;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: FRONTEND,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'en-US',
    timezoneId: 'Asia/Riyadh',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec/ },
  ],
  webServer: [
    ...(useMock
      ? [{ command: 'node e2e/mock-api/server.mjs', url: `${API}/api/v1/public/categories`, reuseExistingServer: false, env: { MOCK_API_PORT: '8787', MOCK_FRONTEND_ORIGIN: FRONTEND } }]
      : []),
    {
      command: 'npm run build && npx next start -p 3100',
      url: `${FRONTEND}/en`,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
      env: { NEXT_PUBLIC_API_URL: API, NEXT_PUBLIC_SITE_URL: FRONTEND, NEXT_TELEMETRY_DISABLED: '1' },
    },
  ],
});
