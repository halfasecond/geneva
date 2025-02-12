import type { PlaywrightTestConfig } from 'playwright';

const config: PlaywrightTestConfig = {
  testDir: './src/tests',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3131',
    trace: 'on-first-retry',
    viewport: { width: 900, height: 600 },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 900, height: 600 },
        launchOptions: {
          args: ['--no-sandbox']
        }
      },
    },
  ],
  webServer: {
    command: 'yarn dev',
    url: 'http://localhost:3131',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
};

export default config;