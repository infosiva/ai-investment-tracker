import { defineConfig, devices } from '@playwright/test';
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
export default defineConfig({
  testDir: './qa',
  timeout: 30_000,
  retries: 1,
  use: { baseURL: BASE_URL, headless: true },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
