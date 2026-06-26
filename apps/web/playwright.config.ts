import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// E2E runs against the production single-origin server: the API serves the
// built SPA plus /api on one port. The web client must be built first
// (`pnpm --filter @sourcesage/web build`). The shell tests don't require an
// LLM key — the chat round-trip is covered by the mocked API unit tests.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm --filter @sourcesage/api exec tsx src/index.ts',
    url: 'http://localhost:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { WEB_DIST: resolve('dist') },
  },
});
