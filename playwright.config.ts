import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false, // 👈 safer: avoids race conditions with mock mode / health checks
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'off',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  webServer: {
    // Run Next.js in production mode with mocks enabled
    // - NODE_ENV=production → ensures "next start" behavior
    // - MOCK_OPTIMIZELY=true → prevents live Optimizely calls (safe for CI/local runs)
    // - IS_BUILD=true → skips generateStaticParams/fetch that break outside request scope
    command:
      'cross-env NODE_ENV=production MOCK_OPTIMIZELY=true IS_BUILD=true ' +
      'pnpm build && ' +
      'cross-env NODE_ENV=production MOCK_OPTIMIZELY=true IS_BUILD=true ' +
      'pnpm start',

    // ✅ Health endpoint is a lightweight /api/health route that always returns 200.
    // This guarantees Playwright waits for readiness instead of looping on CMS mocks.
    url: 'http://localhost:3000/api/health',

    reuseExistingServer: false, // always start fresh for reliable test runs
    timeout: 120_000,
  },
})
