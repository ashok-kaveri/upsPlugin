import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { upsWooSlackLayout } from './src/reporters/slackLayout';

dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

const reporters = [['html']] as NonNullable<
  ReturnType<typeof defineConfig>['reporter']
>;

if (process.env.SLACK_WEBHOOK_URL) {
  reporters.push([
    './node_modules/playwright-slack-report/dist/src/SlackReporter.js',
    {
      slackWebHookUrl: process.env.SLACK_WEBHOOK_URL,
      slackWebHookChannel: 'plugins_automation_reports',
      channels: ['plugins_automation_reports'],
      sendResults: 'always',
      projectName: 'UPS Woo Automation',
      layout: upsWooSlackLayout,
      maxNumberOfFailuresToShow: 5,
      payloadOverrides: {
        username: 'UPS-Woo-QA-Bot',
        icon_emoji: ':robot_face:',
      },
    },
  ]);
}

export default defineConfig({
  timeout: 60 * 1000,

  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    storageState: 'playwright/.auth/user.json',
  },

  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: reporters,

  /* Configure projects for major browsers */
  projects: [
    // { name: 'setup', testMatch: /.*\.setup\.ts/ },

    {
      name: 'google chrome',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.site_url,
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: process.env.site_url,
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        baseURL: process.env.site_url,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
