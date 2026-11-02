import { defineConfig, devices } from '@playwright/test';

/**
 * MOCK E2E SUITE — UI behaviour against e2e/mock-api/server.mjs, an in-memory double of the API
 * contract. This proves the UI logic, NOT the integration with Laravel. The real-backend suite lives in
 * e2e/real and runs with `npm run test:e2e:real` (playwright.real.config.ts).
 * Ports are dedicated (3100 / 8787) so a running dev setup on 3000 / 8000 is never touched.
 */
const FRONTEND = 'http://localhost:3100';
const API = 'http://localhost:8787';

export default defineConfig({
  testDir: './e2e/mock',
  outputDir: './test-results/mock',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/mock' }]],
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
    { command: 'node e2e/mock-api/server.mjs', url: `${API}/api/v1/public/categories`, reuseExistingServer: false, env: { MOCK_API_PORT: '8787', MOCK_FRONTEND_ORIGIN: FRONTEND } },
    {
      command: 'npm run build && npx next start -p 3100',
      url: `${FRONTEND}/en`,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
      env: { NEXT_PUBLIC_API_URL: API, NEXT_PUBLIC_SITE_URL: FRONTEND, NEXT_TELEMETRY_DISABLED: '1' },
    },
  ],
});
