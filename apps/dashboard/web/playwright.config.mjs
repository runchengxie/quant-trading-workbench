import { defineConfig } from '@playwright/test';

const port = Number(process.env.WORKBENCH_E2E_PORT || 4173);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['line'],
    ['json', { outputFile: 'test-results/report.json' }],
  ],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `python3 -m http.server ${port} --directory dist --bind 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: !process.env.CI && !process.env.WORKBENCH_E2E_PORT,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
